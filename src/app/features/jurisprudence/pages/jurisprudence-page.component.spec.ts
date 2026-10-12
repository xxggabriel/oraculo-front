import { criteriaFromParams } from "../../../shared/criteria-url";
import { ElementRef, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router, convertToParamMap } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Criteria, initialCriteria } from "../../../core/search";
import { SearchFacade } from "../../search/state/search.facade";
import { FilterPanelComponent } from "../../../shared/components/filters/filter-panel.component";
import { JurisprudencePageComponent } from "./jurisprudence-page.component";

afterEach(() => TestBed.resetTestingModule());
describe("Jurisprudência orientada à URL", () => {
  it("restaura seleções múltiplas e políticas temporais ao navegar", () => {
    const criteria = criteriaFromParams(
      convertToParamMap({
        q: "dano moral",
        courts: "TJGO,TJSP,TJGO",
        types: "Sentença",
        dateAxis: "availability",
        missingDates: "exclude",
        from: "2026-10-01",
        to: "2026-10-11",
        process: "0000000-00.2026.0.00.0000",
        relation: "referenced",
      }),
    );
    expect(criteria).toMatchObject({
      q: "dano moral",
      courts: ["TJGO", "TJSP"],
      documentTypes: ["Sentença"],
      dateAxis: "availability",
      missingDates: "exclude",
      process: { relation: "referenced" },
    });
  });
  it("limpa somente os filtros e preserva texto, modo, página e ordenação", () => {
    const criteria = signal<Criteria>(initialCriteria),
      pageSize = signal(10);
    const search = vi.fn((c: Criteria, size: number) => {
      criteria.set(c);
      pageSize.set(size);
      return Promise.resolve();
    });
    const route = {
      queryParamMap: new BehaviorSubject(
        convertToParamMap({
          q: "dano moral",
          mode: "phrase",
          sort: "date_desc",
          size: "25",
          courts: "TJGO",
          from: "2026-10-01",
          to: "2026-10-11",
        }),
      ),
    };
    const router = {
      url: "/",
      createUrlTree: vi.fn(
        (_path: readonly string[], options: unknown) => options,
      ),
      serializeUrl: () => "/?new",
      navigateByUrl: vi.fn().mockResolvedValue(true),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: SearchFacade, useValue: { criteria, pageSize, search } },
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
      ],
    });
    const page = TestBed.runInInjectionContext(
      () => new JurisprudencePageComponent(),
    );
    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "jurisprudence",
        ranking: "bm25",
      }),
      25,
    );
    page.clearFilters();
    expect(router.createUrlTree).toHaveBeenCalledWith(["/jurisprudencia"], {
      queryParams: expect.objectContaining({
        q: "dano moral",
        mode: "phrase",
        size: 25,
        sort: "date_desc",
        courts: null,
        types: null,
        process: null,
        from: null,
        to: null,
        missingDates: null,
        dateAxis: null,
        ranking: "bm25",
        collection: null,
      }),
    });
    page.ngOnDestroy();
  });
});

function createPage() {
  const criteria = signal<Criteria>(initialCriteria),
    pageSize = signal(10);
  const search = vi.fn((c: Criteria) => {
    criteria.set(c);
    return Promise.resolve();
  });
  const route = { queryParamMap: new BehaviorSubject(convertToParamMap({})) };
  const router = {
    url: "/jurisprudencia",
    createUrlTree: vi.fn(
      (_path: readonly string[], options: unknown) => options,
    ),
    serializeUrl: () => "/jurisprudencia?new",
    navigateByUrl: vi.fn().mockResolvedValue(true),
  };
  TestBed.configureTestingModule({
    providers: [
      { provide: SearchFacade, useValue: { criteria, pageSize, search } },
      { provide: ActivatedRoute, useValue: route },
      { provide: Router, useValue: router },
    ],
  });
  const page = TestBed.runInInjectionContext(
    () => new JurisprudencePageComponent(),
  );
  return { page, criteria, router, route };
}

describe("Pesquisa simplificada", () => {
  it("combina ordenação e relevância sem enviar data com reranking", () => {
    const { page, router, criteria } = createPage();
    expect(page.ordering()).toBe("rerank");
    for (const [value, sort, ranking] of [
      ["date_desc", "date_desc", "bm25"],
      ["bm25", "relevance", "bm25"],
      ["rerank", "relevance", "rerank"],
    ]) {
      page.changeOrdering({ target: { value } } as unknown as Event);
      expect(router.createUrlTree).toHaveBeenLastCalledWith(
        ["/jurisprudencia"],
        {
          queryParams: expect.objectContaining({
            sort: sort === "relevance" ? null : sort,
            ranking,
          }),
        },
      );
    }
    criteria.set({ ...criteria(), sort: "date_desc", ranking: "bm25" });
    expect(page.ordering()).toBe("date_desc");
    page.ngOnDestroy();
  });
  it("descarta o rascunho ao fechar e restaura foco e rolagem", () => {
    const { page, criteria } = createPage();
    const panel = TestBed.runInInjectionContext(
      () => new FilterPanelComponent(),
    );
    Object.defineProperty(panel, "criteria", { value: criteria });
    TestBed.tick();
    const dialog = document.createElement("dialog"),
      trigger = document.createElement("button");
    const show = vi.fn(() => dialog.setAttribute("open", ""));
    Object.defineProperty(dialog, "showModal", { value: show });
    Object.defineProperty(dialog, "close", {
      value: vi.fn(() => dialog.removeAttribute("open")),
    });
    document.body.append(dialog, trigger);
    Object.defineProperty(page, "filterDialog", {
      value: signal(new ElementRef(dialog)),
    });
    Object.defineProperty(page, "filtersButton", {
      value: signal(new ElementRef(trigger)),
    });
    Object.defineProperty(page, "filters", { value: signal(panel) });
    panel.cancelled.subscribe(() => page.closeFilters());
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "clip";
    page.openFilters();
    page.openFilters();
    expect(show).toHaveBeenCalledOnce();
    expect(document.body.style.overflow).toBe("hidden");
    panel.selectCourts(["TJGO"]);
    vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue(
      new DOMRect(10, 10, 280, 390),
    );
    const paddingClick = new MouseEvent("click", { clientX: 14, clientY: 90 });
    Object.defineProperty(paddingClick, "target", { value: dialog });
    page.dialogClick(paddingClick);
    expect(dialog.open).toBe(true);
    expect(panel.draft().courts).toEqual(["TJGO"]);
    page.dismissFilters();
    expect(panel.draft().courts).toEqual([]);
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("clip");
    page.openFilters();
    page.ngOnDestroy();
    expect(dialog.open).toBe(false);
    expect(document.body.style.overflow).toBe("clip");
    document.body.style.overflow = originalOverflow;
    dialog.remove();
    trigger.remove();
    panel.ngOnDestroy();
  });
});
