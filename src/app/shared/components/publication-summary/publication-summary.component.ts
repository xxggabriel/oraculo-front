import { Component, computed, input } from "@angular/core";
import { Params, RouterLink } from "@angular/router";
import { Publication } from "../../../core/search";
import { civilDate, processNumber } from "../../format";
import { PublicationContentComponent } from "../publication-content/publication-content.component";
import { snippetContent } from "../publication-content/content-decorations";
@Component({
  selector: "app-publication-summary",
  standalone: true,
  host: { class: "block" },
  imports: [RouterLink, PublicationContentComponent],
  templateUrl: "./publication-summary.component.html",
})
export class PublicationSummaryComponent {
  readonly publication = input.required<Publication>();
  readonly queryParams = input<Params>({});
  readonly snippets = computed(() =>
    this.publication().snippets.map(snippetContent),
  );
  readonly civilDate = civilDate;
  readonly processNumber = processNumber;
}
