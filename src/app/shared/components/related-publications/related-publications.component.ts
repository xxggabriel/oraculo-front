import { publicationPlainText } from "../publication-content/publication-html";
import { Component, computed, input, output } from "@angular/core";
import { Params, RouterLink } from "@angular/router";
import {
  RelatedPublication,
  RelatedReason,
} from "../../../core/related-publications";
import { Publication, SearchFailure } from "../../../core/search";
import { civilDate, processNumber } from "../../format";

@Component({
  selector: "app-related-publications",
  standalone: true,
  imports: [RouterLink],
  host: { class: "block min-w-0" },
  templateUrl: "./related-publications.component.html",
})
export class RelatedPublicationsComponent {
  readonly items = input<readonly RelatedPublication[]>([]);
  readonly loading = input(false);
  readonly error = input<SearchFailure | null>(null);
  readonly queryParams = input<Params>({});
  readonly idPrefix = input("related");
  readonly retry = output<void>();
  readonly sectionId = computed(() => `${this.idPrefix()}-publications`);
  readonly headingId = computed(() => `${this.idPrefix()}-title`);
  readonly civilDate = civilDate;
  readonly processNumber = processNumber;
  readonly reasons: Record<RelatedReason, string> = {
    same_process: "Mesmo processo",
    similar_text: "Texto semelhante",
    same_court_type: "Mesmo tribunal e tipo",
  };
  title(publication: Publication) {
    return publication.processes.length
      ? processNumber(publication.processes[0])
      : "Publicação " + publication.id;
  }
  excerpt(publication: Publication) {
    const source =
      publication.snippets[0]?.map((part) => part.text).join("") ?? "";
    const text = publicationPlainText(source).replace(/\s+/g, " ").trim();
    const points = Array.from(text);
    return points.slice(0, 240).join("") + (points.length > 240 ? "…" : "");
  }
}
