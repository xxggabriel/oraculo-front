import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, describe, expect, it } from "vitest";
import { Criteria, initialCriteria } from "../../../core/search";
import { SearchQueryComponent } from "./search-query.component";

afterEach(() => TestBed.resetTestingModule());
describe("Texto da pesquisa", () => {
  it("preserva texto e modo em edição quando apenas os filtros mudam", () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(
      () => new SearchQueryComponent(),
    );
    const criteria = signal<Criteria>({ ...initialCriteria, q: "contrato" });
    Object.defineProperty(component, "criteria", { value: criteria });
    TestBed.tick();
    component.form.setValue({
      q: "nova pesquisa ainda não enviada",
      mode: "phrase",
    });
    criteria.set({ ...criteria(), courts: ["TJGO"] });
    TestBed.tick();
    expect(component.form.getRawValue()).toEqual({
      q: "nova pesquisa ainda não enviada",
      mode: "phrase",
    });
    criteria.set({ ...criteria(), q: "consulta da URL" });
    TestBed.tick();
    expect(component.form.getRawValue()).toEqual({
      q: "consulta da URL",
      mode: "auto",
    });
  });
});
