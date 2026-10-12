import { describe, expect, it } from "vitest";
import { reference } from "../publication-text/reference-test-fixtures";
import {
  presentReference,
  referenceExcerpt,
  referenceTitle,
} from "./reference-presentation";

describe("Apresentação de referências em linguagem simples", () => {
  it("separa revisão da extração de identificação e vigência", () => {
    const ref = {
      ...reference("norm", [{ surface: "Art. 5" }], "normative"),
      type: "statute_provision",
      reviewStatus: "validated",
      resolutionStatus: "not_attempted",
      legalStatus: "not_assessed",
    };
    const view = presentReference(ref);
    expect(view.title).toBe("Art. 5");
    expect(view.type.label).toBe("Artigo ou trecho de norma");
    expect(view.review.label).toBe("Extração revisada");
    expect(view.review.explanation).toContain("não confirma");
    expect(view.resolution).toContain("ainda não foi realizada");
    expect(view.legal).toBe("Vigência não verificada");
  });
  it("não apresenta processo da publicação como precedente nem escolhe origem ambígua", () => {
    const view = presentReference({
      ...reference("process", []),
      type: "case",
      mentionRole: "publication_process",
      attributionStatus: "ambiguous",
      attributedEntity: "STJ",
      resolutionStatus: "ambiguous",
    });
    expect(view.category).toBe("Processo da publicação");
    expect(view.origin).toBe("Mais de uma origem possível");
    expect(view.resolution).toContain("Nenhuma foi escolhida");
  });
  it("não transforma ausências ou códigos novos em confirmação", () => {
    const view = presentReference({
      ...reference("new", []),
      type: "future_type",
      family: "future_family",
      reviewStatus: "future_review",
      attributionStatus: "future_state",
      resolutionStatus: "future_resolution",
      mentionRole: "future_role",
      legalStatus: "future_legal",
    });
    expect(view.type.label).toBe("Tipo não informado");
    expect(view.review.label).toBe("Revisão não informada");
    expect(view.category).toBe("Referência");
    expect(view.resolution).toContain("não foi informada");
    expect(view.role).toBe("Uso da referência não determinado");
    expect(view.legal).toContain("consulte o registro original");
  });
  it("mantém chaves canônicas nos detalhes e distingue inferência da origem explícita", () => {
    const view = presentReference({
      ...reference("norm", [], "normative"),
      attributedEntity: "statute|federal:cf:1988",
      attributionStatus: "inherited",
    });
    expect(view.origin).not.toContain("statute|");
    expect(view.attribution).toContain("contexto");
    const inferred = presentReference({
      ...reference("case", []),
      attributedEntity: "STJ",
      attributionStatus: "inferred",
    });
    expect(inferred.origin).toBe("STJ");
    expect(inferred.attribution).toContain("não informado diretamente");
  });
  it("usa a menção como título e limita Unicode sem perder o texto original", () => {
    const ref = reference("opaque-key", [{ surface: "😀".repeat(181) }]);
    expect(referenceTitle(ref)).toBe("😀".repeat(180) + "…");
    expect(ref.surface).toBe("😀".repeat(181));
    expect(referenceTitle({ ...ref, surface: "  " })).toBe(
      "Referência sem título",
    );
  });
  it("mostra contexto literal limitado ao redor da ocorrência selecionada", () => {
    const points = Array.from("😀".repeat(120) + "Art. 5" + "b".repeat(130));
    const excerpt = referenceExcerpt(points, 120, 126);
    expect(excerpt.before).toBe("😀".repeat(100));
    expect(excerpt.mention).toBe("Art. 5");
    expect(excerpt.after).toBe("b".repeat(120));
    expect(excerpt.leadingEllipsis).toBe(true);
    expect(excerpt.trailingEllipsis).toBe(true);
  });
});

it("exibe títulos HTML decodificados sem alterar superfície ou identificadores originais", () => {
  const surface =
    '<b title="' + "x".repeat(500) + '">Art. 5 &amp; Constituição</b>';
  const ref = reference("law:5", [{ surface }], "normative");
  expect(referenceTitle(ref)).toBe("Art. 5 & Constituição");
  expect(ref.surface).toBe(surface);
  expect(ref.key).toBe("law:5");
});

it("extrai contexto pelo source completo sem cortar tags e mede limites no texto visível", () => {
  const source = `<p>${"😀".repeat(105)}</p><p title="${"x".repeat(200)}"><b>Art. 5 &amp; CF</b></p><p>${"fim ".repeat(40)}</p>`;
  const points = Array.from(source);
  const start = Array.from(source.slice(0, source.indexOf("Art. 5"))).length;
  const end = start + Array.from("Art. 5 &amp; CF").length;
  const context = referenceExcerpt(points, start, end);
  expect(context.mention).toBe("Art. 5 & CF");
  expect(Array.from(context.before)).toHaveLength(100);
  expect(Array.from(context.after)).toHaveLength(120);
  expect(context.before).not.toContain("title");
  expect(context.after).not.toContain("</p>");
  expect(context.leadingEllipsis).toBe(true);
  expect(context.trailingEllipsis).toBe(true);
});

it("não inclui entidades quando os offsets abrangem apenas parte da fonte da entidade", () => {
  const source = "Antes &amp; depois";
  const points = Array.from(source);
  const complete = referenceExcerpt(points, 6, 11);
  expect(complete.mention).toBe("&");
  expect(referenceExcerpt(points, 7, 10).mention).toBe("");
  expect(referenceExcerpt(points, 7, 10).before).toBe("Antes ");
  expect(referenceExcerpt(points, 7, 10).after).toBe(" depois");
});

it("mantém tags escapadas como texto visível e suprime subárvore de script", () => {
  const source = "<p>Art. &lt;b&gt;5&lt;/b&gt; <script>não exibir</script></p>";
  const excerpt = referenceExcerpt(
    Array.from(source),
    0,
    Array.from(source).length,
  );
  expect(excerpt.mention).toBe("Art. <b>5</b> ");
  expect(excerpt.mention).not.toContain("script");
});

it("decodifica entidade composta inteira e mantém limites Unicode sobre caracteres visíveis", () => {
  const source = "Antes &NotEqualTilde; depois";
  const points = Array.from(source);
  const start = 6;
  const end = start + Array.from("&NotEqualTilde;").length;
  expect(referenceExcerpt(points, start, end).mention).toBe("≂̸");
  expect(referenceExcerpt(points, start + 1, end).mention).toBe("");
  const long = "<b>" + "😀".repeat(170) + "</b>";
  expect(
    referenceExcerpt(Array.from(long), 0, Array.from(long).length).mention,
  ).toBe("😀".repeat(160));
  expect(
    referenceExcerpt(Array.from(long), 0, Array.from(long).length)
      .mentionEllipsis,
  ).toBe(true);
});
