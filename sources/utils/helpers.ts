// Pure utility functions with minimal catalog reads for tree search
import type { CatalogReader, CategoryTreeNode } from "../state/catalog.ts";
import { tItemName } from "../i18n/index.ts";

/**
 * Simple ES6 template string replacement
 * e.g. es6DynamicTemplate("Hello ${name}", {name: "World"}) => "Hello World"
 * Note: does not support complex expressions, only simple variable replacement
 */
// copied from https://github.com/mikemmacana/dynamic-template/blob/046fee36aecc1f48cf3dc454d9d36bb0e96e0784/index.js
export const es6DynamicTemplate = (
  templateString: string,
  templateVariables: Record<string, string>,
): string =>
  templateString.replace(
    /\${(.*?)}/g,
    (_, g) => templateVariables[g] ?? `\${${g}}`,
  );

/**
 * Convert variant name to filename format (spaces to underscores)
 * e.g. "light brown" → "light_brown"
 */
export function variantToFilename(variant: string): string {
  return variant.replaceAll(" ", "_");
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function ucwords(str: string): string {
  return str
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
}

/** Check if text (English) or its Chinese translation matches the query. */
export function matchesSearch(text: string, query: string): boolean {
  if (!query || query.length < 2) return true;
  const q = query.toLowerCase();
  if (text.toLowerCase().includes(q)) return true;
  const zhText = tItemName(text);
  if (zhText !== text && zhText.toLowerCase().includes(q)) return true;
  return false;
}

export function nodeHasMatches(
  node: CategoryTreeNode,
  query: string,
  catalog: CatalogReader,
): boolean {
  if (!query || query.length < 2) return true;

  // Until lite metadata is registered we cannot match item names; keep nodes visible
  if (node.items && node.items.length > 0 && !catalog.isLiteReady()) {
    return true;
  }

  // Check if any items in this node match (English OR Chinese name)
  if (
    node.items &&
    node.items.some((itemId) =>
      catalog.getItemLite(itemId).match(
        (meta) => matchesSearch(meta.name, query),
        () => false,
      ),
    )
  ) {
    return true;
  }

  // Check if any child nodes have matches (recursive)
  if (node.children) {
    return Object.values(node.children).some((childNode) =>
      nodeHasMatches(childNode, query, catalog),
    );
  }

  return false;
}
