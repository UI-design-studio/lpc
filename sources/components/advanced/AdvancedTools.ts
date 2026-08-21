// Advanced Tools component
import m from "mithril";
import { state } from "../../state/state.ts";
import { CollapsibleSection } from "../CollapsibleSection.ts";
import { t } from "../../i18n/index.ts";
import { setAnimationSpeed } from "../../canvas/preview-animation.ts";

// Custom zPos range → descriptive group
const LAYER_TABLE: [string, string][] = [
  ["-2", t("advanced.wheelchair_bg")],
  ["-1", t("advanced.weapon_behind")],
  ["0", t("advanced.shadow")],
  ["2 ~ 4", t("advanced.shield_base_pattern")],
  ["5 ~ 6", t("advanced.wings_tail_cape")],
  ["7", t("advanced.horns_back")],
  ["8 ~ 9", t("advanced.weapon_chain_hair_back")],
  ["10", t("advanced.body_base")],
  ["14 ~ 15", t("advanced.feet_socks_shoes")],
  ["20", t("advanced.legs_pants_skirt")],
  ["25 ~ 27", t("advanced.boots_toe")],
  ["30 ~ 32", t("advanced.dress_kimono")],
  ["35 ~ 36", t("advanced.shirt_sleeve")],
  ["38 ~ 40", t("advanced.overalls_apron")],
  ["45", t("advanced.vest_corset")],
  ["50", t("advanced.chainmail")],
  ["55 ~ 59", t("advanced.jacket_tabard")],
  ["60", t("advanced.armour_shoulder")],
  ["65 ~ 66", t("advanced.belt_sash_obi")],
  ["70 ~ 75", t("advanced.gloves_bracer_belt")],
  ["80 ~ 81", t("advanced.necklace_amulet")],
  ["85", t("advanced.cape_fg_tail")],
  ["90", t("advanced.bowtie_scarf")],
  ["95", t("advanced.horns_headwear")],
  ["100", t("advanced.head_prosthesis")],
  ["101 ~ 107", t("advanced.face_eyes_brow")],
  ["105", t("advanced.ears_nose_wings_fg")],
  ["110", t("advanced.shield_top_beard")],
  ["111 ~ 112", t("advanced.shield_paint_pattern_top")],
  ["114 ~ 115", t("advanced.earring_glasses_wound")],
  ["120 ~ 121", t("advanced.hair_bandana")],
  ["125 ~ 128", t("advanced.headband_ear_extension")],
  ["130 ~ 132", t("advanced.helmet_hat_hood")],
  ["135", t("advanced.helmet_morion")],
  ["139", t("advanced.helmet_crest_plumage")],
  ["140 ~ 141", t("advanced.weapon_main_bow")],
  ["145 ~ 146", t("advanced.kimono_trim")],
  ["150", t("advanced.weapon_attack_tool")],
];

const EXPORT_SCALES = [1, 2, 3, 4];
const BG_COLORS = [
  { value: "", label: "透明" },
  { value: "#ffffff", label: "白色" },
  { value: "#000000", label: "黑色" },
  { value: "#2d2d2d", label: "深灰" },
  { value: "#4a90d9", label: "蓝色" },
  { value: "#50c878", label: "绿色" },
  { value: "#ff6b6b", label: "红色" },
  { value: "#f5deb3", label: "小麦色" },
];

export const AdvancedTools: m.Component = {
  view() {
    const handleFileUpload = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      const img = new Image();
      img.onload = () => {
        state.customUploadedImage = img;
        m.redraw();
      };
      img.src = URL.createObjectURL(file);
    };

    const handleZPosChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const value = parseInt(target.value, 10);
      state.customImageZPos = isNaN(value) ? 0 : value;
      m.redraw();
    };

    const clearCustomImage = () => {
      state.customUploadedImage = null;
      state.customImageZPos = 0;
      const fileInput = document.getElementById(
        "customFileInput",
      ) as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      m.redraw();
    };

    return m(
      CollapsibleSection,
      {
        title: t("advanced.title"),
        defaultOpen: false,
      },
      [
        m("div.field", [
          m("label.label", t("advanced.upload_label")),
          m("div.control", [
            m("input.input[type=file]#customFileInput", {
              accept: "image/*",
              onchange: handleFileUpload,
            }),
          ]),
          m("p.help", t("advanced.upload_help")),
        ]),
        m("div.field", [
          m("label.label", [
            t("advanced.zpos_label"),
            " ",
            m("span.has-text-danger", state.customImageZPos),
          ]),
          m("div.control", [
            m("input.input[type=number]", {
              value: state.customImageZPos,
              oninput: handleZPosChange,
              placeholder: "0",
            }),
          ]),
          m("p.help", t("advanced.layer_order")),
          m("div.mt-2", [
            m(
              "div.is-flex.is-flex-wrap-wrap",
              { style: "gap: 0.25rem 1rem;" },
              LAYER_TABLE.map(([z, name]) =>
                m("span.is-size-7", [
                  m("code.has-text-danger", z),
                  " ",
                  name,
                ]),
              ),
            ),
          ]),
          m(
            "p.mt-2.is-size-7.has-text-grey",
            t("advanced.layer_order_note"),
          ),
        ]),
        state.customUploadedImage &&
          m("div.field", [
            m("div.control", [
              m(
                "button.button.is-small.is-warning",
                { onclick: clearCustomImage },
                t("advanced.clear_image"),
              ),
            ]),
          ]),

        m("hr"),

        m("div.field.is-horizontal.is-align-items-center", [
          m("div.field-label.is-normal", [
            m("label.label.mb-0", t("advanced.export_scale")),
          ]),
          m("div.field-body", [
            m("div.field.has-addons.mb-0", EXPORT_SCALES.map((s) =>
              m("div.control", [
                m(
                  "button.button.is-small" +
                    (state.exportScale === s ? ".is-primary" : ""),
                  {
                    onclick: () => {
                      state.exportScale = s;
                      m.redraw();
                    },
                  },
                  `${s}x`,
                ),
              ]),
            )),
          ]),
        ]),
        m("p.help", t("advanced.export_scale_help")),

        m("div.field.is-horizontal.is-align-items-center.mt-3", [
          m("div.field-label.is-normal", [
            m("label.label.mb-0", t("advanced.bg_color")),
          ]),
          m("div.field-body", [
            m(
              "div.is-flex.is-flex-wrap-wrap",
              { style: "gap: 0.5rem;" },
              BG_COLORS.map((c) =>
                m(
                  "button.button.is-small" +
                    (state.previewBgColor === c.value ? ".is-primary" : ""),
                  {
                    onclick: () => {
                      state.previewBgColor = c.value;
                      m.redraw();
                    },
                  },
                  [
                    c.value
                      ? m("span", {
                          style: `display:inline-block;width:14px;height:14px;border-radius:3px;border:1px solid #aaa;background:${c.value};vertical-align:middle;margin-right:4px;`,
                        })
                      : null,
                    c.label,
                  ],
                ),
              ),
            ),
          ]),
        ]),
        m("p.help", t("advanced.bg_color_help")),

        m("div.field.is-horizontal.is-align-items-center.mt-3", [
          m("div.field-label.is-normal", [
            m("label.label.mb-0", t("advanced.anim_speed")),
          ]),
          m("div.field-body", [
            m("div.field.mb-0", [
              m("div.control.is-expanded", [
                m("input.is-fullwidth[type=range]", {
                  min: 0.25,
                  max: 3,
                  step: 0.25,
                  value: state.animationSpeed,
                  oninput: (e: Event) => {
                    const target = e.target as HTMLInputElement;
                    state.animationSpeed = parseFloat(target.value);
                    setAnimationSpeed(state.animationSpeed);
                    m.redraw();
                  },
                }),
              ]),
            ]),
            m("span.is-size-7.ml-2", `${state.animationSpeed}x`),
          ]),
        ]),
        m("p.help", t("advanced.anim_speed_help")),

        m("div.field.is-horizontal.is-align-items-center.mt-3", [
          m("div.field-label.is-normal", [
            m("label.label.mb-0", t("advanced.show_outline")),
          ]),
          m("div.field-body", [
            m("div.field.mb-0", [
              m("label.checkbox", [
                m("input[type=checkbox]", {
                  checked: state.showOutline,
                  onchange: (e: Event) => {
                    const target = e.target as HTMLInputElement;
                    state.showOutline = target.checked;
                    m.redraw();
                  },
                }),
                ` ${t("advanced.show_outline_help")}`,
              ]),
            ]),
          ]),
        ]),
      ],
    );
  },
};
