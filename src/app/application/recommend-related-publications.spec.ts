import { describe, expect, it, vi } from "vitest";
import { RecommendRelatedPublications } from "./recommend-related-publications";
import { testRelated } from "../../../tests/related-fixtures";
describe("RecommendRelatedPublications", () => {
  it("permite substituir o gateway e propaga cancelamento sem conhecer HTTP ou estratégia", async () => {
    const result = {
      ...testRelated("origin"),
      strategy: "future_strategy",
      strategyVersion: "2",
    };
    const related = vi.fn().mockResolvedValue(result);
    const signal = new AbortController().signal;
    const useCase = new RecommendRelatedPublications({ related });
    expect(await useCase.execute("origin", signal)).toBe(result);
    expect(related).toHaveBeenCalledWith("origin", signal);
  });
  it("rejeita IDs inválidos antes de consultar o transporte", () => {
    const related = vi.fn();
    const useCase = new RecommendRelatedPublications({ related });
    expect(() => useCase.execute("", new AbortController().signal)).toThrow();
    expect(() =>
      useCase.execute("a".repeat(513), new AbortController().signal),
    ).toThrow();
    expect(related).not.toHaveBeenCalled();
  });
});
