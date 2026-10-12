import { Injectable, OnDestroy, inject, signal } from "@angular/core";
import { Research } from "../../../application/research";
import { ReferenceJurimetry } from "../../../application/reference-jurimetry";
import {
  ReferenceMode,
  ReferenceReport,
  ReferenceQuery,
} from "../../../core/jurimetry";
import {
  Criteria,
  Capabilities,
  Distribution,
  SearchFailure,
  initialCriteria,
} from "../../../core/search";

@Injectable()
export class JurimetryFacade implements OnDestroy {
  private readonly research = inject(Research);
  private readonly jurimetry = inject(ReferenceJurimetry);
  readonly criteria = signal<Criteria>(initialCriteria);
  readonly references = signal<ReferenceMode>("either");
  readonly includeProposals = signal(true);
  readonly pageSize = signal(10);
  readonly page = signal(0);
  readonly report = signal<ReferenceReport | null>(null);
  readonly capabilities = signal<Capabilities | null>(null);
  readonly facets = signal<readonly Distribution[]>([]);
  readonly error = signal<SearchFailure | null>(null);
  readonly capabilityError = signal<SearchFailure | null>(null);
  readonly facetError = signal<SearchFailure | null>(null);
  readonly loading = signal(false);
  readonly enabled = signal(false);
  private readonly capabilityController = new AbortController();
  private controller: AbortController | null = null;
  private facetController: AbortController | null = null;
  private version = 0;
  constructor() {
    void this.research
      .capabilities(this.capabilityController.signal)
      .then((value) => this.capabilities.set(value))
      .catch((error) => {
        if (!this.capabilityController.signal.aborted)
          this.capabilityError.set(this.failure(error));
      });
  }
  private failure(error: unknown) {
    return error instanceof SearchFailure
      ? error
      : new SearchFailure(
          "QUERY_ERROR",
          "Não foi possível consultar o recorte. Tente novamente.",
        );
  }
  async load(query: ReferenceQuery, enabled: boolean) {
    this.controller?.abort();
    this.facetController?.abort();
    this.controller = new AbortController();
    this.facetController = new AbortController();
    const signal = this.controller.signal;
    const facetSignal = this.facetController.signal;
    const version = ++this.version;
    this.criteria.set(query.criteria);
    this.references.set(query.references);
    this.includeProposals.set(query.includeProposals);
    this.pageSize.set(query.pageSize);
    this.page.set(query.page);
    this.enabled.set(enabled);
    this.loading.set(enabled);
    this.report.set(null);
    this.error.set(null);
    this.facetError.set(null);
    this.facets.set([]);
    void this.research
      .facets(query.criteria, facetSignal)
      .then((facets) => {
        if (version === this.version && !this.report()) this.facets.set(facets);
      })
      .catch((error) => {
        if (version === this.version && !facetSignal.aborted)
          this.facetError.set(this.failure(error));
      });
    if (!enabled) return;
    try {
      const report = await this.jurimetry.query(query, signal);
      if (version === this.version) {
        this.report.set(report);
        this.facets.set(
          report.distributions.filter(
            (distribution) => distribution.field !== "period",
          ),
        );
      }
    } catch (error) {
      if (version === this.version && !signal.aborted)
        this.error.set(this.failure(error));
    } finally {
      if (version === this.version) this.loading.set(false);
    }
  }
  ngOnDestroy() {
    this.version++;
    this.controller?.abort();
    this.facetController?.abort();
    this.capabilityController.abort();
  }
}
