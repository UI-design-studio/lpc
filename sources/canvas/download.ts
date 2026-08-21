import type { ResultAsync } from "neverthrow";
import { canvasToBlob } from "./canvas-utils.ts";
import { getCanvas, type CanvasNotInitialized } from "./renderer.ts";

type GetCanvasBlobFn = () => ResultAsync<Blob, CanvasNotInitialized>;

async function canvasToBlobScaled(
  srcCanvas: HTMLCanvasElement,
  scale: number,
): Promise<Blob> {
  if (scale <= 1) {
    return canvasToBlob(srcCanvas);
  }
  const scaled = document.createElement("canvas");
  scaled.width = srcCanvas.width * scale;
  scaled.height = srcCanvas.height * scale;
  const scaledCtx = scaled.getContext("2d")!;
  scaledCtx.imageSmoothingEnabled = false;
  scaledCtx.drawImage(srcCanvas, 0, 0, scaled.width, scaled.height);
  return canvasToBlob(scaled);
}

/**
 * Download canvas as PNG (exports the offscreen canvas directly).
 * `getCanvasBlobFunc` defaults to the real renderer canvas; tests inject a stub.
 */
export async function downloadAsPNG(
  filename: string = "character-spritesheet.png",
  scale: number = 1,
  getCanvasBlobFunc?: GetCanvasBlobFn,
): Promise<void> {
  if (getCanvasBlobFunc) {
    const blobResult = await getCanvasBlobFunc();
    if (blobResult.isErr()) {
      console.error("Error downloading PNG:", blobResult.error);
      return;
    }
    const url = URL.createObjectURL(blobResult.value);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const canvasResult = getCanvas();
  if (canvasResult.isErr()) {
    console.error("Error downloading PNG:", canvasResult.error);
    return;
  }
  const blob = await canvasToBlobScaled(canvasResult.value, scale);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadFile(
  content: string,
  filename: string,
  type: string = "text/plain",
): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
