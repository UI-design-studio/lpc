// Animation Filters component
import m from "mithril";
import type { CatalogReader } from "../../state/catalog.ts";
import { state } from "../../state/state.ts";
import { isItemAnimationCompatible } from "../../state/filters.ts";
import { ANIMATIONS } from "../../state/constants.ts";
import { t, tInterp } from "../../i18n/index.ts";

type AnimationOption = { value: string; label: string };
type AnimationFiltersDeps = {
  isItemAnimationCompatible: typeof isItemAnimationCompatible;
  animations: readonly AnimationOption[];
};

// Dependency injection for testability
const deps: AnimationFiltersDeps = {
  isItemAnimationCompatible,
  animations: ANIMATIONS,
};

export function setAnimationCompatible(
  overrides: Pick<AnimationFiltersDeps, "isItemAnimationCompatible">,
): void {
  deps.isItemAnimationCompatible = overrides.isItemAnimationCompatible;
}
export function isAnimationCompatible(
  itemId: string,
  catalog: CatalogReader,
): boolean {
  return deps.isItemAnimationCompatible(itemId, catalog);
}

export function setAnimations(anims: readonly AnimationOption[]): void {
  deps.animations = anims;
}
export function getAnimations(): readonly AnimationOption[] {
  return deps.animations;
}

type AnimationFiltersState = { isExpanded: boolean };
type AnimationFiltersAttrs = {
  catalog: CatalogReader;
};

export const AnimationFilters: m.Component<
  AnimationFiltersAttrs,
  AnimationFiltersState
> = {
  oninit(vnode) {
    vnode.state.isExpanded = false;
  },
  view(vnode) {
    const liteReady = vnode.attrs.catalog.isLiteReady();

    const removeIncompatibleItems = () => {
      const toRemove: string[] = [];
      for (const [selectionGroup, selection] of Object.entries(
        state.selections,
      )) {
        if (!isAnimationCompatible(selection.itemId, vnode.attrs.catalog)) {
          toRemove.push(selectionGroup);
        }
      }

      if (toRemove.length > 0) {
        toRemove.forEach((key) => delete state.selections[key]);
        alert(tInterp("incompatible.remove_button", { count: toRemove.length }));
      } else {
        alert(t("animation_filters.no_incompatible"));
      }
    };

    const incompatibleSelections = Object.values(state.selections).filter(
      (selection) =>
        !isAnimationCompatible(selection.itemId, vnode.attrs.catalog),
    );
    const hasIncompatibleItems = incompatibleSelections.length > 0;

    const enabledCount = Object.values(state.enabledAnimations).filter(
      Boolean,
    ).length;
    const totalCount = getAnimations().length;
    const isFilterActive = enabledCount > 0;

    return m("div.box.mb-4.has-background-light", [
      m(
        "div.tree-label",
        {
          onclick: () => {
            vnode.state.isExpanded = !vnode.state.isExpanded;
          },
        },
        [
          m("span.tree-arrow", {
            class: vnode.state.isExpanded ? "expanded" : "collapsed",
          }),
          m("span.title.is-inline.is-6", t("animation_filters.title")),
          m(
            "span.is-size-7.has-text-grey.ml-2",
            isFilterActive ? `(${enabledCount}/${totalCount})` : t("animation_filters.all"),
          ),
        ],
      ),
      vnode.state.isExpanded
        ? m("div.content.mt-3", [
            !liteReady
              ? m("p.is-size-7.has-text-grey.mb-3", t("filters.loading_items"))
              : null,
            m(
              "ul.tree-list",
              getAnimations().map((anim) =>
                m("li", { key: anim.value, class: "mb-2" }, [
                  m("label.checkbox", [
                    m("input[type=checkbox]", {
                      checked: state.enabledAnimations[anim.value],
                      disabled: !liteReady,
                      onchange: (e: Event) => {
                        const target = e.target as HTMLInputElement;
                        state.enabledAnimations[anim.value] = target.checked;
                      },
                    }),
                    ` ${anim.label}`,
                  ]),
                ]),
              ),
            ),
            hasIncompatibleItems
              ? [
                  m("div.notification.is-warning.is-light.p-3.mt-2", [
                    m("p.is-size-7", [
                      m(
                        "strong",
                        incompatibleSelections.length > 1
                          ? tInterp("incompatible.item_incompatible", { count: incompatibleSelections.length })
                          : t("incompatible.item_single_incompatible"),
                      ),
                      ` ${t("incompatible.with_current")} `,
                      m("span.has-text-grey", t("incompatible.marked_above")),
                    ]),
                  ]),
                  m(
                    "button.button.is-small.is-warning.mt-2",
                    {
                      onclick: removeIncompatibleItems,
                      title: incompatibleSelections.length > 1
                        ? tInterp("incompatible.remove_button", { count: incompatibleSelections.length })
                        : t("incompatible.remove_button_single"),
                    },
                    incompatibleSelections.length > 1
                      ? tInterp("incompatible.remove_button", { count: incompatibleSelections.length })
                      : t("incompatible.remove_button_single"),
                  ),
                ]
              : null,
          ])
        : null,
    ]);
  },
};
