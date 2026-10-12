import { TestBed } from "@angular/core/testing";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Analysis,
  Capabilities,
  Criteria,
  PublicationDetail,
  SearchFailure,
  SearchGateway,
  SearchPage,
  initialCriteria,
} from "../../../core/search";
import {
  SEARCH_GATEWAY,
  searchProviders,
} from "../../../composition/search.providers";
import { SearchFacade } from "./search.facade";
const page = (id: string, nextCursor: string | null = null): SearchPage => ({
  publications: [],
  total: 1,
  totalRelation: "eq",
  nextCursor,
  sessionId: id,
  expiresAt: "2030-01-01T00:00:00Z",
  duration: 1,
  strategy: "lexical-v1",
  consistency: "projection_snapshot",
  warnings: [],
});
const analysis: Analysis = {
  state: "ok",
  population: 1,
  numerator: null,
  denominator: 1,
  value: null,
  distributions: [],
  excludedMissingDates: 0,
  dateAxis: "publication",
  missingDates: "include",
  reviewPolicy: "publication",
  selectionPolicy: "not_applicable",
  observedAt: "2026-10-11T00:00:00Z",
  warnings: [],
  consistency: "projection_snapshot",
};
class FakeGateway implements SearchGateway {
  search = vi
    .fn<
      (
        c: Criteria,
        cursor: string | null,
        signal: AbortSignal,
      ) => Promise<SearchPage>
    >()
    .mockResolvedValue(page("first", "next"));
  facets = vi.fn().mockResolvedValue([]);
  analyze = vi.fn().mockResolvedValue(analysis);
  capabilities = vi.fn().mockResolvedValue({
    features: [],
    checkedAt: "2026-10-11T00:00:00Z",
    versions: ["2"],
    warnings: [],
  } satisfies Capabilities);
  detail = vi.fn<() => Promise<PublicationDetail>>();
  close = vi.fn().mockResolvedValue(undefined);
}
function setup(gateway: FakeGateway) {
  TestBed.configureTestingModule({
    providers: [...searchProviders, SearchFacade],
  });
  TestBed.overrideProvider(SEARCH_GATEWAY, { useValue: gateway });
  return TestBed.inject(SearchFacade);
}
afterEach(() => TestBed.resetTestingModule());
describe("SearchFacade com substituição do provider SearchGateway", () => {
  it("cancela e ignora respostas de uma busca superada", async () => {
    const gateway = new FakeGateway();
    let resolveFirst!: (p: SearchPage) => void;
    gateway.search
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce(page("second"));
    const facade = setup(gateway);
    const first = facade.search({ ...initialCriteria, q: "antiga" });
    const signal = gateway.search.mock.calls[0][2];
    await facade.search({ ...initialCriteria, q: "nova" });
    expect(signal.aborted).toBe(true);
    resolveFirst(page("first"));
    await first;
    expect(facade.page()?.sessionId).toBe("second");
    expect(facade.criteria().q).toBe("nova");
    expect(gateway.close).toHaveBeenCalledWith("first");
  });
  it("reconsulta a página anterior e reabre a primeira página para revalidar acesso", async () => {
    const gateway = new FakeGateway();
    gateway.search
      .mockResolvedValueOnce(page("session", "cursor"))
      .mockResolvedValueOnce(page("session"));
    const facade = setup(gateway);
    await facade.search(initialCriteria);
    await facade.next();
    expect(facade.pageNumber()).toBe(2);
    await facade.previous();
    expect(facade.pageNumber()).toBe(1);
    expect(gateway.search).toHaveBeenCalledTimes(3);
    expect(gateway.search.mock.calls[2][1]).toBeNull();
    await facade.search({ ...initialCriteria, q: "novo" });
    expect(gateway.close).toHaveBeenCalledWith("session");
    expect(facade.pageNumber()).toBe(1);
  });
  it("preserva filtros e resultados quando o cursor expira", async () => {
    const gateway = new FakeGateway();
    gateway.search
      .mockResolvedValueOnce(page("session", "expired"))
      .mockRejectedValueOnce(
        new SearchFailure("CURSOR_EXPIRED", "Sessão expirada."),
      );
    const facade = setup(gateway);
    await facade.search({ ...initialCriteria, q: "indenização" });
    await facade.next();
    expect(facade.error()?.code).toBe("CURSOR_EXPIRED");
    expect(facade.criteria().q).toBe("indenização");
    expect(facade.pageNumber()).toBe(1);
  });
  it("fecha a sessão e aborta requisições na destruição", async () => {
    const gateway = new FakeGateway();
    const facade = setup(gateway);
    await facade.search(initialCriteria);
    facade.ngOnDestroy();
    expect(gateway.close).toHaveBeenCalledWith("first");
    expect(gateway.search.mock.calls[0][2].aborted).toBe(true);
  });
});
