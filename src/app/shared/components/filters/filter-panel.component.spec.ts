import { ElementRef, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Criteria, initialCriteria } from "../../../core/search";
import { FilterPanelComponent } from "./filter-panel.component";

function setup() {
  TestBed.configureTestingModule({});
  const panel = TestBed.runInInjectionContext(() => new FilterPanelComponent());
  // Vitest executes classes without Angular's input metadata transform. Supply
  // reactive inputs directly; browser tests exercise the template bindings.
  const criteria = signal<Criteria>({
    ...initialCriteria,
    q: "contrato",
    courts: ["TJGO"],
  });
  Object.defineProperty(panel, "criteria", { value: criteria });
  TestBed.tick();
  return { panel, criteria };
}
afterEach(() => TestBed.resetTestingModule());
describe("Rascunho dos filtros", () => {
  it("aplica a publicidade explicitamente, cancela o rascunho e limpa para ambos", () => {
    const { panel } = setup();
    const applied = vi.fn();
    panel.apply.subscribe(applied);
    const context = panel.contextKey();
    panel.form.controls.visibility.setValue("restricted");
    expect(panel.draft().visibility).toBe("restricted");
    expect(panel.pending()).toBe(true);
    expect(applied).not.toHaveBeenCalled();
    expect(panel.contextKey()).toBe(context);
    panel.cancel();
    expect(panel.form.controls.visibility.value).toBe("both");
    panel.form.controls.visibility.setValue("public");
    panel.submit();
    expect(applied).toHaveBeenCalledWith(
      expect.objectContaining({ visibility: "public" }),
    );
    panel.clearFilters();
    expect(panel.draft().visibility).toBe("both");
  });
  it("mantém seleções sem consultar, aplica explicitamente e descarta no cancelamento", () => {
    const { panel } = setup();
    const applied = vi.fn();
    panel.apply.subscribe(applied);
    panel.selectCourts(["TJGO", "TJSP"]);
    expect(panel.pending()).toBe(true);
    expect(applied).not.toHaveBeenCalled();
    panel.open.set(true);
    panel.cancel();
    expect(panel.draft().courts).toEqual(["TJGO"]);
    expect(panel.pending()).toBe(false);
    expect(panel.open()).toBe(false);
    panel.selectTypes(["Sentença"]);
    panel.open.set(true);
    panel.submit();
    expect(applied).toHaveBeenCalledWith(
      expect.objectContaining({
        courts: ["TJGO"],
        documentTypes: ["Sentença"],
      }),
    );
    expect(panel.open()).toBe(false);
  });
  it("bloqueia aplicação de datas parciais e informa o erro", () => {
    const { panel } = setup(),
      applied = vi.fn();
    panel.apply.subscribe(applied);
    panel.form.controls.from.setValue("2026-10-01");
    panel.submit();
    expect(applied).not.toHaveBeenCalled();
    expect(panel.error()).toContain("data inicial e a data final");
    panel.form.controls.to.setValue("2026-10-31");
    panel.submit();
    expect(panel.error()).toBeNull();
    expect(applied).toHaveBeenCalledOnce();
  });
  it("mantém o painel aberto e o rascunho para corrigir somente sem data com período", () => {
    const { panel } = setup(),
      applied = vi.fn();
    panel.apply.subscribe(applied);
    panel.open.set(true);
    panel.form.patchValue({
      from: "2026-10-05",
      to: "2026-10-11",
      missingDates: "only",
    });
    panel.submit();
    expect(applied).not.toHaveBeenCalled();
    expect(panel.open()).toBe(true);
    expect(panel.error()).toContain("Todo o período");
    expect(panel.draft()).toMatchObject({
      from: "2026-10-05",
      to: "2026-10-11",
      missingDates: "only",
    });
    panel.form.patchValue({ from: "", to: "" });
    panel.submit();
    expect(applied).toHaveBeenCalledWith(
      expect.objectContaining({ missingDates: "only", from: null, to: null }),
    );
  });
  it("separa IDs e retorna foco ao botão da própria instância ao cancelar", () => {
    const { panel: first } = setup();
    const second = TestBed.runInInjectionContext(
      () => new FilterPanelComponent(),
    );
    Object.defineProperty(second, "criteria", {
      value: signal<Criteria>(initialCriteria),
    });
    Object.defineProperty(first, "idPrefix", { value: signal("first") });
    Object.defineProperty(second, "idPrefix", { value: signal("second") });
    TestBed.tick();
    const suffixes = [
      "toggle",
      "fields",
      "courts",
      "types",
      "from",
      "to",
      "missing",
      "date-axis",
      "error",
    ];
    const ids = suffixes.flatMap((suffix) => [
      first.id(suffix),
      second.id(suffix),
    ]);
    expect(new Set(ids).size).toBe(ids.length);
    const firstButton = document.createElement("button"),
      secondButton = document.createElement("button");
    firstButton.id = first.id("toggle");
    secondButton.id = second.id("toggle");
    document.body.append(firstButton, secondButton);
    Object.defineProperty(first, "toggleButton", {
      value: signal(new ElementRef(firstButton)),
    });
    Object.defineProperty(second, "toggleButton", {
      value: signal(new ElementRef(secondButton)),
    });
    first.open.set(true);
    first.selectCourts(["TJSP"]);
    first.cancel();
    expect(document.activeElement).toBe(firstButton);
    first.toggleOpen();
    expect(first.draft().courts).toEqual(["TJGO"]);
    second.open.set(true);
    second.selectCourts(["TJAP"]);
    second.cancel();
    expect(document.activeElement).toBe(secondButton);
    second.toggleOpen();
    expect(second.draft().courts).toEqual([]);
    firstButton.remove();
    secondButton.remove();
  });
  it("sincroniza filtros navegados e mantém valores que não aparecem nas facetas", () => {
    const { panel, criteria } = setup();
    panel.selectCourts(["TJSP"]);
    criteria.set({ ...initialCriteria, courts: ["TJAP"] });
    TestBed.tick();
    expect(panel.draft().courts).toEqual(["TJAP"]);
    expect(panel.pending()).toBe(false);
  });
});

describe("Filtros de pessoas", () => {
  it("aplica os nomes e OAB, cancela o rascunho e reinicia o contexto somente após aplicação", () => {
    const { panel, criteria } = setup();
    const applied = vi.fn();
    panel.apply.subscribe(applied);
    const context = panel.contextKey();
    panel.form.patchValue({
      partyName: " Maria Silva ",
      attorneyName: "João Lima",
      oabNumber: "00123A",
      oabState: "go",
    });
    expect(panel.contextKey()).toBe(context);
    panel.submit();
    const filters = applied.mock.calls[0][0];
    expect(filters).toMatchObject({
      partyName: "Maria Silva",
      attorneyName: "João Lima",
      oabNumber: "00123A",
      oabState: "GO",
    });
    criteria.set({ ...criteria(), ...filters });
    TestBed.tick();
    expect(panel.contextKey()).not.toBe(context);
    panel.form.controls.partyName.setValue("Outra parte");
    panel.cancel();
    expect(panel.form.controls.partyName.value).toBe("Maria Silva");
    panel.clearFilters();
    expect(panel.draft()).toMatchObject({
      partyName: null,
      attorneyName: null,
      oabNumber: null,
      oabState: null,
    });
  });
  it("oferece todos os estados e DF e remove a restrição de UF", () => {
    const { panel } = setup();
    expect(panel.brazilianStates).toHaveLength(27);
    expect(new Set(panel.brazilianStates.map((s) => s.code)).size).toBe(27);
    expect(panel.brazilianStates.some((s) => s.code === "DF")).toBe(true);
    const applied = vi.fn();
    panel.apply.subscribe(applied);
    panel.form.patchValue({ attorneyName: "Ana Souza", oabState: "GO" });
    panel.submit();
    expect(applied.mock.calls[0][0].oabState).toBe("GO");
    panel.form.controls.oabState.setValue("");
    panel.submit();
    expect(applied.mock.calls[1][0]).toMatchObject({
      attorneyName: "Ana Souza",
      oabState: null,
    });
  });
  it("informa erro para UF incompleta", () => {
    const { panel } = setup();
    const applied = vi.fn();
    panel.apply.subscribe(applied);
    panel.form.patchValue({ oabNumber: "123", oabState: "G" });
    panel.submit();
    expect(applied).not.toHaveBeenCalled();
    expect(panel.error()).toContain("UF válida");
  });
});
