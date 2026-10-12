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
