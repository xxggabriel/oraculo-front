import { Component, input, output } from "@angular/core";
import { SearchFailure } from "../../../core/search";
@Component({
  selector: "app-search-error",
  standalone: true,
  host: { class: "block" },
  templateUrl: "./search-error.component.html",
})
export class SearchErrorComponent {
  readonly error = input<SearchFailure | null>(null);
  readonly retry = output<void>();
}
