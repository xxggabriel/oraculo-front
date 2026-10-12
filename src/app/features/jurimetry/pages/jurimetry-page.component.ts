import { publicationPlainText } from "../../../shared/components/publication-content/publication-html";
import { Component, OnDestroy, computed, inject, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { DOCUMENT } from "@angular/common";
import { Subscription } from "rxjs";
import { Criteria, SearchPage, Sort } from "../../../core/search";
import {
  ReferenceMode,
  ReferenceQuery,
  ReferenceReport,
} from "../../../core/jurimetry";
import { JurimetryFacade } from "../state/jurimetry.facade";
import {
  criteriaFromParams,
  criteriaToParams,
} from "../../../shared/criteria-url";
import { SearchQueryComponent } from "../../../shared/components/search-query/search-query.component";
import { SearchErrorComponent } from "../../../shared/components/search-error/search-error.component";
import { SearchCapabilitiesComponent } from "../../../shared/components/search-capabilities/search-capabilities.component";
import { PublicationResultsComponent } from "../../../shared/components/publication-results/publication-results.component";
import { FilterPanelComponent } from "../../../shared/components/filters/filter-panel.component";
import { FilterChipsComponent } from "../../../shared/components/filters/filter-chips.component";
import {
  FilterChip,
  FilterSelection,
  emptyFilters,
  filterChips,
  removeFilter,
} from "../../../shared/components/filters/filter-state";
import { DistributionPlotComponent } from "../../../shared/components/charts/distribution-plot.component";
import { axisLabels, number } from "../../../shared/format";
import { JudicialDistributionsComponent } from "../../../shared/components/judicial-distributions/judicial-distributions.component";

@Component({
  selector: "app-jurimetry-page",
  standalone: true,
  host: { class: "block" },
  imports: [
    SearchQueryComponent,
    SearchErrorComponent,
    SearchCapabilitiesComponent,
    PublicationResultsComponent,
    FilterPanelComponent,
    FilterChipsComponent,
    DistributionPlotComponent,
    JudicialDistributionsComponent,
  ],
  providers: [JurimetryFacade],
  templateUrl: "./jurimetry-page.component.html",
})
export class JurimetryPageComponent implements OnDestroy {
  readonly vm = inject(JurimetryFacade);
  readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly subscription: Subscription;
  readonly draftReferences = signal<ReferenceMode>("either");
  readonly draftIncludeProposals = signal(true);
  readonly number = number;
  readonly axisLabels = axisLabels;
  readonly appliedFilters = computed(() => filterChips(this.vm.criteria()));
  readonly pendingReferences = computed(
    () =>
      this.draftReferences() !== this.vm.references() ||
      this.draftIncludeProposals() !== this.vm.includeProposals(),
  );
  readonly queryParams = () => ({
    ...this.route.snapshot.queryParams,
    returnTo: "jurimetria",
  });
  readonly modes: readonly { value: ReferenceMode; label: string }[] = [
    { value: "either", label: "Jurisprudenciais ou normativas" },
    { value: "both", label: "Jurisprudenciais e normativas" },
    { value: "jurisprudential", label: "Com jurisprudenciais" },
    { value: "normative", label: "Com normativas" },
    { value: "any", label: "Sem condição de referências" },
  ];
  readonly presenceBuckets = computed(() => {
    const presence = this.vm.report()?.presence;
    return presence
      ? [
          {
            label: "Somente jurisprudenciais",
            count: presence.jurisprudentialOnly,
          },
          { label: "Somente normativas", count: presence.normativeOnly },
          { label: "Ambas as famílias", count: presence.both },
          { label: "Sem referências admissíveis", count: presence.neither },
        ]
      : [];
  });
  readonly plotDistributions = computed(
    () =>
      this.vm.report()?.distributions.map((distribution) => ({
        ...distribution,
        buckets:
          distribution.field === "period"
            ? distribution.buckets.map((bucket) => ({
                ...bucket,
                label: bucket.label.slice(0, 7),
              }))
            : distribution.buckets,
      })) ?? [],
  );
  readonly frequentBuckets = computed(
    () =>
      this.vm.report()?.topReferences.map((reference) => ({
        label: this.referenceLabel(reference),
        count: reference.publications,
      })) ?? [],
  );
  readonly listPage = computed<SearchPage | null>(() => {
    const report = this.vm.report();
    return report
      ? {
          publications: report.publications,
          total: report.population,
          totalRelation: "eq",
          nextCursor: report.hasMore ? "available" : null,
          sessionId: null,
          expiresAt: null,
          duration: 0,
          strategy: "publicações com referências selecionadas",
          consistency: report.consistency,
          warnings: [],
        }
      : null;
  });
  readonly coverage = computed(() => {
    const report = this.vm.report();
    return !report?.totalCandidates
      ? "—"
      : new Intl.NumberFormat("pt-BR", {
          style: "percent",
          maximumFractionDigits: 1,
        }).format(report.population / report.totalCandidates);
  });
  constructor() {
    this.subscription = this.route.queryParamMap.subscribe((params) => {
      const references =
        this.modes.find((mode) => mode.value === params.get("references"))
          ?.value ?? "either";
      const includeProposals = params.get("unvalidated") !== "false";
      const size = Number(params.get("size"));
      const requestedPage = Number(params.get("page") ?? 0);
      this.draftReferences.set(references);
      this.draftIncludeProposals.set(includeProposals);
      const enabled =
        params.get("run") === "1" ||
        Boolean(
          params.get("q") ||
          params.get("from") ||
          params.get("courts") ||
          params.get("types") ||
          params.get("process"),
        );
      const query: ReferenceQuery = {
        criteria: criteriaFromParams(params),
        references,
        includeProposals,
        pageSize: [2, 10, 25, 50].includes(size) ? size : 10,
        page:
          Number.isSafeInteger(requestedPage) &&
          requestedPage >= 0 &&
          requestedPage <= 10000000
            ? requestedPage
            : 0,
      };
      void this.vm.load(query, enabled).then(() => {
        const report = this.vm.report();
        if (
          report &&
          this.vm.criteria() === query.criteria &&
          query.page > 0 &&
          query.page * query.pageSize >= report.population
        ) {
          void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { page: null },
            queryParamsHandling: "merge",
            replaceUrl: true,
          });
        }
      });
    });
  }
  referenceText(surface: string): string {
    const visible = publicationPlainText(surface).replace(/\s+/g, " ").trim();
    const points = Array.from(visible || "Nome não informado");
    return points.slice(0, 180).join("") + (points.length > 180 ? "…" : "");
  }
  referenceLabel(
    reference: Pick<
      ReferenceReport["topReferences"][number],
      "family" | "surface"
    >,
  ): string {
    const prefix =
      reference.family === "citation" ? "Jurisprudência" : "Normativa";
    return `${prefix}: ${this.referenceText(reference.surface)}`;
  }
  modeLabel(mode: ReferenceMode) {
    return this.modes.find((option) => option.value === mode)?.label ?? mode;
  }
  selectReferences(event: Event) {
    const mode = (event.target as HTMLSelectElement).value;
    this.draftReferences.set(
      this.modes.find((option) => option.value === mode)?.value ?? "either",
    );
  }
  toggleUnvalidated(event: Event) {
    this.draftIncludeProposals.set((event.target as HTMLInputElement).checked);
  }
  available() {
    const features = this.vm.capabilities()?.features;
    if (!features) return true;
    return [
      "citations",
      "normativeReferences",
      "courtFilter",
      "documentTypeFilter",
      this.vm.criteria().dateAxis + "Date",
    ].every(
      (name) =>
        features.find((feature) => feature.name === name)?.available === true,
    );
  }
  search(query: Pick<Criteria, "q" | "mode">) {
    this.navigate({ ...this.vm.criteria(), ...query });
  }
  consult() {
    this.navigate(this.vm.criteria());
  }
  applyFilters(filters: FilterSelection) {
    this.navigate({ ...this.vm.criteria(), ...filters });
  }
  clearFilters() {
    this.draftReferences.set("either");
    this.draftIncludeProposals.set(true);
    this.applyFilters(emptyFilters());
  }
  removeFilter(chip: FilterChip) {
    this.navigate(
      { ...this.vm.criteria(), ...removeFilter(this.vm.criteria(), chip) },
      0,
      this.vm.pageSize(),
      true,
    );
  }
  selectBucket(field: "court" | "documentType", label: string) {
    this.navigate(
      {
        ...this.vm.criteria(),
        ...(field === "court"
          ? { courts: [label] }
          : { documentTypes: [label] }),
      },
      0,
      this.vm.pageSize(),
      true,
    );
  }
  next() {
    if (this.vm.report()?.hasMore && !this.vm.loading())
      this.navigate(
        this.vm.criteria(),
        this.vm.page() + 1,
        this.vm.pageSize(),
        true,
      );
  }
  previous() {
    if (this.vm.page() > 0 && !this.vm.loading())
      this.navigate(
        this.vm.criteria(),
        this.vm.page() - 1,
        this.vm.pageSize(),
        true,
      );
  }
  changeSize(size: number) {
    this.navigate(this.vm.criteria(), 0, size, true);
  }
  changeSort(sort: Sort) {
    this.navigate({ ...this.vm.criteria(), sort }, 0, this.vm.pageSize(), true);
  }
  retry() {
    void this.vm.load(
      {
        criteria: this.vm.criteria(),
        references: this.vm.references(),
        includeProposals: this.vm.includeProposals(),
        page: this.vm.page(),
        pageSize: this.vm.pageSize(),
      },
      true,
    );
  }
  async showPublications() {
    await this.router.navigate([], {
      relativeTo: this.route,
      fragment: "jurimetry-publications",
      queryParamsHandling: "preserve",
      replaceUrl: true,
    });
    const publications = this.document.getElementById("jurimetry-publications");
    publications?.focus({ preventScroll: true });
    publications?.scrollIntoView({ block: "start" });
  }
  private navigate(
    criteria: Criteria,
    page = 0,
    pageSize = this.vm.pageSize(),
    appliedReferences = false,
  ) {
    const references = appliedReferences
      ? this.vm.references()
      : this.draftReferences();
    const includeProposals = appliedReferences
      ? this.vm.includeProposals()
      : this.draftIncludeProposals();
    const queryParams = {
      ...criteriaToParams(criteria, pageSize),
      run: "1",
      references,
      unvalidated: includeProposals ? null : "false",
      page: page || null,
    };
    const url = this.router.createUrlTree(["/jurimetria"], { queryParams });
    const operation =
      this.router.serializeUrl(url) === this.router.url
        ? this.vm.load(
            { criteria, references, includeProposals, page, pageSize },
            true,
          )
        : this.router.navigateByUrl(url);
    void operation.then(() =>
      setTimeout(
        () =>
          this.document
            .getElementById("jurimetry-results")
            ?.focus({ preventScroll: true }),
        0,
      ),
    );
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
