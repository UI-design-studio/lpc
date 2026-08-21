// Current selections component
import m from "mithril";
import type { CatalogReader } from "../../state/catalog.ts";
import { state } from "../../state/state.ts";
import {
  isItemLicenseCompatible,
  isItemAnimationCompatible,
} from "../../state/filters.ts";
import { t, tItemName, tColor } from "../../i18n/index.ts";

type CurrentSelectionsAttrs = {
  catalog: CatalogReader;
};

export const CurrentSelections: m.Component<CurrentSelectionsAttrs> = {
  view(vnode) {
    const { catalog } = vnode.attrs;
    if (!catalog.isLiteReady()) {
      return m("div", [
        m("h3.title.is-5", t("selections.title")),
        m("p.is-size-7.has-text-grey", t("filters.loading_items")),
      ]);
    }

    const selectionCount = Object.keys(state.selections).length;

    if (selectionCount === 0) {
      return m("div", [
        m("h3.title.is-5", t("selections.title")),
        m("p.has-text-grey", t("selections.no_items")),
      ]);
    }

    const creditsReady = catalog.isCreditsReady();

    return m("div", [
      m("h3.title.is-5", t("selections.title")),
      m(
        "div.tags",
        Object.entries(state.selections).map(([selectionKey, selection]) => {
          const isLicenseCompatible = isItemLicenseCompatible(
            selection.itemId,
            catalog,
          );
          const isAnimCompatible = isItemAnimationCompatible(
            selection.itemId,
            catalog,
          );
          const isCompatible = isLicenseCompatible && isAnimCompatible;
          const metaResult = catalog.getItemMerged(selection.itemId);
          const meta = metaResult.isOk() ? metaResult.value : null;

          const allLicenses = new Set<string>();
          if (meta) {
            for (const credit of meta.credits) {
              for (const lic of credit.licenses) {
                allLicenses.add(lic.trim());
              }
            }
          }
          const licensesText = !creditsReady
            ? t("tooltip.license_loading")
            : allLicenses.size > 0
              ? `${t("tooltip.licenses")}${Array.from(allLicenses).join(", ")}`
              : t("tooltip.no_license");

          const supportedAnims = meta?.animations ?? [];
          const animsText =
            supportedAnims.length > 0
              ? `${t("tooltip.animations")}${supportedAnims.join(", ")}`
              : t("tooltip.no_animation");

          let tooltipText = "";
          if (!isCompatible) {
            const issues: string[] = [];
            if (!isLicenseCompatible) issues.push(t("selections.licenses").replace("：", ""));
            if (!isAnimCompatible) issues.push(t("selections.animations").replace("：", ""));
            tooltipText = `${t("tooltip.incompatible_with")}${issues.join(" " + t("incompatible.with_current") + " ")}\n`;
          }
          tooltipText += `${licensesText}\n${animsText}`;

          return m(
            "span.tag.is-medium",
            {
              key: selectionKey,
              class: isCompatible ? "is-info" : "is-warning",
              title: creditsReady ? tooltipText : undefined,
            },
            [
              m("span", meta ? (() => {
                const sub = (selection.subId != null && selection.subId !== undefined) ? meta.recolors?.[selection.subId] : null;
                const baseName = sub?.label ?? tItemName(meta.name);
                const parts: string[] = [baseName];
                if (selection.variant) parts.push(tColor(selection.variant.replaceAll("_", " ")));
                if (selection.recolor) parts.push(tColor(selection.recolor.replaceAll("_", " ")));
                return parts.join(" ");
              })() : tItemName(selection.name)),
              !isCompatible ? m("span.ml-1", "⚠️") : null,
              m("button.delete.is-small", {
                onclick: () => {
                  delete state.selections[selectionKey];
                },
              }),
            ],
          );
        }),
      ),
    ]);
  },
};
