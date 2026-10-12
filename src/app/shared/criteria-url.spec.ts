import { describe, expect, it } from "vitest";
import { initialCriteria } from "../core/search";
import { criteriaFromParams, criteriaToParams } from "./criteria-url";

describe("Coleção e ordenação da jurisprudência na URL", () => {
  it("preserva critérios explícitos sem mudar a pesquisa de publicações", () => {
    const legacy = criteriaFromParams(new URLSearchParams({ q: "mérito" }));
    expect(legacy).not.toHaveProperty("collection");
    expect(legacy).not.toHaveProperty("ranking");
    expect(criteriaToParams(initialCriteria)).toMatchObject({
      collection: null,
      ranking: null,
    });
    for (const ranking of ["bm25", "rerank"] as const) {
      const criteria = {
        ...initialCriteria,
        collection: "jurisprudence" as const,
        ranking,
      };
      const params = criteriaToParams(criteria);
      expect(
        criteriaFromParams(
          new URLSearchParams({
            collection: String(params.collection),
            ranking: String(params.ranking),
          }),
        ),
      ).toMatchObject({ collection: "jurisprudence", ranking });
    }
  });
  it("descarta valores desconhecidos e nunca restaura sessões ou cursores", () => {
    const criteria = criteriaFromParams(
      new URLSearchParams({
        collection: "private",
        ranking: "unknown",
        sessionId: "secret",
        cursor: "opaque",
      }),
    );
    expect(criteria).not.toHaveProperty("collection");
    expect(criteria).not.toHaveProperty("ranking");
    expect(criteria).not.toHaveProperty("sessionId");
    expect(criteria).not.toHaveProperty("cursor");
  });
});

describe("Publicidade do processo na URL", () => {
  it("restaura públicos e privados, normaliza inválidos e omite a opção de ambos", () => {
    for (const visibility of ["public", "restricted"] as const) {
      const params = criteriaToParams({ ...initialCriteria, visibility });
      expect(params.visibility).toBe(visibility);
      expect(
        criteriaFromParams(new URLSearchParams({ visibility })).visibility,
      ).toBe(visibility);
    }
    expect(criteriaToParams(initialCriteria).visibility).toBeNull();
    expect(criteriaFromParams(new URLSearchParams()).visibility).toBe("both");
    expect(
      criteriaFromParams(new URLSearchParams({ visibility: "bad" })).visibility,
    ).toBe("both");
  });
});

describe("Pessoas e OAB na URL", () => {
  it("preserva todos os filtros e zeros da inscrição após recarregar", () => {
    const fields = {
      partyName: "Maria Silva",
      attorneyName: "João Lima",
      oabNumber: "00123A",
      oabState: "GO",
    };
    const params = criteriaToParams({ ...initialCriteria, ...fields });
    expect(
      criteriaFromParams(
        new URLSearchParams(
          Object.fromEntries(
            Object.entries(params)
              .filter(([, value]) => value !== null)
              .map(([key, value]) => [key, String(value)]),
          ),
        ),
      ),
    ).toMatchObject(fields);
    expect(
      criteriaFromParams(
        new URLSearchParams({ attorneyName: "  ", oabState: "go" }),
      ),
    ).toMatchObject({ attorneyName: null, oabState: "GO" });
  });
});
