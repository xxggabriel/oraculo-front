import { TestBed } from "@angular/core/testing";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Research } from "../../../application/research";
import { ReferenceJurimetry } from "../../../application/reference-jurimetry";
import { ReferenceQuery, ReferenceReport } from "../../../core/jurimetry";
import { initialCriteria, SearchFailure } from "../../../core/search";
import { referenceReport } from "../../../../../tests/jurimetry-fixtures";
import { JurimetryFacade } from "./jurimetry.facade";
const query: ReferenceQuery = {
  criteria: initialCriteria,
  references: "either",
  includeProposals: true,
  pageSize: 10,
  page: 0,
};
function setup() {
  const research = {
    capabilities: vi.fn().mockResolvedValue({
      features: [],
      versions: [],
      checkedAt: "2026-10-11T00:00:00Z",
      warnings: [],
    }),
    facets: vi.fn().mockResolvedValue([]),
  };
  const queryReferences = vi
    .fn<ReferenceJurimetry["query"]>()
    .mockResolvedValue(referenceReport());
  TestBed.configureTestingModule({
    providers: [
      JurimetryFacade,
      { provide: Research, useValue: research },
      { provide: ReferenceJurimetry, useValue: { query: queryReferences } },
    ],
  });
  return { facade: TestBed.inject(JurimetryFacade), research, queryReferences };
}
afterEach(() => TestBed.resetTestingModule());
describe("JurimetryFacade", () => {
  it("prepara filtros sem executar o cruzamento global na página inicial", async () => {
    const { facade, queryReferences, research } = setup();
    await facade.load(query, false);
    expect(queryReferences).not.toHaveBeenCalled();
    expect(research.facets).toHaveBeenCalled();
    expect(facade.enabled()).toBe(false);
    expect(facade.loading()).toBe(false);
  });
  it("cancela consultas superadas e não mistura lista e plots de recortes distintos", async () => {
    const { facade, queryReferences } = setup();
    let finish!: (report: ReferenceReport) => void;
    queryReferences.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const first = facade.load(query, true);
    const signal = queryReferences.mock.calls[0][1];
    await facade.load({ ...query, references: "both" }, true);
    expect(signal.aborted).toBe(true);
    finish(referenceReport(50));
    await first;
    expect(facade.report()?.population).toBe(1);
    expect(facade.references()).toBe("both");
  });
  it("remove dados antigos diante de recorte amplo e mantém os filtros para refino", async () => {
    const { facade, queryReferences } = setup();
    await facade.load(query, true);
    queryReferences.mockRejectedValueOnce(
      new SearchFailure("QUERY_TIMEOUT", "Refine o recorte."),
    );
    await facade.load(
      { ...query, criteria: { ...initialCriteria, q: "consulta ampla" } },
      true,
    );
    expect(facade.report()).toBeNull();
    expect(facade.error()?.code).toBe("QUERY_TIMEOUT");
    expect(facade.criteria().q).toBe("consulta ampla");
    expect(facade.loading()).toBe(false);
  });
  it("mantém facetas da população analisada quando o catálogo geral chega depois", async () => {
    const { facade, research } = setup();
    let finish!: (value: unknown[]) => void;
    research.facets.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    await facade.load(query, true);
    finish([{ field: "court", buckets: [{ label: "other", count: 99 }] }]);
    await Promise.resolve();
    expect(facade.facets()).toEqual([]);
    facade.ngOnDestroy();
    expect(research.facets.mock.calls[0][1].aborted).toBe(true);
  });
});
