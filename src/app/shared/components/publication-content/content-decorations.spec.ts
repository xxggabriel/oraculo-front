import { describe, expect, it } from "vitest";
import { referenceSegments } from "../publication-text/reference-segments";
import {
  identity,
  reference,
} from "../publication-text/reference-test-fixtures";
import {
  ContentPart,
  DecoratedContentNode,
  decoratePublicationContent,
  snippetContent,
} from "./content-decorations";
function parts(nodes: readonly DecoratedContentNode[]): readonly ContentPart[] {
  return nodes.flatMap((node) =>
    node.kind === "text"
      ? node.parts
      : node.kind === "element"
        ? parts(node.children)
        : [],
  );
}
describe("HTML source annotations", () => {
  it("keeps Unicode reference ranges across tags and compound entities, without repeated anchors", () => {
    const text = "😀 <p>art. <b>5</b> &amp; &NotEqualTilde;</p>";
    const surface = "art. <b>5</b> &amp; &NotEqualTilde;";
    const start = Array.from(text.slice(0, text.indexOf("art."))).length;
    const ref = reference("cf-5", [
      { start, end: start + Array.from(surface).length, surface },
    ]);
    const annotations = referenceSegments(text, identity, [ref]);
    const result = parts(decoratePublicationContent(text, annotations)).filter(
      (part) => part.references.length,
    );
    expect(result.map((part) => part.text).join("")).toBe("art. 5 & ≂̸");
    expect(new Set(result.map((part) => part.anchor)).size).toBe(result.length);
    expect(result[0].anchor).toBe(
      "publication-fragment-" +
        start +
        "-" +
        (start + Array.from(surface).length),
    );
    expect(result.filter((part) => part.additionalLinks)).toHaveLength(1);
    expect(ref.surface).toBe(surface);
  });
  it("reconstructs the full snippet when highlights split HTML tags and entities", () => {
    const snippet = snippetContent([
      { text: "<cen", highlighted: false },
      { text: "ter>ATO</center> <b>art. 5 &amp;", highlighted: true },
      { text: "</b>", highlighted: false },
    ]);
    const result = parts(
      decoratePublicationContent(snippet.text, snippet.decorations),
    );
    expect(result.map((part) => part.text).join("")).toBe("ATO art. 5 &");
    expect(
      result
        .filter((part) => part.highlighted)
        .map((part) => part.text)
        .join(""),
    ).toBe("ATO art. 5 &");
  });
  it("never annotates attributes, removed subtrees or a partial entity", () => {
    const text = '<img alt="art. 5"><script>art. 5</script>&amp;';
    const result = parts(
      decoratePublicationContent(text, [
        { start: 0, end: text.indexOf("&amp;") + 2, highlighted: true },
      ]),
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      text: "&",
      highlighted: false,
      references: [],
    });
  });
  it("unwraps source hyperlinks when they contain verified reference navigation", () => {
    const text = '<a href="https://example.org">art. 5</a>';
    const start = text.indexOf("art.");
    const ref = reference("cf-5", [
      { start, end: start + 6, surface: "art. 5" },
    ]);
    const [node] = decoratePublicationContent(
      text,
      referenceSegments(text, identity, [ref]),
    );
    expect(node).toMatchObject({
      kind: "element",
      tag: "a",
      containsReferences: true,
    });
  });
});
