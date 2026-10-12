import { Component, input } from "@angular/core";
import { Analysis, Capabilities, SearchFailure } from "../../../core/search";
import { axisLabels, number } from "../../../shared/format";
import { DistributionTableComponent } from "../../../shared/components/distributions/distribution-table.component";
@Component({
  selector: "app-search-analysis",
  standalone: true,
  host: { class: "block" },
  imports: [DistributionTableComponent],
  templateUrl: "./search-analysis.component.html",
})
export class SearchAnalysisComponent {
  readonly analysis = input<Analysis | null>(null);
  readonly loading = input(false);
  readonly error = input<SearchFailure | null>(null);
  readonly capabilities = input<Capabilities | null>(null);
  readonly number = number;
  readonly axisLabels = axisLabels;
}
