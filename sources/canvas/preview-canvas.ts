import {
  canvas,
  SHEET_WIDTH,
  SHEET_HEIGHT,
  isOffscreenCanvasInitialized,
} from "./renderer.ts";
import { drawTransparencyBackground, get2DContext } from "./canvas-utils.ts";
import { FRAME_SIZE } from "../state/constants.ts";
import { applyTransparencyMaskToCanvas } from "./mask.ts";
import {
  activeCustomAnimation,
  getCustomAnimations,
} from "./preview-animation.ts";

export let previewCanvas: HTMLCanvasElement | null = null;
export let previewCtx: CanvasRenderingContext2D | null = null;

let currentCharacterSize = 1;
let currentPixelDensity = 1;

/**
 * Size the DOM spritesheet preview canvas to match the offscreen buffer (or standard sheet size
 * before init) so layout does not jump when the first copy runs.
 */
export function primeSpritesheetPreviewCanvasElement(
  previewCanvasElement: HTMLCanvasElement,
): void {
  const w =
    isOffscreenCanvasInitialized() && canvas ? canvas.width : SHEET_WIDTH;
  const h =
    isOffscreenCanvasInitialized() && canvas ? canvas.height : SHEET_HEIGHT;
  previewCanvasElement.width = w;
  previewCanvasElement.height = h;
  const ctx = get2DContext(previewCanvasElement);
  ctx.clearRect(0, 0, w, h);
}

/**
 * Copy offscreen canvas to a preview canvas with optional transparency grid.
 */
export function copyToPreviewCanvas(
  previewCanvasElement: HTMLCanvasElement,
  showTransparencyGrid: boolean = false,
  applyTransparencyMask: boolean = false,
  zoomLevel: number = 1,
): void {
  if (!canvas) {
    return;
  }

  const previewCtx = get2DContext(previewCanvasElement);

  if (
    previewCanvasElement.width !== canvas.width ||
    previewCanvasElement.height !== canvas.height
  ) {
    previewCanvasElement.width = canvas.width;
    previewCanvasElement.height = canvas.height;
  }

  previewCtx.clearRect(
    0,
    0,
    previewCanvasElement.width,
    previewCanvasElement.height,
  );

  if (showTransparencyGrid) {
    drawTransparencyBackground(
      previewCtx,
      previewCanvasElement.width,
      previewCanvasElement.height,
    );
  }

  if (applyTransparencyMask) {
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = canvas.width;
    tmpCanvas.height = canvas.height;
    const tmpCtx = get2DContext(tmpCanvas);
    tmpCtx.drawImage(canvas, 0, 0);
    applyTransparencyMaskToCanvas(tmpCanvas, tmpCtx);
    previewCtx.drawImage(tmpCanvas, 0, 0);
  } else {
    previewCtx.drawImage(canvas, 0, 0);
  }

  if (zoomLevel !== 1) {
    previewCanvasElement.style.zoom = zoomLevel.toString();
  }
}

export function initPreviewCanvas(
  previewCanvasElement: HTMLCanvasElement,
): void {
  previewCanvas = previewCanvasElement;
  previewCtx = get2DContext(previewCanvas);
  const customAnimations = getCustomAnimations();

  let frameSize = FRAME_SIZE;
  if (activeCustomAnimation && customAnimations) {
    const customAnimDef = customAnimations[activeCustomAnimation];
    if (customAnimDef) {
      frameSize = customAnimDef.frameSize;
    }
  }

  previewCanvas.width = 4 * frameSize;
  previewCanvas.height = frameSize;

  applyCharacterSize(currentCharacterSize);
  applyPixelDensity(currentPixelDensity);
}

export function setPreviewCanvasZoom(zoomLevel: number): void {
  if (previewCanvas) {
    previewCanvas.style.zoom = zoomLevel.toString();
  }
}

/**
 * Character size: controls how many CSS pixels each game pixel occupies.
 * At 1x the canvas displays at native resolution; at 3x each pixel is 3x3 CSS pixels.
 */
export function setCharacterSize(size: number): void {
  currentCharacterSize = size;
  applyCharacterSize(size);
}

function applyCharacterSize(size: number): void {
  if (!previewCanvas) return;
  const w = previewCanvas.width;
  const h = previewCanvas.height;
  if (size === 1) {
    previewCanvas.style.width = "";
    previewCanvas.style.height = "";
  } else {
    previewCanvas.style.width = `${w * size}px`;
    previewCanvas.style.height = `${h * size}px`;
  }
}

/**
 * Pixel density: controls the internal rendering resolution of the preview canvas.
 * At 2x the canvas renders at double resolution (2x the native frame size),
 * then displays at the character-size CSS dimensions, making each game pixel
 * sharper with more sub-pixel information.
 */
export function setPixelDensity(density: number): void {
  currentPixelDensity = density;
  applyPixelDensity(density);
}

function applyPixelDensity(density: number): void {
  if (!previewCanvas || !previewCtx) return;

  const customAnimations = getCustomAnimations();
  let frameSize = FRAME_SIZE;
  if (activeCustomAnimation && customAnimations) {
    const customAnimDef = customAnimations[activeCustomAnimation];
    if (customAnimDef) {
      frameSize = customAnimDef.frameSize;
    }
  }

  const nativeW = 4 * frameSize;
  const nativeH = frameSize;

  const newW = nativeW * density;
  const newH = nativeH * density;

  if (previewCanvas.width !== newW || previewCanvas.height !== newH) {
    previewCanvas.width = newW;
    previewCanvas.height = newH;
  }

  applyCharacterSize(currentCharacterSize);
}
