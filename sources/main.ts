// Main entry point - initializes and mounts the Mithril application

import m from "mithril";
import "./styles/critical-entry.scss";
import "./vendor-globals.ts";
import { loadAllMetadata } from "./install-item-metadata.ts";
import { createCatalog, type CatalogReader } from "./state/catalog.ts";

// Import debug first so `window.DEBUG` is set before other modules run.
import { debugLog, getDebugParam } from "./utils/debug.ts";

export { getDebugParam };

// Import canvas renderer
import * as canvasRenderer from "./canvas/renderer.ts";

// Import palette recoloring
import {
  getRecolorStats,
  resetRecolorStats,
  setPaletteRecolorMode,
  getPaletteRecolorConfig,
} from "./canvas/palette-recolor.ts";
import type {
  RecolorStats,
  RecolorMode,
  RecolorConfig,
} from "./canvas/palette-recolor.ts";

declare global {
  interface Window {
    /** Console-only diagnostic; logs and returns recolor pipeline stats. */
    getPaletteRecolorStats?: () => RecolorStats;
    /** Console-only diagnostic; resets the recolor stats counters. */
    resetPaletteRecolorStats?: () => void;
    /** Console-only; force the recolor mode. */
    setPaletteRecolorMode?: (mode: RecolorMode) => void;
    /** Console-only; reads current recolor config. */
    getPaletteRecolorConfig?: () => RecolorConfig;
    /** Set by main.ts after boot; awaited inside the DOMContentLoaded handler. */
    setDefaultSelections?: () => Promise<void>;
  }
}

// Expose palette recolor stats globally
window.getPaletteRecolorStats = () => {
  const stats = getRecolorStats();
  const total = stats.webgl + stats.cpu + stats.fallback;
  debugLog("📊 Palette Recolor Statistics:");
  debugLog(
    `  WebGL (GPU): ${stats.webgl} (${total ? ((stats.webgl / total) * 100).toFixed(1) : 0}%)`,
  );
  debugLog(
    `  CPU: ${stats.cpu} (${total ? ((stats.cpu / total) * 100).toFixed(1) : 0}%)`,
  );
  debugLog(
    `  Fallback: ${stats.fallback} (${total ? ((stats.fallback / total) * 100).toFixed(1) : 0}%)`,
  );
  debugLog(`  Total: ${total}`);
  return stats;
};
window.resetPaletteRecolorStats = resetRecolorStats;
window.setPaletteRecolorMode = setPaletteRecolorMode;
window.getPaletteRecolorConfig = getPaletteRecolorConfig;

// Import state management
import { configureStateCatalog, initState, state } from "./state/state.ts";
import { initHashChangeListener } from "./state/hash.ts";

// Import components
import { App } from "./components/App.ts";
import { AnimationPreview } from "./components/preview/AnimationPreview.ts";
import { FullSpritesheetPreview } from "./components/preview/FullSpritesheetPreview.ts";
import { Credits } from "./components/download/Credits.ts";

// Import performance profiler
import { PerformanceProfiler } from "./performance-profiler.ts";

const applicationCatalog = createCatalog();
configureStateCatalog(applicationCatalog);
installCatalogReadinessHooksForVisualTooling(applicationCatalog);

// DEBUG mode will be turned on if on localhost and off in production
// but this can be overridden by adding debug=(true|false) to the querystring.
export const DEBUG = getDebugParam();

// Initialize performance profiler (uses same DEBUG flag as console logging)
export const profiler = new PerformanceProfiler({
  enabled: DEBUG,
  verbose: false,
  logSlowOperations: true,
});

// Always expose profiler globally for manual control (window.DEBUG is set in utils/debug.ts)
window.profiler = profiler;

// Expose canvas renderer to global scope for compatibility
window.canvasRenderer = canvasRenderer;

// Expose initialization function to be called after canvas is ready
window.setDefaultSelections = async function () {
  await initState();
};

// Start metadata chunk fetches as soon as the entry module runs (no DOM required),
// so download/parse overlaps HTML parse and the rest of this file.
void loadAllMetadata(applicationCatalog);

// Inject deferred CSS (Bulma remainder + app styles) as a <link> so the browser loads it.
// The previous `import("./load-deferred-styles.ts")` was a no-op in prod because the
// module body has no exports — Rolldown collapsed it and the CSS never loaded.
import deferredCssHref from "./styles/deferred-entry.scss?url";
function injectDeferredStyles(href: string): void {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}
if ("requestIdleCallback" in window) {
  requestIdleCallback(() => injectDeferredStyles(deferredCssHref));
} else {
  setTimeout(() => injectDeferredStyles(deferredCssHref), 0);
}

/** Guard hash hydration and initial rendering after index + lite are registered. */
let hashHydrationInitDone = false;

// Wait for DOM to be ready, then mount UI; catalog may already be loading or ready.
document.addEventListener("DOMContentLoaded", () => {
  // Mount roots are static markup in index.html; assert non-null.
  // main.ts is the composition root; App and sibling previews receive the same catalog.
  m.mount(document.getElementById("mithril-filters")!, {
    view: () => m(App, { catalog: applicationCatalog }),
  });
  m.mount(document.getElementById("mithril-preview")!, {
    view: () => m(AnimationPreview, { catalog: applicationCatalog }),
  });
  m.mount(document.getElementById("mithril-spritesheet-preview")!, {
    view: () => m(FullSpritesheetPreview, { catalog: applicationCatalog }),
  });

  // Mount Credits into the modal overlay (hidden by default)
  const modalContent = document.getElementById("credits-modal-content");
  if (modalContent) {
    m.mount(modalContent, {
      view: () => m(Credits, { catalog: applicationCatalog }),
    });
  }

  clearShellLoadingClass();

  void (async () => {
    await Promise.all([
      applicationCatalog.ready.onIndexReady,
      applicationCatalog.ready.onLiteReady,
    ]);
    if (hashHydrationInitDone) return;
    hashHydrationInitDone = true;

    canvasRenderer.initCanvas();

    initHashChangeListener(applicationCatalog);

    // Before first render: overlay uses this; during render, `isRenderingCharacter` hides overlay.
    state.previewBootstrapRenderDone = true;

    if (window.setDefaultSelections) {
      await window.setDefaultSelections();
    }

    m.redraw();
  })();
});

/** Strips shell spinner from Mithril mount roots only (see index.html), not in-component spinners. */
const SHELL_LOADING_ROOT_IDS = [
  "mithril-filters",
  "mithril-preview",
  "mithril-spritesheet-preview",
];

function clearShellLoadingClass(): void {
  for (const id of SHELL_LOADING_ROOT_IDS) {
    document.getElementById(id)?.classList.remove("loading");
  }
}

/**
 * Expose metadata readiness to Playwright, Argos, and dump-computed-styles.
 * These tools execute in a separate browser context and need a global bridge
 * to wait for dynamically imported catalog chunks before inspecting the UI.
 */
function installCatalogReadinessHooksForVisualTooling(
  catalog: CatalogReader,
): void {
  (
    globalThis as unknown as {
      __LPC_waitCatalogAllReady: () => Promise<void>;
    }
  ).__LPC_waitCatalogAllReady = async () => {
    await catalog.ready.onAllReady;
  };

  (
    globalThis as unknown as {
      __LPC_arePaletteModalMetadataChunksReady: () => boolean;
    }
  ).__LPC_arePaletteModalMetadataChunksReady = () =>
    catalog.isIndexReady() &&
    catalog.isLiteReady() &&
    catalog.isCreditsReady() &&
    catalog.isPaletteReady() &&
    catalog.isLayersReady();
}
