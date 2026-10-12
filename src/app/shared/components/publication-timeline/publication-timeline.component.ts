import { publicationPlainText } from "../publication-content/publication-html";
import { Component, input, output } from "@angular/core";
import { Params, RouterLink } from "@angular/router";
import { PublicationTimeline } from "../../../core/publication-timeline";
import { Publication, SearchFailure } from "../../../core/search";
import { civilDate, number, processNumber } from "../../format";
@Component({
  selector: "app-publication-timeline",
  standalone: true,
  imports: [RouterLink],
  host: { class: "block min-w-0" },
  templateUrl: "./publication-timeline.component.html",
})
export class PublicationTimelineComponent {
  readonly report = input<PublicationTimeline | null>(null);
  readonly publications = input<readonly Publication[]>([]);
  readonly currentPublication = input.required<string>();
  readonly selectedProcess = input<string | null>(null);
  readonly loading = input(false);
  readonly error = input<SearchFailure | null>(null);
  readonly queryParams = input<Params>({});
  readonly idPrefix = input("timeline");
  readonly selectProcess = output<string>();
  readonly loadMore = output<void>();
  readonly retry = output<void>();
  readonly civilDate = civilDate;
  readonly processNumber = processNumber;
  readonly number = number;
  sectionId() {
    return `${this.idPrefix()}-publications`;
  }
  itemId(id: string) {
    return `${this.idPrefix()}-item-${encodeURIComponent(id)}`;
  }
  excerpt(publication: Publication) {
    const source =
      publication.snippets[0]?.map((part) => part.text).join("") ?? "";
    const text = publicationPlainText(source).replace(/\s+/g, " ").trim();
    const points = Array.from(text);
    return points.slice(0, 240).join("") + (points.length > 240 ? "…" : "");
  }
  select(event: Event) {
    this.selectProcess.emit((event.target as HTMLSelectElement).value);
  }
}
