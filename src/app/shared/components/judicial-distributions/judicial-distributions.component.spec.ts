import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, describe, expect, it } from "vitest";
import { judicialDistribution } from "../../../../../tests/judicial-fixtures";
import { JudicialDistributionsComponent } from "./judicial-distributions.component";
const select = (value: string) => ({ target: { value } }) as unknown as Event;
afterEach(() => TestBed.resetTestingModule());
describe("Órgãos, relatores e classes no recorte", () => {
  it("isola o órgão pelo tribunal e reinicia a escolha do órgão ao trocar de tribunal", () => {
    const component = TestBed.runInInjectionContext(
      () => new JudicialDistributionsComponent(),
    );
    Object.defineProperty(component, "distribution", {
      value: signal(judicialDistribution()),
    });
    expect(component.court()?.name).toBe("TJGO");
    expect(component.rapporteurBuckets()).toEqual([
      { label: "Maria Silva", count: 2 },
    ]);
    component.chooseOrgan(select(component.key("2ª Vara")));
    expect(component.rapporteurBuckets()).toEqual([
      { label: "João Lima", count: 1 },
    ]);
    component.chooseCourt(select(component.key("TJSP")));
    expect(component.organ()?.name).toBe("1ª Vara");
    expect(component.rapporteurBuckets()).toEqual([
      { label: "Maria Silva", count: 1 },
    ]);
    component.chooseCourt(select(component.key(null)));
    expect(component.missingOrgan()).toBe(1);
    expect(component.rapporteurBuckets()).toEqual([]);
    expect(component.organ()?.ambiguousRapporteur).toBe(1);
  });
  it("mostra código com o nome da classe e conserva códigos distintos com nomes iguais", () => {
    const component = TestBed.runInInjectionContext(
      () => new JudicialDistributionsComponent(),
    );
    Object.defineProperty(component, "distribution", {
      value: signal(judicialDistribution()),
    });
    expect(component.classBuckets()).toEqual([
      { label: "Apelação · Código 198", count: 3 },
      { label: "Apelação · Código 7", count: 1 },
      { label: "Classe sem nome · Código 111", count: 1 },
    ]);
  });
});
