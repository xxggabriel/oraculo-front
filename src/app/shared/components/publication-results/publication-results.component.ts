import { Component, input, output } from "@angular/core";
import { Params } from "@angular/router";
import {
  Distribution,
  SearchFailure,
  SearchPage,
  Sort,
} from "../../../core/search";
import { fieldLabels, number } from "../../../shared/format";
import { PublicationSummaryComponent } from "../../../shared/components/publication-summary/publication-summary.component";
@Component({
  selector: "app-publication-results",
  standalone: true,
  host: { class: "block" },
  imports: [PublicationSummaryComponent],
  templateUrl: "./publication-results.component.html",
})
export class PublicationResultsComponent {
  readonly page = input<SearchPage | null>(null);
  readonly loading = input(false);
  readonly pageNumber = input(1);
  readonly pageSize = input(10);
  readonly hasPrevious = input(false);
  readonly sort = input<Sort>("relevance");
  readonly queryParams = input<Params>({});
  readonly facets = input<readonly Distribution[]>([]);
  readonly facetError = input<SearchFailure | null>(null);
  readonly snapshotKind = input<"pit" | "query" | "report">("pit");
  readonly next = output<void>();
  readonly previous = output<void>();
  readonly pageSizeChange = output<number>();
  readonly sortChange = output<Sort>();
  readonly number = number;
  readonly fieldLabels = fieldLabels;
  changeSize(event: Event) {
    this.pageSizeChange.emit(Number((event.target as HTMLSelectElement).value));
  }
  changeSort(event: Event) {
    this.sortChange.emit(
      (event.target as HTMLSelectElement).value === "date_desc"
        ? "date_desc"
        : "relevance",
    );
  }
}
