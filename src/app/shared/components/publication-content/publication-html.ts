import { Parser } from "htmlparser2";

const safeTags = [
  "center",
  "p",
  "div",
  "section",
  "article",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "del",
  "sub",
  "sup",
  "pre",
  "blockquote",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "td",
  "th",
  "span",
  "a",
] as const;
export type SafeContentTag = (typeof safeTags)[number];
export interface ContentText {
  readonly kind: "text";
  readonly text: string;
  /** Inclusive start in Unicode codepoints of the untouched source, including HTML. */
  readonly start: number;
  /** Exclusive end in Unicode codepoints of the untouched source, including HTML. */
  readonly end: number;
}
export interface ContentElement {
  readonly kind: "element";
  readonly tag: SafeContentTag;
  readonly children: readonly PublicationContentNode[];
  readonly href: string | null;
  readonly orderedStart?: number;
  readonly orderedReversed?: boolean;
  readonly listValue?: number;
  readonly orderedType?: "1" | "a" | "A" | "i" | "I";
  readonly colSpan?: number;
  readonly rowSpan?: number;
}
export interface ContentBreak {
  readonly kind: "break" | "rule";
}
export type PublicationContentNode =
  ContentText | ContentElement | ContentBreak;

type MutableText = { -readonly [Key in keyof ContentText]: ContentText[Key] };
type MutableElement = Omit<ContentElement, "children"> & {
  readonly children: MutableNode[];
};
type MutableNode = MutableText | MutableElement | ContentBreak;
interface Frame {
  readonly tag: string;
  readonly children: MutableNode[];
  readonly blocked: boolean;
  readonly depth: number;
  readonly insideLink: boolean;
}
const allowedTags = new Set<string>(safeTags);
const removedSubtrees = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "svg",
  "math",
  "template",
  "head",
  "title",
  "noscript",
  "img",
  "image",
  "picture",
  "audio",
  "video",
  "source",
  "track",
  "input",
]);
const maximumElementDepth = 128;

/** Map htmlparser2's UTF-16 indices to Array.from(source) coordinates in one pass. */
function sourceCodepointIndices(source: string): Uint32Array {
  const indices = new Uint32Array(source.length + 1);
  let unit = 0;
  let point = 0;
  while (unit < source.length) {
    indices[unit] = point;
    const width = (source.codePointAt(unit) ?? 0) > 0xffff ? 2 : 1;
    if (width === 2) indices[unit + 1] = point;
    unit += width;
    indices[unit] = ++point;
  }
  return indices;
}
function safeHref(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  // Require an explicit absolute URL, not a relative or protocol-relative navigation.
  if (!/^https?:\/\//i.test(trimmed)) return null;
  try {
    const url = new URL(trimmed);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.username ||
      url.password
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
}

function boundedInteger(
  value: string | undefined,
  minimum: number,
  maximum: number,
): number | null {
  if (value === undefined || !/^[+-]?\d+$/.test(value.trim())) return null;
  const parsed = Number(value.trim());
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : null;
}
function isOrderedType(
  value: string | undefined,
): value is NonNullable<ContentElement["orderedType"]> {
  return (
    value === "1" ||
    value === "a" ||
    value === "A" ||
    value === "i" ||
    value === "I"
  );
}
function passiveAttributes(
  tag: string,
  attributes: Record<string, string>,
): Pick<
  ContentElement,
  | "orderedStart"
  | "orderedType"
  | "orderedReversed"
  | "listValue"
  | "colSpan"
  | "rowSpan"
> {
  if (tag === "ol") {
    const start = boundedInteger(attributes["start"], -1_000_000, 1_000_000);
    const type = attributes["type"];
    return {
      ...(start === null ? {} : { orderedStart: start }),
      ...(isOrderedType(type) ? { orderedType: type } : {}),
      ...(Object.prototype.hasOwnProperty.call(attributes, "reversed")
        ? { orderedReversed: true }
        : {}),
    };
  }
  if (tag === "li") {
    const value = boundedInteger(attributes["value"], -1_000_000, 1_000_000);
    return value === null ? {} : { listValue: value };
  }
  if (tag === "td" || tag === "th") {
    const colSpan = boundedInteger(attributes["colspan"], 1, 100);
    const rowSpan = boundedInteger(attributes["rowspan"], 1, 100);
    return {
      ...(colSpan === null ? {} : { colSpan }),
      ...(rowSpan === null ? {} : { rowSpan }),
    };
  }
  return {};
}

/**
 * Build a passive, bounded HTML tree without a DOM or an HTML injection sink.
 * The original source is never rewritten: every text range refers to its raw codepoints.
 * Unknown/form wrappers are unwrapped; active/resource-bearing subtrees disappear.
 */
export function parsePublicationHtml(
  source: string,
): readonly PublicationContentNode[] {
  const roots: MutableNode[] = [];
  const frames: Frame[] = [];
  const indices = sourceCodepointIndices(source);
  const current = (): Frame | undefined => frames[frames.length - 1];
  const parser = new Parser(
    {
      onopentag(tag, attributes) {
        const parent = current();
        const children = parent?.children ?? roots;
        const blocked = (parent?.blocked ?? false) || removedSubtrees.has(tag);
        const depth = parent?.depth ?? 0;
        let descendants = children;
        let descendantDepth = depth;
        let insideLink = parent?.insideLink ?? false;
        if (!blocked) {
          if (tag === "br" || tag === "hr") {
            children.push({ kind: tag === "br" ? "break" : "rule" });
          } else if (allowedTags.has(tag) && depth < maximumElementDepth) {
            const href =
              tag === "a" && !insideLink ? safeHref(attributes["href"]) : null;
            // Invalid/nested links lose their element and URL; retain passive children.
            // htmlparser2 accepts nested a tags, but the rendered tree must not.
            if (tag !== "a" || href !== null) {
              const element: MutableElement = {
                kind: "element",
                tag: tag as SafeContentTag,
                children: [],
                href,
                ...passiveAttributes(tag, attributes),
              };
              children.push(element);
              descendants = element.children;
              descendantDepth++;
              if (tag === "a") insideLink = true;
            }
          }
        }
        frames.push({
          tag,
          children: descendants,
          blocked,
          depth: descendantDepth,
          insideLink,
        });
      },
      onclosetag(tag) {
        // Includes htmlparser2's implied closures and synthetic orphan p/br handling.
        while (frames.length) {
          const frame = frames.pop();
          if (frame?.tag === tag) break;
        }
      },
      ontext(text) {
        if (!text || current()?.blocked) return;
        const children = current()?.children ?? roots;
        if (parser.startIndex > parser.endIndex) {
          // The second codepoint of a compound entity is emitted with the same endIndex.
          // Keep both decoded codepoints in one opaque node covering the entire raw entity.
          const previous = children[children.length - 1];
          if (previous?.kind === "text") previous.text += text;
          return;
        }
        children.push({
          kind: "text",
          text,
          start: indices[parser.startIndex] ?? 0,
          end: indices[parser.endIndex + 1] ?? indices[source.length] ?? 0,
        });
      },
    },
    {
      xmlMode: false,
      decodeEntities: true,
      lowerCaseTags: true,
      lowerCaseAttributeNames: true,
      recognizeSelfClosing: true,
    },
  );
  parser.end(source);
  return roots;
}

const blockTags = new Set<SafeContentTag>([
  "center",
  "p",
  "div",
  "section",
  "article",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "pre",
  "blockquote",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
]);
interface WalkStep {
  readonly node: PublicationContentNode;
  readonly exit: boolean;
}

/** Plain reading text, with structural boundaries instead of concatenated block/cell words. */
export function publicationPlainText(source: string): string {
  const nodes = parsePublicationHtml(source);
  const pending: WalkStep[] = [];
  for (let i = nodes.length - 1; i >= 0; i--)
    pending.push({ node: nodes[i], exit: false });
  const parts: string[] = [];
  let last = "";
  const append = (text: string): void => {
    if (!text) return;
    parts.push(text);
    last = text[text.length - 1];
  };
  const boundary = (line: boolean): void => {
    if (!last) return;
    if (line) {
      if (last !== "\n") append("\n");
    } else if (!/\s/.test(last)) append(" ");
  };
  while (pending.length) {
    const step = pending.pop();
    if (!step) continue;
    const node = step.node;
    if (node.kind === "text") {
      append(node.text);
    } else if (node.kind === "break" || node.kind === "rule") {
      // Explicit breaks can carry blank lines; structural boundaries do not duplicate them.
      append("\n");
    } else if (node.kind === "element") {
      const block = blockTags.has(node.tag);
      const cell = node.tag === "td" || node.tag === "th";
      if (block || cell) boundary(block);
      if (!step.exit) {
        pending.push({ node, exit: true });
        for (let i = node.children.length - 1; i >= 0; i--)
          pending.push({ node: node.children[i], exit: false });
      }
    }
  }
  return parts.join("").trim();
}
