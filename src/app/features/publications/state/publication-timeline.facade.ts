import { Injectable, OnDestroy, computed, inject, signal } from "@angular/core";
import { ReadPublicationTimeline } from "../../../application/read-publication-timeline";
import {
  PublicationTimeline,
  TimelinePublication,
  PublicationTimelineQuery,
  compareTimelinePublications,
} from "../../../core/publication-timeline";
import { SearchFailure } from "../../../core/search";
@Injectable()
export class PublicationTimelineFacade implements OnDestroy {
  private readonly timeline = inject(ReadPublicationTimeline);
  readonly report = signal<PublicationTimeline | null>(null);
  private readonly loaded = signal<readonly TimelinePublication[]>([]);
  private readonly visibleLimit = signal(5);
  readonly publications = computed(() =>
    this.loaded().slice(0, this.visibleLimit()),
  );
  readonly hasMore = computed(
    () =>
      this.loaded().length > this.publications().length ||
      !!this.report()?.hasMore,
  );
  readonly selectedProcess = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal<SearchFailure | null>(null);
  private id: string | null = null;
  private controller: AbortController | null = null;
  private version = 0;
  private lastQuery: {
    query: PublicationTimelineQuery;
    append: boolean;
  } | null = null;
  reset() {
    this.version++;
    this.controller?.abort();
    this.controller = null;
    this.id = null;
    this.report.set(null);
    this.loaded.set([]);
    this.visibleLimit.set(5);
    this.selectedProcess.set(null);
    this.loading.set(false);
    this.error.set(null);
    this.lastQuery = null;
  }
  load(id: string) {
    this.reset();
    this.id = id;
    return this.request({ cnj: null, page: 0, pageSize: 20 }, false);
  }
  select(cnj: string) {
    if (
      !this.report()?.processes.includes(cnj) ||
      cnj === this.selectedProcess()
    )
      return Promise.resolve(null);
    this.selectedProcess.set(cnj);
    this.loaded.set([]);
    this.visibleLimit.set(5);
    return this.request({ cnj, page: 0, pageSize: 20 }, false);
  }
  async loadMore() {
    const report = this.report();
    if (!this.hasMore() || !report || this.loading() || this.error())
      return undefined;
    const visible = this.publications().length;
    const next = this.loaded()[visible]?.id;
    this.visibleLimit.update((limit) => limit + 10);
    if (this.loaded().length >= this.visibleLimit() || !report.hasMore)
      return next ?? null;
    const result = await this.request(
      { cnj: report.selectedProcess, page: report.page + 1, pageSize: 20 },
      true,
    );
    return result === undefined ? undefined : (next ?? result);
  }
  retry() {
    return this.lastQuery
      ? this.request(this.lastQuery.query, this.lastQuery.append)
      : Promise.resolve(null);
  }
  private async request(
    query: PublicationTimelineQuery,
    append: boolean,
  ): Promise<string | null | undefined> {
    if (!this.id) return undefined;
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    const version = ++this.version;
    const id = this.id;
    const current = () =>
      this.id === id && this.version === version && !controller.signal.aborted;
    this.lastQuery = { query, append };
    this.loading.set(true);
    this.error.set(null);
    try {
      const report = await this.timeline.execute(id, query, controller.signal);
      if (!current()) return undefined;
      const previous = append ? this.loaded() : [];
      const seen = new Set(previous.map((item) => item.id));
      const firstNew = report.publications.find((item) => !seen.has(item.id));
      const merged = new Map(previous.map((item) => [item.id, item]));
      for (const item of report.publications) merged.set(item.id, item);
      this.loaded.set([...merged.values()].sort(compareTimelinePublications));
      this.report.set(report);
      this.selectedProcess.set(report.selectedProcess);
      return firstNew?.id ?? null;
    } catch (error) {
      if (!current()) return undefined;
      this.error.set(
        error instanceof SearchFailure
          ? error
          : new SearchFailure(
              "TIMELINE_ERROR",
              "Não foi possível carregar a linha do tempo.",
            ),
      );
      return null;
    } finally {
      if (current()) this.loading.set(false);
    }
  }
  ngOnDestroy() {
    this.reset();
  }
}
