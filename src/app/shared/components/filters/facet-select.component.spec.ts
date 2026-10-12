import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Distribution } from "../../../core/search";
import { FacetSelectComponent } from "./facet-select.component";
const facet = (values: readonly [string, number][]): Distribution => ({
  field: "court",
  buckets: values.map(([label, count]) => ({ label, count })),
  missing: 0,
  truncated: true,
  approximate: false,
  countError: 0,
  other: 0,
});
function setup() {
  TestBed.configureTestingModule({});
  const component = TestBed.runInInjectionContext(
    () => new FacetSelectComponent(),
  );
  // Direct signal inputs keep these control tests independent of the Angular
  // compiler transform; the real template is covered by browser tests.
  const contextKey = signal("assunto"),
    distribution = signal<Distribution>(
      facet([
        ["TJGO", 10],
        ["TJSP", 5],
      ]),
    ),
    selected = signal<readonly string[]>([]);
  Object.defineProperties(component, {
    contextKey: { value: contextKey },
    distribution: { value: distribution },
    selected: { value: selected },
  });
  TestBed.tick();
  return { component, contextKey, distribution, selected };
}
afterEach(() => TestBed.resetTestingModule());
describe("Opções de facetas", () => {
  it("preserva opções observadas e seleções ausentes sem reaproveitar contagens antigas", () => {
    const { component, contextKey, distribution, selected } = setup();
    distribution.set(facet([["TJGO", 2]]));
    selected.set(["TJAP"]);
    TestBed.tick();
    expect(component.options()).toEqual([
      { value: "TJAP", count: null },
      { value: "TJGO", count: 2 },
      { value: "TJSP", count: null },
    ]);
    contextKey.set("outro assunto");
    distribution.set(facet([["TJRO", 3]]));
    TestBed.tick();
    expect(component.options()).toEqual([
      { value: "TJAP", count: null },
      { value: "TJRO", count: 3 },
    ]);
  });
  it("pesquisa opções e emite múltipla seleção sem gerar valores novos", () => {
    const { component, selected } = setup(),
      selection = vi.fn();
    component.selectionChange.subscribe(selection);
    component.search.set("tjsp");
    expect(component.visible()).toEqual([{ value: "TJSP", count: 5 }]);
    selected.set(["TJGO"]);
    TestBed.tick();
    component.toggle("TJSP");
    expect(selection).toHaveBeenCalledWith(["TJGO", "TJSP"]);
    component.search.set("inexistente");
    expect(component.options()).toEqual([]);
  });
});
