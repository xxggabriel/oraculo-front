import { Reference, TextPart } from "../../../core/search";
import {
  PublicationContentNode,
  parsePublicationHtml,
} from "./publication-html";

export interface ContentDecoration {
  readonly start: number;
  readonly end: number;
  readonly highlighted?: boolean;
  readonly references?: readonly Reference[];
  readonly anchor?: string;
  /** Already projected visible text, never parsed a second time. */
  readonly context?: string;
}
export interface ContentPart {
  readonly text: string;
  readonly highlighted: boolean;
  readonly references: readonly Reference[];
  readonly anchor: string | null;
  readonly originAnchor: string | null;
  readonly additionalLinks: boolean;
  readonly context: string;
}
export type DecoratedContentNode =
  | { readonly kind: "text"; readonly parts: readonly ContentPart[] }
  | {
      readonly kind: "element";
      readonly tag: string;
      readonly href: string | null;
      readonly orderedStart?: number;
      readonly orderedReversed?: boolean;
      readonly orderedType?: "1" | "a" | "A" | "i" | "I";
      readonly listValue?: number;
      readonly colSpan?: number;
      readonly rowSpan?: number;
      readonly containsReferences: boolean;
      readonly children: readonly DecoratedContentNode[];
    }
  | { readonly kind: "break" | "rule" };

/** Reassemble highlights before HTML parsing: a TextPart may end inside a tag or entity. */
export function snippetContent(parts: readonly TextPart[]) {
  let offset = 0;
  const decorations: ContentDecoration[] = [];
  for (const part of parts) {
    const end = offset + Array.from(part.text).length;
    if (part.highlighted && end > offset)
      decorations.push({ start: offset, end, highlighted: true });
    offset = end;
  }
  return { text: parts.map((part) => part.text).join(""), decorations };
}

/** Decoration boundaries stay in the raw Unicode source. Only visible text can become links. */
export function decoratePublicationContent(
  source: string,
  decorations: readonly ContentDecoration[] = [],
): readonly DecoratedContentNode[] {
  const usedAnchors = new Map<string, number>();
  const ordered = decorations
    .filter(
      (item) =>
        Number.isSafeInteger(item.start) &&
        Number.isSafeInteger(item.end) &&
        item.start >= 0 &&
        item.end > item.start,
    )
    .sort((a, b) => a.start - b.start || a.end - b.end);
  function decorate(
    nodes: readonly PublicationContentNode[],
  ): DecoratedContentNode[] {
    return nodes.map((node): DecoratedContentNode => {
      if (node.kind === "element") {
        // Formatting whitespace between table rows/cells does not create anonymous cells.
        const children = decorate(
          ["table", "thead", "tbody", "tfoot", "tr"].includes(node.tag)
            ? node.children.filter(
                (child) => child.kind !== "text" || child.text.trim() !== "",
              )
            : node.children,
        );
        return {
          ...node,
          children,
          containsReferences: children.some(hasReferences),
        };
      }
      if (node.kind !== "text") return node;
      const points = Array.from(node.text);
      const candidates = ordered.filter(
        (item) => item.start < node.end && item.end > node.start,
      );
      // Decoded entities can occupy many raw characters. Keep them atomic rather than
      // inventing offsets for an annotation that ends inside an entity spelling.
      const linear = node.end - node.start === points.length;
      const boundaries = linear
        ? [
            ...new Set([
              node.start,
              node.end,
              ...candidates.flatMap((item) => [
                Math.max(node.start, item.start),
                Math.min(node.end, item.end),
              ]),
            ]),
          ].sort((a, b) => a - b)
        : [node.start, node.end];
      const parts = boundaries.slice(0, -1).map((start, index): ContentPart => {
        const end = boundaries[index + 1];
        const active = candidates.filter(
          (item) => item.start <= start && item.end >= end,
        );
        const referenced = active.find((item) => item.references?.length);
        const base = referenced?.anchor ?? null;
        const count = base ? (usedAnchors.get(base) ?? 0) : 0;
        if (base) usedAnchors.set(base, count + 1);
        return {
          text: linear
            ? points.slice(start - node.start, end - node.start).join("")
            : node.text,
          highlighted: active.some((item) => item.highlighted),
          references: referenced?.references ?? [],
          anchor: base ? base + (count ? "-part-" + count : "") : null,
          originAnchor: base,
          additionalLinks: count === 0,
          context: referenced?.context ?? "",
        };
      });
      return { kind: "text", parts };
    });
  }
  return decorate(parsePublicationHtml(source));
}
export function hasReferences(node: DecoratedContentNode): boolean {
  return node.kind === "element"
    ? node.containsReferences
    : node.kind === "text" &&
        node.parts.some((part) => part.references.length > 0);
}
export function visibleReferenceParts(
  source: string,
  decorations: readonly ContentDecoration[],
): readonly ContentPart[] {
  const pending = [
    ...decoratePublicationContent(source, decorations),
  ].reverse();
  const parts: ContentPart[] = [];
  while (pending.length) {
    const node = pending.pop()!;
    if (node.kind === "element") pending.push(...[...node.children].reverse());
    else if (node.kind === "text")
      parts.push(
        ...node.parts.filter((part) => part.anchor && part.references.length),
      );
  }
  return parts;
}
