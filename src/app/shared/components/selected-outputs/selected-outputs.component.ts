import { Component, computed, input, linkedSignal } from "@angular/core";
import { LoadingSkeletonComponent } from "../loading-skeleton/loading-skeleton.component";
import { Output, Publication } from "../../../core/search";
import { reviewLabels } from "../../format";
import { EvidenceListComponent } from "../evidence/evidence-list.component";
@Component({
  selector: "app-selected-outputs",
  standalone: true,
  imports: [EvidenceListComponent, LoadingSkeletonComponent],
  host: { class: "block min-w-0" },
  templateUrl: "./selected-outputs.component.html",
})
export class SelectedOutputsComponent {
  readonly outputs = input.required<readonly Output[]>();
  readonly loading = input(false);
  readonly identity = input<Pick<
    Publication,
    "id" | "revision" | "textVersion"
  > | null>(null);
  private readonly visibleCount = linkedSignal(() => {
    this.outputs();
    this.identity();
    return 5;
  });
  readonly visibleOutputs = computed(() =>
    this.outputs().slice(0, this.visibleCount()),
  );
  readonly remainingCount = computed(
    () => this.outputs().length - this.visibleOutputs().length,
  );
  readonly nextCount = computed(() => Math.min(10, this.remainingCount()));
  showMore() {
    this.visibleCount.update((count) => count + 10);
  }
  readonly reviewLabels = reviewLabels;
}
