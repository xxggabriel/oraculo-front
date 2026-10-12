import { Component, computed, input, signal } from "@angular/core";
import { Params, RouterLink } from "@angular/router";
import { Publication } from "../../../core/search";
import { civilDate, processNumber } from "../../../shared/format";
import { PublicationContentComponent } from "../../../shared/components/publication-content/publication-content.component";
import { snippetContent } from "../../../shared/components/publication-content/content-decorations";

@Component({
  selector: "app-jurisprudence-result",
  standalone: true,
  host: { class: "block" },
  imports: [RouterLink, PublicationContentComponent],
  templateUrl: "./jurisprudence-result.component.html",
})
export class JurisprudenceResultComponent {
  readonly publication = input.required<Publication>();
  readonly queryParams = input<Params>({});
  readonly expanded = signal(false);
  readonly preview = computed(() =>
    snippetContent(
      this.publication().jurisprudence?.preview ??
        this.publication().snippets[0] ??
        [],
    ),
  );
  readonly matches = computed(() => {
    const p = this.publication().jurisprudence;
    if (!p || (p.textKind === "ementa" && p.ementaHighlights.length)) return [];
    return p.publicationHighlights
      .map(snippetContent)
      .filter(
        (match) =>
          p.textKind === "ementa" || !this.preview().text.includes(match.text),
      );
  });
  readonly ementaMatches = computed(() =>
    (this.publication().jurisprudence?.ementaHighlights ?? [])
      .map(snippetContent)
      .filter((match) => !this.preview().text.includes(match.text)),
  );
  readonly date = computed(() => {
    const p = this.publication();
    return p.publicationDate
      ? `Publicado em ${civilDate(p.publicationDate)}`
      : p.availabilityDate
        ? `Disponibilizado em ${civilDate(p.availabilityDate)} · Publicação sem data informada`
        : "Data de publicação não informada";
  });
  readonly processNumber = processNumber;
}
