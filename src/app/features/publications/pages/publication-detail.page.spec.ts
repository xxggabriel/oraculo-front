import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router, convertToParamMap } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicationTimelineFacade } from "../state/publication-timeline.facade";
import { Research } from "../../../application/research";
import { RecommendRelatedPublications } from "../../../application/recommend-related-publications";
import { RelatedPublications } from "../../../core/related-publications";
import { PublicationDetail, SearchFailure } from "../../../core/search";
import { testDetail, testRelated } from "../../../../../tests/related-fixtures";
import { PublicationDetailPage } from "./publication-detail.page";
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
function setup() {
  const params = new BehaviorSubject(convertToParamMap({ id: "first" }));
  const detail = vi
    .fn<(id: string, signal: AbortSignal) => Promise<PublicationDetail>>()
    .mockImplementation(async (id) => testDetail(id));
  const execute = vi
    .fn<RecommendRelatedPublications["execute"]>()
    .mockImplementation(async (id) => testRelated(id));
  const timeline = {
    reset: vi.fn(),
    load: vi.fn().mockResolvedValue(null),
    selectedProcess: signal<string | null>("00012345120248090001"),
    loading: signal(false),
    loadMore: vi.fn().mockResolvedValue("next"),
  };
  TestBed.configureTestingModule({
    providers: [
      {
        provide: PublicationTimelineFacade,
        useValue: timeline,
      },
      { provide: Research, useValue: { detail } },
      { provide: RecommendRelatedPublications, useValue: { execute } },
      {
        provide: ActivatedRoute,
        useValue: {
          paramMap: params,
          snapshot: { fragment: null, queryParamMap: convertToParamMap({}) },
        },
      },
      { provide: Router, useValue: { url: "/publicacoes/first" } },
    ],
  });
  return {
    params,
    detail,
    execute,
    timeline,
    page: TestBed.runInInjectionContext(() => new PublicationDetailPage()),
  };
}
afterEach(() => TestBed.resetTestingModule());
describe("PublicationDetailPage e recomendações independentes", () => {
  it("preserva o detalhe quando apenas as recomendações falham", async () => {
    const { page, execute } = setup();
    execute.mockRejectedValueOnce(new SearchFailure("RELATED_ERROR", "Erro."));
    await flush();
    expect(page.detail()?.publication.id).toBe("first");
    expect(page.error()).toBeNull();
    expect(page.relatedError()?.code).toBe("RELATED_ERROR");
    expect(page.loading()).toBe(false);
    page.ngOnDestroy();
  });
  it("cancela e ignora recomendações da publicação anterior ao trocar o ID", async () => {
    const { page, execute, params } = setup();
    let finish!: (value: RelatedPublications) => void;
    execute.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    await flush();
    const firstSignal = execute.mock.calls[0][1];
    params.next(convertToParamMap({ id: "second" }));
    await flush();
    expect(firstSignal.aborted).toBe(true);
    finish(testRelated("first", ["stale"]));
    await flush();
    expect(page.related()?.publicationId).toBe("second");
    expect(page.detail()?.publication.id).toBe("second");
    expect(page.relatedLoading()).toBe(false);
    page.ngOnDestroy();
  });
  it("repetir recomendações não reconsulta o texto e descarta o pedido anterior", async () => {
    const { page, execute, detail } = setup();
    let finish!: (value: RelatedPublications) => void;
    execute.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    await flush();
    const section = document.createElement("section");
    section.id = "related-publications";
    section.tabIndex = -1;
    document.body.append(section);
    page.retryRelated();
    expect(document.activeElement).toBe(section);
    await flush();
    finish(testRelated("first", ["stale"]));
    await flush();
    expect(detail).toHaveBeenCalledOnce();
    expect(page.related()?.items[0].publication.id).toBe("recommendation");
    page.ngOnDestroy();
    expect(execute.mock.calls[1][1].aborted).toBe(true);
    section.remove();
  });
});

it("foca o primeiro item da timeline somente depois da renderização", async () => {
  const { page } = setup();
  await flush();
  await page.moreTimeline();
  const target = document.createElement("article");
  target.id = "timeline-item-next";
  target.tabIndex = -1;
  document.body.append(target);
  TestBed.tick();
  expect(document.activeElement).toBe(target);
  target.remove();
  page.ngOnDestroy();
});
