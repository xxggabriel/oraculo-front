import { Injectable, OnDestroy, inject, signal } from "@angular/core";
import { Research } from "../../../application/research";
import {
  Analysis,
  Capabilities,
  Criteria,
  Distribution,
  SearchFailure,
  SearchPage,
  initialCriteria,
} from "../../../core/search";
@Injectable()
export class SearchFacade implements OnDestroy {
  private readonly research = inject(Research);
  readonly criteria = signal<Criteria>(initialCriteria);
  readonly page = signal<SearchPage | null>(null);
  readonly capabilities = signal<Capabilities | null>(null);
  readonly facets = signal<readonly Distribution[]>([]);
  readonly analysis = signal<Analysis | null>(null);
  readonly loading = signal(false);
  readonly analysisLoading = signal(false);
  readonly error = signal<SearchFailure | null>(null);
  readonly analysisError = signal<SearchFailure | null>(null);
  readonly facetError = signal<SearchFailure | null>(null);
  readonly capabilityError = signal<SearchFailure | null>(null);
  readonly pageSize = signal(10);
  readonly pageNumber = signal(1);
  readonly hasPrevious = signal(false);
  private version = 0;
  private analysisRequested = false;
  private analysisVisible = false;
  private controller: AbortController | null = null;
  private readonly capabilityController = new AbortController();
  private cursors: (string | null)[] = [];
  private session: string | null = null;
  constructor() {
    void this.research
      .capabilities(this.capabilityController.signal)
      .then((c) => this.capabilities.set(c))
      .catch((e) => {
        if (!this.capabilityController.signal.aborted)
          this.capabilityError.set(this.failure(e));
      });
  }
  private failure(e: unknown): SearchFailure {
    return e instanceof SearchFailure
      ? e
      : new SearchFailure(
          "UNEXPECTED_ERROR",
          "Não foi possível concluir a consulta. Tente novamente.",
        );
  }
  private close() {
    if (this.session) {
      const old = this.session;
      this.session = null;
      void this.research.close(old).catch(() => undefined);
    }
  }
  async search(criteria: Criteria, pageSize = 10): Promise<void> {
    this.controller?.abort();
    this.close();
    this.controller = new AbortController();
    const signal = this.controller.signal;
    const version = ++this.version;
    this.criteria.set(criteria);
    this.pageSize.set(pageSize);
    this.page.set(null);
    this.cursors = [];
    this.pageNumber.set(1);
    this.hasPrevious.set(false);
    this.error.set(null);
    this.loading.set(true);
    this.facets.set([]);
    this.analysis.set(null);
    this.analysisError.set(null);
    this.facetError.set(null);
    this.analysisRequested = false;
    this.analysisLoading.set(false);
    try {
      const page = await this.research.search(criteria, null, signal, pageSize);
      if (version !== this.version) {
        if (page.sessionId)
          void this.research.close(page.sessionId).catch(() => undefined);
        return;
      }
      this.session = page.sessionId;
      this.cursors = [null];
      this.page.set(page);
      this.loadFacets(criteria, signal, version);
      if (this.analysisVisible) void this.loadAnalysis();
    } catch (e) {
      if (version === this.version && !signal.aborted)
        this.error.set(this.failure(e));
    } finally {
      if (version === this.version) this.loading.set(false);
    }
  }
  private loadFacets(criteria: Criteria, signal: AbortSignal, version: number) {
    void this.research
      .facets(criteria, signal)
      .then((f) => {
        if (version === this.version && !signal.aborted) this.facets.set(f);
      })
      .catch((e) => {
        if (version === this.version && !signal.aborted)
          this.facetError.set(this.failure(e));
      });
  }
  setAnalysisVisible(visible: boolean) {
    this.analysisVisible = visible;
    if (visible && this.page()) void this.loadAnalysis();
  }
  private async loadAnalysis(): Promise<void> {
    const controller = this.controller;
    if (!controller || this.analysisRequested) return;
    const version = this.version;
    const signal = controller.signal;
    this.analysisRequested = true;
    this.analysisLoading.set(true);
    this.analysisError.set(null);
    try {
      const analysis = await this.research.analyze(this.criteria(), signal);
      if (version === this.version && !signal.aborted)
        this.analysis.set(analysis);
    } catch (e) {
      if (version === this.version && !signal.aborted) {
        this.analysisError.set(this.failure(e));
        this.analysisRequested = false;
      }
    } finally {
      if (version === this.version) this.analysisLoading.set(false);
    }
  }
  async next(): Promise<void> {
    if (this.loading()) return;
    const cursor = this.page()?.nextCursor;
    if (!cursor) return;
    const index = this.pageNumber();
    this.cursors[index] = cursor;
    await this.loadPage(index, cursor);
  }
  async previous(): Promise<void> {
    if (this.loading() || this.pageNumber() <= 1) return;
    const index = this.pageNumber() - 2;
    if (index === 0) {
      await this.search(this.criteria(), this.pageSize());
      return;
    }
    const cursor = this.cursors[index];
    if (cursor) await this.loadPage(index, cursor);
  }
  private async loadPage(index: number, cursor: string): Promise<void> {
    const version = this.version;
    const controller = this.controller;
    if (!controller) return;
    this.loading.set(true);
    this.error.set(null);
    this.page.set(null);
    try {
      const page = await this.research.search(
        this.criteria(),
        cursor,
        controller.signal,
        this.pageSize(),
      );
      if (version !== this.version) return;
      this.session = page.sessionId;
      this.page.set(page);
      this.pageNumber.set(index + 1);
      this.hasPrevious.set(index > 0);
      if (this.analysisVisible) void this.loadAnalysis();
    } catch (e) {
      if (version === this.version && !controller.signal.aborted)
        this.error.set(this.failure(e));
    } finally {
      if (version === this.version) this.loading.set(false);
    }
  }
  ngOnDestroy() {
    this.version++;
    this.controller?.abort();
    this.capabilityController.abort();
    this.close();
  }
}
