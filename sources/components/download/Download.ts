// Download component
import m from "mithril";
import { state } from "../../state/state.ts";
import { drawCalls } from "../../canvas/renderer.ts";
import {
  getAllCredits,
  creditsToCsv,
  creditsToTxt,
} from "../../utils/credits.ts";
import { CollapsibleSection } from "../CollapsibleSection.ts";
import { downloadFile, downloadAsPNG } from "../../canvas/download.ts";
import {
  importStateFromJSON,
  exportStateAsJSON,
  serializeLayersForJson,
} from "../../state/json.ts";
import {
  exportSplitAnimations,
  exportSplitItemSheets,
  exportSplitItemAnimations,
  exportIndividualFrames,
} from "../../state/zip.ts";
import { debugLog } from "../../utils/debug.ts";
import type { CatalogReader } from "../../state/catalog.ts";
import { t } from "../../i18n/index.ts";

const zipExportTitle = t("download.zip_loading");

export const Download: m.Component<{ catalog: CatalogReader }> = {
  view(vnode) {
    const zipDisabled = !vnode.attrs.catalog.isLayersReady();

    const exportToClipboard = async (): Promise<void> => {
      if (!window.canvasRenderer) return;
      try {
        const json = exportStateAsJSON(
          vnode.attrs.catalog,
          state,
          serializeLayersForJson(drawCalls),
        );
        debugLog(json);
        await navigator.clipboard.writeText(json);
        alert(t("download.exported"));
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
        alert(t("download.export_failed"));
      }
    };

    const importFromClipboard = async (): Promise<void> => {
      if (!window.canvasRenderer) return;
      try {
        const json = await navigator.clipboard.readText();
        debugLog(json);
        const imported = importStateFromJSON(vnode.attrs.catalog, json);
        Object.assign(state, imported);

        m.redraw();
        alert(t("download.imported"));
      } catch (err) {
        console.error("Failed to import from clipboard:", err);
        alert(
          t("download.import_failed"),
        );
      }
    };

    const saveAsPNG = () => {
      if (!window.canvasRenderer) return;
      downloadAsPNG("character-spritesheet.png", state.exportScale);
    };

    return m(
      CollapsibleSection,
      {
        title: t("download.title"),
        defaultOpen: true,
      },
      [
        m("div.buttons.is-flex.is-flex-wrap-wrap", { id: "download-buttons" }, [
          m(
            "button.button.is-small.is-primary",
            { onclick: saveAsPNG },
            t("download.png"),
          ),
          m(
            "button.button.is-small",
            {
              onclick: () => {
                const allCredits = getAllCredits(
                  vnode.attrs.catalog,
                  state.selections,
                  state.bodyType,
                );
                const txtContent = creditsToTxt(allCredits);
                downloadFile(txtContent, "credits.txt", "text/plain");
              },
            },
            t("download.credits_txt"),
          ),
          m(
            "button.button.is-small",
            {
              onclick: () => {
                const allCredits = getAllCredits(
                  vnode.attrs.catalog,
                  state.selections,
                  state.bodyType,
                );
                const csvContent = creditsToCsv(allCredits);
                downloadFile(csvContent, "credits.csv", "text/csv");
              },
            },
            t("download.credits_csv"),
          ),
          m(
            "button.button.is-small.is-info",
            {
              disabled: zipDisabled,
              title: zipDisabled ? zipExportTitle : undefined,
              onclick: () => exportSplitAnimations(vnode.attrs.catalog),
            },
            t("download.zip_by_animation"),
          ),
          state.zipByAnimation.isRunning ? m("span.loading") : null,
          m(
            "button.button.is-small.is-info",
            {
              disabled: zipDisabled,
              title: zipDisabled ? zipExportTitle : undefined,
              onclick: () => exportSplitItemSheets(vnode.attrs.catalog),
            },
            t("download.zip_by_item"),
          ),
          state.zipByItem.isRunning ? m("span.loading") : null,
          m(
            "button.button.is-small.is-info",
            {
              disabled: zipDisabled,
              title: zipDisabled ? zipExportTitle : undefined,
              onclick: () => exportSplitItemAnimations(vnode.attrs.catalog),
            },
            t("download.zip_by_animation_item"),
          ),
          state.zipByAnimationAndItem.isRunning ? m("span.loading") : null,
          m(
            "button.button.is-small.is-info",
            {
              disabled: zipDisabled,
              title: zipDisabled ? zipExportTitle : undefined,
              onclick: () => exportIndividualFrames(vnode.attrs.catalog),
            },
            t("download.zip_by_animation_frame"),
          ),
          state.zipIndividualFrames && state.zipIndividualFrames.isRunning
            ? m("span.loading")
            : null,
          m(
            "button.button.is-small.is-link",
            { onclick: exportToClipboard },
            t("download.export_json"),
          ),
          m(
            "button.button.is-small.is-link",
            { onclick: importFromClipboard },
            t("download.import_json"),
          ),
        ]),
      ],
    );
  },
};
