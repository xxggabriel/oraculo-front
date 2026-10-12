import { describe, expect, it } from "vitest";
import { referenceAnchor, referenceSegments } from "./reference-segments";
import { identity, reference } from "./reference-test-fixtures";
describe("referenceSegments", () => {
  it("usa pontos Unicode, preserva emoji e texto literal de HTML", () => {
    const text = "😀 art. 5 <script>alert(1)</script>";
    const segments = referenceSegments(text, identity, [
      reference(
        "constitution",
        [{ start: 2, end: 8, surface: "art. 5" }],
        "normative_reference",
      ),
    ]);
    expect(segments.map((item) => item.text).join("")).toBe(text);
    expect(
      segments
        .filter((item) => item.references.length)
        .map((item) => item.text),
    ).toEqual(["art. 5"]);
  });
  it.each([
    { publicationId: "other" },
    { revisionId: "old" },
    { textVersionId: "old" },
    { start: -1 },
    { end: 10 },
    { start: 0.5 },
    { end: 0 },
    { surface: "wrong" },
  ])("não cria links para evidência incompatível %s", (invalid) => {
    const segments = referenceSegments("abc", identity, [
      reference("invalid", [{ start: 0, end: 1, surface: "a", ...invalid }]),
    ]);
    expect(segments.flatMap((item) => item.references)).toEqual([]);
    expect(segments.map((item) => item.text).join("")).toBe("abc");
  });
  it("preserva todas as referências sobrepostas e deduplica vínculos repetidos", () => {
    const a = reference("a", [
      { start: 0, end: 4, surface: "abcd" },
      { start: 0, end: 4, surface: "abcd" },
    ]);
    const b = reference("b", [{ start: 2, end: 6, surface: "cdef" }]);
    const segments = referenceSegments("abcdefgh", identity, [b, a, a]);
    expect(
      segments.map((item) => [item.text, item.references.map((ref) => ref.id)]),
    ).toEqual([
      ["ab", ["a"]],
      ["cd", ["a", "b"]],
      ["ef", ["b"]],
      ["gh", []],
    ]);
    expect(segments.map((item) => item.text).join("")).toBe("abcdefgh");
  });
  it("liga ocorrências repetidas somente nos intervalos comprovados", () => {
    const segments = referenceSegments("art. 5 / art. 5", identity, [
      reference("law", [{ start: 9, end: 15, surface: "art. 5" }]),
    ]);
    expect(
      segments
        .filter((item) => item.references.length)
        .map((item) => item.start),
    ).toEqual([9]);
  });
  it("produz IDs únicos estáveis mesmo com caracteres especiais e famílias distintas", () => {
    expect(referenceAnchor({ family: "citation", id: "a/b% 😀" })).toBe(
      referenceAnchor({ family: "citation", id: "a/b% 😀" }),
    );
    expect(referenceAnchor({ family: "a-b", id: "c" })).not.toBe(
      referenceAnchor({ family: "a", id: "b-c" }),
    );
  });
});

describe("vínculos de ocorrência", () => {
  it("não transforma contexto auxiliar ou identificador isolado em link", () => {
    const ref = reference("law", [
      { start: 0, end: 6, surface: "art. 5" },
      { start: 0, end: 14, surface: "art. 5 permite" },
      { start: 5, end: 6, surface: "5" },
    ]);
    const segments = referenceSegments("art. 5 permite", identity, [ref]);
    expect(
      segments
        .filter((segment) => segment.references.length)
        .map((segment) => segment.text),
    ).toEqual(["art. 5"]);
  });
  it("mantém a mesma referência ativa nos intervalos coincidentes e consecutivos", () => {
    const ref = reference("repeat", [
      { start: 0, end: 3, surface: "aaa" },
      { start: 1, end: 4, surface: "aaa" },
      { start: 4, end: 7, surface: "aaa" },
    ]);
    const segments = referenceSegments("aaaaaaa", identity, [ref]);
    expect(segments.map((segment) => segment.text).join("")).toBe("aaaaaaa");
    expect(
      segments.every(
        (segment) =>
          segment.references.map((item) => item.id).join() === "repeat",
      ),
    ).toBe(true);
  });
  it("isola IDs entre instâncias reutilizadas com namespace próprio", () => {
    const ref = reference("same", [{ start: 0, end: 1, surface: "a" }]);
    const first = referenceSegments("abc", identity, [ref], "first");
    const second = referenceSegments("abc", identity, [ref], "second");
    expect(first[0].anchor).not.toBe(second[0].anchor);
    expect(referenceAnchor(ref, "first")).not.toBe(
      referenceAnchor(ref, "second"),
    );
  });
});
