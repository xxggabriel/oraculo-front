import {
  criteriaFromParams,
  criteriaToParams,
} from "../../../shared/criteria-url";

import { Component, OnDestroy, computed, inject, signal } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { Criteria, Sort } from "../../../core/search";
import { SearchFacade } from "../../search/state/search.facade";
import { SearchQueryComponent } from "../../../shared/components/search-query/search-query.component";
import { SearchErrorComponent } from "../../../shared/components/search-error/search-error.component";
import { JurisprudenceResultComponent } from "../components/jurisprudence-result.component";
import { number } from "../../../shared/format";

import { SearchCapabilitiesComponent } from "../../../shared/components/search-capabilities/search-capabilities.component";
import { FilterPanelComponent } from "../../../shared/components/filters/filter-panel.component";
import { FilterChipsComponent } from "../../../shared/components/filters/filter-chips.component";
import {
  FilterChip,
  FilterSelection,
  emptyFilters,
  filterChips,
  removeFilter,
} from "../../../shared/components/filters/filter-state";

@Component({
  selector: "app-jurisprudence-page",
  standalone: true,
  host: { class: "block" },
  imports: [
    SearchQueryComponent,
    JurisprudenceResultComponent,
    SearchErrorComponent,

    SearchCapabilitiesComponent,
    FilterPanelComponent,
    FilterChipsComponent,
  ],
  providers: [SearchFacade],
  templateUrl: "./jurisprudence-page.component.html",
})
export class JurisprudencePageComponent implements OnDestroy {
  readonly vm = inject(SearchFacade);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  readonly route = inject(ActivatedRoute);
  readonly number = number;
  readonly copied = signal(false);
  readonly copyError = signal(false);
  readonly resultParams = computed(() => ({
    ...criteriaToParams(this.vm.criteria(), this.vm.pageSize()),
    returnTo: "jurisprudencia",
  }));
  readonly appliedFilters = computed(() => filterChips(this.vm.criteria()));
  private readonly subscription: Subscription;
  constructor() {
    this.subscription = this.route.queryParamMap.subscribe((params) => {
      const size = Number(params.get("size"));
      void this.vm.search(
        {
          ...criteriaFromParams(params),
          collection: "jurisprudence",
          ranking:
            params.get("sort") === "date_desc" ||
            params.get("ranking") === "bm25"
              ? "bm25"
              : "rerank",
        },
        [2, 10, 25, 50].includes(size) ? size : 10,
      );
    });
  }
  changeRanking(event: Event) {
    this.navigate({
      ...this.vm.criteria(),
      ranking:
        (event.target as HTMLSelectElement).value === "bm25"
          ? "bm25"
          : "rerank",
      sort: "relevance",
    });
  }
  changeRankingToLexical() {
    this.navigate({
      ...this.vm.criteria(),
      ranking: "bm25",
      sort: "relevance",
    });
  }
  changeSortEvent(event: Event) {
    this.changeSort(
      (event.target as HTMLSelectElement).value === "date_desc"
        ? "date_desc"
        : "relevance",
    );
  }
  changeSizeEvent(event: Event) {
    const size = Number((event.target as HTMLSelectElement).value);
    if ([2, 10, 25, 50].includes(size)) this.changeSize(size);
  }
  async copySearch() {
    try {
      const clipboard = this.document.defaultView?.navigator.clipboard;
      if (!clipboard) throw new Error("Clipboard unavailable");
      await clipboard.writeText(this.document.location.href);
      this.copied.set(true);
      this.copyError.set(false);
    } catch {
      this.copyError.set(true);
    }
  }
  search(query: Pick<Criteria, "q" | "mode">) {
    this.navigate({ ...this.vm.criteria(), ...query });
  }
  applyFilters(filters: FilterSelection) {
    this.navigate(
      { ...this.vm.criteria(), ...filters },
      this.vm.pageSize(),
      true,
    );
  }
  clearFilters() {
    this.applyFilters(emptyFilters());
  }
  removeFilter(chip: FilterChip) {
    this.applyFilters(removeFilter(this.vm.criteria(), chip));
  }
  changeSize(size: number) {
    this.navigate(this.vm.criteria(), size);
  }
  changeSort(sort: Sort) {
    this.navigate({
      ...this.vm.criteria(),
      sort,
      ranking: sort === "date_desc" ? "bm25" : this.vm.criteria().ranking,
    });
  }
  retry() {
    void this.vm.search(this.vm.criteria(), this.vm.pageSize());
  }
  private navigate(c: Criteria, size = this.vm.pageSize(), focus = false) {
    this.copied.set(false);
    this.copyError.set(false);
    const queryParams = { ...criteriaToParams(c, size), collection: null };
    const url = this.router.createUrlTree(["/jurisprudencia"], { queryParams });
    const navigation =
      this.router.serializeUrl(url) === this.router.url
        ? this.vm.search(c, size)
        : this.router.navigateByUrl(url);
    void navigation.then(() => {
      if (focus)
        setTimeout(() => {
          const results = this.document.getElementById("results-plane");
          results?.focus({ preventScroll: true });
          results?.scrollIntoView({ block: "start" });
        }, 0);
    });
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
