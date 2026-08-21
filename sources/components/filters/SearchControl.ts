// Search control component
import m from "mithril";
import type { CatalogReader } from "../../state/catalog.ts";
import { state } from "../../state/state.ts";
import { t } from "../../i18n/index.ts";

type SearchControlAttrs = {
  catalog: CatalogReader;
};

export const SearchControl: m.Component<SearchControlAttrs> = {
  view(vnode) {
    const liteReady = vnode.attrs.catalog.isLiteReady();
    return m("div.field", [
      m("label.label", t("filters.search")),
      m("input.input[type=search][placeholder=" + t("filters.search_placeholder") + "]", {
        value: state.searchQuery,
        disabled: !liteReady,
        title: liteReady ? undefined : t("filters.loading_items"),
        oninput: (e: Event) => {
          state.searchQuery = (e.target as HTMLInputElement).value;
        },
      }),
    ]);
  },
};
