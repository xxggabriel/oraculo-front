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
  readonly dateLabel = computed(() => {
    const p = this.publication();
    if (p.publicationDate)
      return `Publicado em ${civilDate(p.publicationDate)}`;
    if (p.availabilityDate)
      return `Disponibilizado em ${civilDate(p.availabilityDate)} · Data de publicação não informada`;
    return "Data de publicação não informada";
  });
  readonly civilDate = civilDate;
  readonly processNumber = processNumber;
}
