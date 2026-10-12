import { describe, expect, it } from "vitest";
import { initialCriteria } from "../../../core/search";
import {
  emptyFilters,
  filterChips,
  filterSelection,
  presetPeriod,
  removeFilter,
  sameFilters,
  validatePeriod,
} from "./filter-state";

describe("Períodos civis e seleção de filtros", () => {
  it("mantém a publicidade no recorte e remove apenas esse filtro", () => {
    const selected = {
      ...emptyFilters(),
      visibility: "restricted" as const,
      courts: ["TJGO"],
    };
    const chip = filterChips(selected).find(
      (item) => item.key === "visibility",
    )!;
    expect(chip.label).toBe("Processos privados (restritos)");
    expect(removeFilter(selected, chip)).toMatchObject({
      visibility: "both",
      courts: ["TJGO"],
    });
    expect(
      filterSelection({ ...initialCriteria, visibility: undefined }).visibility,
    ).toBe("both");
  });
  it("inclui hoje e os seis dias anteriores ao cruzar o ano", () => {
    expect(presetPeriod("last7", new Date(2027, 0, 3, 1))).toEqual({
      from: "2026-12-28",
      to: "2027-01-03",
    });
  });
  it("trata o mês anterior com fevereiro bissexto e a virada do ano", () => {
    expect(presetPeriod("previousMonth", new Date(2024, 2, 31, 23))).toEqual({
      from: "2024-02-01",
      to: "2024-02-29",
    });
    expect(presetPeriod("previousMonth", new Date(2027, 0, 1))).toEqual({
      from: "2026-12-01",
      to: "2026-12-31",
    });
  });
  it("não aceita intervalos parciais ou invertidos", () => {
    expect(validatePeriod("2026-10-01", null)).toContain(
      "data inicial e a data final",
    );
    expect(validatePeriod(null, "2026-10-01")).toContain(
      "data inicial e a data final",
    );
    expect(validatePeriod("2026-10-02", "2026-10-01")).toContain(
      "anterior ou igual",
    );
    expect(validatePeriod("2026-10-01", "2026-10-01")).toBeNull();
    expect(validatePeriod(null, null)).toBeNull();
    expect(validatePeriod("2026-02-29", "2026-03-01")).toContain(
      "datas válidas",
    );
    expect(validatePeriod("2024-02-29", "2024-03-01")).toBeNull();
  });
  it("aplica o limite de 3660 dias do backend e recusa somente sem data com intervalo", () => {
    const from = "2010-01-01",
      limit = new Date(Date.parse(from) + 3660 * 86400000)
        .toISOString()
        .slice(0, 10),
      beyond = new Date(Date.parse(from) + 3661 * 86400000)
        .toISOString()
        .slice(0, 10);
    expect(validatePeriod(from, limit)).toBeNull();
    expect(validatePeriod(from, beyond)).toContain("dez anos");
    expect(validatePeriod("2026-10-01", "2026-10-11", "only")).toContain(
      "Todo o período",
    );
    expect(validatePeriod(null, null, "only")).toBeNull();
  });
  it("isola filtros para que limpar preserve texto, modo e ordenação", () => {
    const c = {
      ...initialCriteria,
      q: "dano moral",
      mode: "phrase" as const,
      sort: "date_desc" as const,
      courts: ["TJGO"],
    };
    expect({ ...c, ...emptyFilters() }).toMatchObject({
      q: "dano moral",
      mode: "phrase",
      sort: "date_desc",
      courts: [],
    });
    expect(Object.keys(filterSelection(c))).not.toContain("q");
  });
  it("compara conjuntos sem considerar ordem e remove somente a seleção indicada", () => {
    const selected = {
      ...emptyFilters(),
      courts: ["TJGO", "TJSP"],
      documentTypes: ["Sentença"],
    };
    expect(
      sameFilters(selected, { ...selected, courts: ["TJSP", "TJGO"] }),
    ).toBe(true);
    expect(
      removeFilter(selected, { key: "court", value: "TJGO", label: "TJGO" }),
    ).toMatchObject({ courts: ["TJSP"], documentTypes: ["Sentença"] });
  });
});
