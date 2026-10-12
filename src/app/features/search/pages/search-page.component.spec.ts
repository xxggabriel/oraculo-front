import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router, convertToParamMap } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Criteria, initialCriteria } from "../../../core/search";
import { SearchFacade } from "../state/search.facade";
import {
  SearchPageComponent,
  criteriaFromParams,
} from "./search-page.component";

afterEach(() => TestBed.resetTestingModule());
describe("Pesquisa orientada à URL", () => {
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
    const page = TestBed.runInInjectionContext(() => new SearchPageComponent());
    page.clearFilters();
    expect(router.createUrlTree).toHaveBeenCalledWith(["/"], {
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
      }),
    });
    page.ngOnDestroy();
  });
});
