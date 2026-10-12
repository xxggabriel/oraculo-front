import { describe, expect, it } from "vitest";
import { initialCriteria } from "../core/search";
import { criteriaFromParams, criteriaToParams } from "./criteria-url";

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
