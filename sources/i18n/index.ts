// Simple i18n system - defaults to Chinese
import { zh } from "./zh.ts";
import { itemNameZh } from "./item-names.ts";
import { colorNameZh } from "./color-names.ts";

type TranslationDict = Record<string, string>;

let currentDict: TranslationDict = zh;

/**
 * Translate a key to the current language.
 * Falls back to the key itself if not found.
 */
export function t(key: string): string {
  return currentDict[key] ?? key;
}

/**
 * Translate with interpolation: t("msg", { count: 3 }) replaces {count} in the translated string.
 */
export function tInterp(key: string, params: Record<string, string | number>): string {
  let result = currentDict[key] ?? key;
  for (const [k, v] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }
  return result;
}

/**
 * Translate tree node display name.
 * Priority: i18n tree.category.X → i18n tree.label.X (from English meta label) → node.label → capitalize(name)
 */
export function tTreeLabel(name: string, nodeLabel?: string, capitalizeFn?: (s: string) => string): string {
  // 1. Try tree.category.X
  const catKey = `tree.category.${name}`;
  const catVal = currentDict[catKey];
  if (catVal && catVal !== catKey) return catVal;

  // 2. Try tree.label.X (derived from English meta label)
  if (nodeLabel) {
    const slug = nodeLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    const labelKey = `tree.label.${slug}`;
    const labelVal = currentDict[labelKey];
    if (labelVal && labelVal !== labelKey) return labelVal;
    // 3. Fall back to the English node label
    return nodeLabel;
  }

  // 4. Capitalize fallback
  return capitalizeFn ? capitalizeFn(name) : name;
}

/**
 * Translate an item's English name (meta.name) to Chinese.
 * Falls back to the original English name if no translation found.
 */
export function tItemName(englishName: string): string {
  return itemNameZh[englishName] ?? englishName;
}

/**
 * Translate a color/variant name (e.g. "light", "dark", "crimson") to Chinese.
 * Handles compound names with underscores (e.g. "dark_brown" → "深棕色").
 * Falls back to the original name if no translation found.
 */
export function tColor(colorKey: string): string {
  const lower = colorKey.toLowerCase();
  if (colorNameZh[lower]) return colorNameZh[lower];
  // Try title case as well
  const title = lower.charAt(0).toUpperCase() + lower.slice(1);
  if (colorNameZh[title]) return colorNameZh[title];
  return colorKey;
}
