import { TestBed } from "@angular/core/testing";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReadPublicationTimeline } from "../../../application/read-publication-timeline";
import { PublicationTimeline } from "../../../core/publication-timeline";
import { testTimeline } from "../../../../../tests/related-fixtures";
import { PublicationTimelineFacade } from "./publication-timeline.facade";
function setup() {
  const execute = vi
    .fn<ReadPublicationTimeline["execute"]>()
    .mockImplementation(async (id) => testTimeline(id));
  TestBed.configureTestingModule({
    providers: [{ provide: ReadPublicationTimeline, useValue: { execute } }],
  });
  return {
    execute,
    facade: TestBed.runInInjectionContext(
      () => new PublicationTimelineFacade(),
    ),
  };
}
afterEach(() => TestBed.resetTestingModule());
describe("Linha do tempo por publicação", () => {
  it("cancela e ignora resposta de uma publicação anterior", async () => {
    const { execute, facade } = setup();
    let finish!: (report: PublicationTimeline) => void;
    execute.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const first = facade.load("first");
    const signal = execute.mock.calls[0][2];
    await facade.load("second");
    finish(testTimeline("first"));
    await first;
    expect(signal.aborted).toBe(true);
    expect(facade.report()?.publicationId).toBe("second");
    facade.ngOnDestroy();
  });
  it("agrega páginas sem duplicar e ordena datas ausentes ao final", async () => {
    const { execute, facade } = setup();
    const first = testTimeline("source", ["b", "unknown"]);
    first.hasMore = true;
    first.publications[1].publicationDate = null;
    execute.mockResolvedValueOnce(first);
    await facade.load("source");
    const next = testTimeline("source", ["a", "b"]);
    next.page = 1;
    next.publications[0].publicationDate = "2026-10-01";
    execute.mockResolvedValueOnce(next);
    expect(await facade.loadMore()).toBe("a");
    expect(facade.publications().map((p) => p.id)).toEqual([
      "a",
      "b",
      "unknown",
    ]);
    expect(execute.mock.calls[1][1]).toMatchObject({
      page: 1,
      cnj: first.selectedProcess,
    });
    facade.ngOnDestroy();
  });
  it("preserva páginas carregadas na falha e repete só a página pendente", async () => {
    const { execute, facade } = setup();
    const first = testTimeline("source");
    first.hasMore = true;
    execute.mockResolvedValueOnce(first);
    await facade.load("source");
    execute.mockRejectedValueOnce(new Error("offline"));
    await facade.loadMore();
    expect(facade.publications()).toHaveLength(1);
    expect(facade.error()?.code).toBe("TIMELINE_ERROR");
    const next = testTimeline("source", ["next"]);
    next.page = 1;
    execute.mockResolvedValueOnce(next);
    await facade.retry();
    expect(execute.mock.calls[2][1].page).toBe(1);
    expect(facade.error()).toBeNull();
    expect(facade.publications()).toHaveLength(2);
    facade.ngOnDestroy();
  });
  it("troca o processo vinculado reiniciando a paginação e cancela na destruição", async () => {
    const { execute, facade } = setup();
    const first = testTimeline("source");
    first.processes.push("00099991120248090001");
    execute.mockResolvedValueOnce(first);
    await facade.load("source");
    await facade.select("00099991120248090001");
    expect(execute.mock.calls[1][1]).toMatchObject({
      cnj: "00099991120248090001",
      page: 0,
    });
    facade.ngOnDestroy();
    expect(execute.mock.calls[1][2].aborted).toBe(true);
    expect(facade.publications()).toEqual([]);
  });
});
