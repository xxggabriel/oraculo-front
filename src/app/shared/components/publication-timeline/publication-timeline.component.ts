import { LoadingSkeletonComponent } from "../loading-skeleton/loading-skeleton.component";
import { Component, input, output } from "@angular/core";
import { Params, RouterLink } from "@angular/router";
import {
  PublicationTimeline,
  TimelinePublication,
} from "../../../core/publication-timeline";
import { SearchFailure } from "../../../core/search";
import { civilDate, number, processNumber } from "../../format";
@Component({
  selector: "app-publication-timeline",
  standalone: true,
  imports: [RouterLink, LoadingSkeletonComponent],
  host: { class: "block min-w-0" },
  templateUrl: "./publication-timeline.component.html",
})
export class PublicationTimelineComponent {
  readonly report = input<PublicationTimeline | null>(null);
  readonly publications = input<readonly TimelinePublication[]>([]);
  readonly currentPublication = input.required<string>();
  readonly selectedProcess = input<string | null>(null);
  readonly loading = input(false);
  readonly hasMore = input(false);
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
  poleLabel(pole: string | null) {
    if (!pole?.trim()) return "Polo não informado";
    const value = pole.trim().toUpperCase();
    switch (value) {
      case "A":
      case "ATIVO":
        return "Polo ativo";
      case "P":
      case "PASSIVO":
        return "Polo passivo";
      default:
        return `Polo informado: ${pole}`;
    }
  }
  select(event: Event) {
    this.selectProcess.emit((event.target as HTMLSelectElement).value);
  }
}
