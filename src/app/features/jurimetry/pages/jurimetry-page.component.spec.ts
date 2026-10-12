import { describe, expect, it } from "vitest";
import { JurimetryPageComponent } from "./jurimetry-page.component";

describe("Títulos de referências na jurimetria", () => {
  it("normaliza HTML e entidades antes de mostrar a referência na tabela e no ranking", () => {
    const surface =
      '<p title="' + "x".repeat(400) + '">Art. <b>5</b> &amp; CF</p>';
    expect(JurimetryPageComponent.prototype.referenceText(surface)).toBe(
      "Art. 5 & CF",
    );
    expect(surface).toContain('<p title="');
  });
  it("limita caracteres visíveis Unicode e indica ausência de nome sem exibir códigos internos", () => {
    expect(
      JurimetryPageComponent.prototype.referenceText(
        `<b>${"😀".repeat(190)}</b>`,
      ),
    ).toBe("😀".repeat(180) + "…");
    expect(
      JurimetryPageComponent.prototype.referenceText(
        "<script>alert(1)</script>",
      ),
    ).toBe("Nome não informado");
  });
  it("identifica a família como prefixo e mantém a chave interna fora do nome", () => {
    const reference = {
      family: "citation" as const,
      surface: "<b>Súmula 7</b>",
      key: "sumula:unknown:7",
    };
    expect(JurimetryPageComponent.prototype.referenceLabel(reference)).toBe(
      "Jurisprudência: Súmula 7",
    );
    expect(
      JurimetryPageComponent.prototype.referenceLabel({
        ...reference,
        family: "normative",
        surface: "Art. 5 &amp; CF",
      }),
    ).toBe("Normativa: Art. 5 & CF");
  });
});
