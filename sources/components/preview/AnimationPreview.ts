// Animation Preview component
import m from "mithril";
import { state } from "../../state/state.ts";
import { ANIMATIONS } from "../../state/constants.ts";
import { CollapsibleSection } from "../CollapsibleSection.ts";
import {
  repaintStaticPreviewFrameForTests,
  setPreviewAnimation,
  startPreviewAnimation,
  stopPreviewAnimation,
  getCustomAnimations,
} from "../../canvas/preview-animation.ts";
import {
  initPreviewCanvas,
  setPreviewCanvasZoom,
  setCharacterSize,
  setPixelDensity,
} from "../../canvas/preview-canvas.ts";
import PinchToZoom from "./PinchToZoom.ts";
import { ScrollableContainer } from "./ScrollableContainer.ts";
import { PreviewMetadataLoadingOverlay } from "./PreviewMetadataLoadingOverlay.ts";
import type { CatalogReader } from "../../state/catalog.ts";
import { tInterp } from "../../i18n/index.ts";

type PreviewCanvasAttrs = {
  selectedAnimation: string;
  zoomLevel: number;
  onFrameCycleUpdate: (frameCycle: string) => void;
};

type PreviewCanvasState = {
  zoomLevel: number;
  lastAnimation: string;
  _pinchUnmounted: boolean;
  pinch: PinchToZoom | null;
};

const PreviewCanvas: m.Component<PreviewCanvasAttrs, PreviewCanvasState> = {
  oncreate(vnode) {
    const canvas = vnode.dom as HTMLCanvasElement;
    const { selectedAnimation, onFrameCycleUpdate } = vnode.attrs;
    const zoomLevel = vnode.attrs.zoomLevel || 1;

    if (!window.canvasRenderer) {
      console.error("Canvas renderer not available yet");
      return;
    }

    initPreviewCanvas(canvas);
    setCharacterSize(state.characterDisplaySize || 1);
    setPixelDensity(state.previewPixelSize || 1);
    setPreviewCanvasZoom(state.previewCanvasZoomLevel || 1);
    const frames = setPreviewAnimation(selectedAnimation);
    startPreviewAnimation();

    if (frames) {
      onFrameCycleUpdate(frames.join("-"));
    }

    vnode.state.zoomLevel = zoomLevel;
    vnode.state.lastAnimation = selectedAnimation;
    vnode.state._pinchUnmounted = false;
    vnode.state.pinch = null;
    PinchToZoom.create(
      canvas,
      (scale) => {
        vnode.state.zoomLevel = scale;

        if (window.canvasRenderer) {
          m.redraw();
          setPreviewCanvasZoom(vnode.state.zoomLevel);
        }

        state.previewCanvasZoomLevel = vnode.state.zoomLevel;
      },
      vnode.state.zoomLevel,
    ).then((pinch) => {
      if (vnode.state._pinchUnmounted) {
        pinch.destroy();
        return;
      }
      vnode.state.pinch = pinch;
    });
  },
  onupdate(vnode) {
    const { selectedAnimation } = vnode.attrs;

    if (vnode.state.lastAnimation !== selectedAnimation) {
      if (window.canvasRenderer) {
        stopPreviewAnimation();
        setPreviewAnimation(selectedAnimation);
        initPreviewCanvas(vnode.dom as HTMLCanvasElement);
        startPreviewAnimation();
      }
      vnode.state.lastAnimation = selectedAnimation;
    }

    vnode.state.zoomLevel = state.previewCanvasZoomLevel || 1;
    repaintStaticPreviewFrameForTests();
  },
  onremove(vnode) {
    vnode.state._pinchUnmounted = true;
    vnode.state.pinch?.destroy();
    vnode.state.pinch = null;
    if (window.canvasRenderer) {
      stopPreviewAnimation();
    }
  },
  view() {
    return m("canvas#previewAnimations");
  },
};

type AnimationOption = { value: string; label: string };

type AnimationPreviewState = {
  selectedAnimation: string;
  zoomLevel: number;
  characterSize: number;
  pixelDensity: number;
  frameCycle: string;
};

export const AnimationPreview: m.Component<
  { catalog: CatalogReader },
  AnimationPreviewState
> = {
  oninit(vnode) {
    vnode.state.selectedAnimation = "walk";
    vnode.state.zoomLevel = state.previewCanvasZoomLevel || 1;
    vnode.state.characterSize = state.characterDisplaySize || 1;
    vnode.state.pixelDensity = state.previewPixelSize || 1;
    if (window.canvasRenderer) {
      const frames = setPreviewAnimation("walk");
      vnode.state.frameCycle = frames ? frames.join("-") : "";
    } else {
      vnode.state.frameCycle = "";
    }
  },
  onupdate(vnode) {
    vnode.state.zoomLevel = state.previewCanvasZoomLevel || 1;
    vnode.state.characterSize = state.characterDisplaySize || 1;
    vnode.state.pixelDensity = state.previewPixelSize || 1;
  },
  view(vnode) {
    const customAnims = Object.keys(getCustomAnimations());
    const allAnimations: AnimationOption[] = [
      ...ANIMATIONS,
      ...customAnims.map((anim) => ({
        value: anim,
        label: anim.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      })),
    ];

    if (
      !allAnimations.find(
        (anim) => anim.value === vnode.state.selectedAnimation,
      )
    ) {
      vnode.state.selectedAnimation = "walk";
      state.selectedAnimation = "walk";
      if (window.canvasRenderer) {
        const frames = setPreviewAnimation("walk");
        vnode.state.frameCycle = frames ? frames.join("-") : "";
      }
    }

    const makeCompactSlider = (
      label: string,
      value: number,
      min: number,
      max: number,
      step: number,
      format: (v: number) => string,
      onInput: (v: number) => void,
    ) =>
      m("div.column.is-4", [
        m("div.field.is-horizontal.is-align-items-center", [
          m("div.field-label.is-normal", [
            m("label.label.mb-0", `${label} ${format(value)}`),
          ]),
          m("div.field-body", [
            m("div.field.mb-0", [
              m("div.control.is-expanded", [
                m("input.is-fullwidth[type=range]", {
                  min,
                  max,
                  step,
                  value,
                  oninput: (e: Event) => {
                    const target = e.target as HTMLInputElement;
                    onInput(
                      step >= 1
                        ? parseInt(target.value, 10)
                        : parseFloat(target.value),
                    );
                  },
                }),
              ]),
            ]),
          ]),
        ]),
      ]);

    return m(
      CollapsibleSection,
      {
        title: tInterp("preview.animation_title", {}),
        defaultOpen: true,
        boxClass: "box",
      },
      [
        m("div.field.is-horizontal.is-align-items-center", [
          m("div.field-label.is-normal", [
            m("label.label.mb-0", tInterp("preview.animation", {})),
          ]),
          m("div.field-body", [
            m("div.field.has-addons.mb-0", [
              m("div.control", [
                m("div.select", [
                  m(
                    "select",
                    {
                      value: vnode.state.selectedAnimation,
                      onchange: (e: Event) => {
                        const target = e.target as HTMLSelectElement;
                        vnode.state.selectedAnimation = target.value;
                        state.selectedAnimation =
                          vnode.state.selectedAnimation;
                        if (window.canvasRenderer) {
                          const frames = setPreviewAnimation(target.value);
                          vnode.state.frameCycle = frames
                            ? frames.join("-")
                            : "";
                        }
                      },
                    },
                    allAnimations.map((anim) =>
                      m("option", { value: anim.value }, anim.label),
                    ),
                  ),
                ]),
              ]),
              m("div.control", [
                m("span.button.is-static.is-light", vnode.state.frameCycle),
              ]),
            ]),
          ]),
        ]),
        m("div.columns.is-variable.is-2.mt-2", [
          makeCompactSlider(
            tInterp("preview.character_size", {}),
            vnode.state.characterSize,
            1,
            6,
            1,
            (v) => `${v}x`,
            (v) => {
              vnode.state.characterSize = v;
              state.characterDisplaySize = v;
              if (window.canvasRenderer) {
                setCharacterSize(v);
              }
            },
          ),
          makeCompactSlider(
            tInterp("preview.pixel_size", {}),
            vnode.state.pixelDensity,
            1,
            6,
            1,
            (v) => `${v}x`,
            (v) => {
              vnode.state.pixelDensity = v;
              state.previewPixelSize = v;
              if (window.canvasRenderer) {
                setPixelDensity(v);
              }
            },
          ),
          makeCompactSlider(
            tInterp("preview.zoom", {}),
            vnode.state.zoomLevel,
            0.5,
            6,
            0.1,
            (v) => `${Math.round(v * 100)}%`,
            (v) => {
              vnode.state.zoomLevel = v;
              state.previewCanvasZoomLevel = v;
              if (window.canvasRenderer) {
                setPreviewCanvasZoom(v);
              }
            },
          ),
        ]),
        m("div.mt-3", [
          m("div.preview-canvas-area", [
            m(ScrollableContainer, { classes: "spritesheet-preview" }, [
              m("div.preview-canvas-root", [
                m(PreviewCanvas, {
                  selectedAnimation: vnode.state.selectedAnimation,
                  zoomLevel: vnode.state.zoomLevel,
                  onFrameCycleUpdate: (frameCycle) => {
                    vnode.state.frameCycle = frameCycle;
                  },
                }),
                state.isRenderingCharacter
                  ? m("div.preview-canvas-busy", { "aria-hidden": true }, [
                      m("span.loading", {
                        "aria-label": tInterp("preview.rendering", {}),
                      }),
                    ])
                  : null,
                m(PreviewMetadataLoadingOverlay, {
                  catalog: vnode.attrs.catalog,
                }),
              ]),
            ]),
          ]),
        ]),
      ],
    );
  },
};
