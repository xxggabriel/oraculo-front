import {
  criteriaFromParams,
  criteriaToParams,
} from "../../../shared/criteria-url";
export { criteriaFromParams } from "../../../shared/criteria-url";
import { Component, OnDestroy, computed, inject, signal } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { Criteria, Sort } from "../../../core/search";
import { SearchFacade } from "../state/search.facade";
import { SearchQueryComponent } from "../../../shared/components/search-query/search-query.component";
import { SearchErrorComponent } from "../../../shared/components/search-error/search-error.component";
import { PublicationResultsComponent } from "../../../shared/components/publication-results/publication-results.component";
import { SearchAnalysisComponent } from "../components/search-analysis.component";
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
  selector: "app-search-page",
  standalone: true,
  host: { class: "block" },
  imports: [
    SearchQueryComponent,
    PublicationResultsComponent,
    SearchErrorComponent,
    SearchAnalysisComponent,
    SearchCapabilitiesComponent,
    FilterPanelComponent,
    FilterChipsComponent,
  ],
  providers: [SearchFacade],
  templateUrl: "./search-page.component.html",
})
export class SearchPageComponent implements OnDestroy {
  readonly vm = inject(SearchFacade);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  readonly route = inject(ActivatedRoute);
  readonly activeTab = signal<"publications" | "analysis">("publications");
  readonly appliedFilters = computed(() => filterChips(this.vm.criteria()));
  private readonly subscription: Subscription;
  constructor() {
    this.subscription = this.route.queryParamMap.subscribe((params) => {
      const size = Number(params.get("size"));
      void this.vm.search(
        criteriaFromParams(params),
        [2, 10, 25, 50].includes(size) ? size : 10,
      );
    });
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
    this.navigate({ ...this.vm.criteria(), sort });
  }
  retry() {
    void this.vm.search(this.vm.criteria(), this.vm.pageSize());
  }
  private navigate(c: Criteria, size = this.vm.pageSize(), focus = false) {
    const queryParams = criteriaToParams(c, size);
    const url = this.router.createUrlTree(["/"], { queryParams });
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
