import { Component, computed, input, output, signal } from "@angular/core";
import { number } from "../../format";
import {
  PlotBucket,
  plotLabel,
  plotMaximum,
  populationShare,
  scaledWidth,
  validCount,
} from "./plot-values";

@Component({
  selector: "app-distribution-plot",
  standalone: true,
  host: { class: "block min-w-0" },
  templateUrl: "./distribution-plot.component.html",
})
export class DistributionPlotComponent {
  readonly title = input.required<string>();
  readonly description = input("");
  readonly buckets = input<readonly PlotBucket[]>([]);
  readonly population = input(0);
  readonly showCoverage = input(true);
  readonly missing = input(0);
  readonly truncated = input(false);
  readonly approximate = input(false);
  readonly other = input(0);
  readonly countError = input(0);
  readonly kind = input<"bars" | "timeline">("bars");
  readonly selectable = input(false);
  readonly bucketSelected = output<string>();
  readonly expanded = signal(false);
  readonly number = number;
  readonly validCount = validCount;
  readonly limit = computed(() => (this.kind() === "timeline" ? 24 : 10));
  readonly orderedBuckets = computed(() => {
    const buckets = [...this.buckets()];
    return this.kind() === "bars"
      ? buckets.sort((a, b) => validCount(b.count) - validCount(a.count))
      : buckets;
  });
  readonly visibleBuckets = computed(() =>
    this.expanded()
      ? this.orderedBuckets()
      : this.orderedBuckets().slice(0, this.limit()),
  );
  readonly maximum = computed(() => plotMaximum(this.orderedBuckets()));
  readonly ticks = computed(() => [this.maximum(), this.maximum() / 2, 0]);
  readonly periodLabels = computed(() => {
    const values = this.visibleBuckets();
    if (!values.length) return [];
    const indices = [
      ...new Set([0, Math.floor((values.length - 1) / 2), values.length - 1]),
    ];
    return indices
      .filter((index) => index >= 0)
      .map((index) => ({
        index,
        label: this.label(values[index]!.label),
      }));
  });

  label(label: string): string {
    return plotLabel(label, this.kind());
  }

  share(count: number): string {
    const percentage = populationShare(count, this.population());
    if (percentage === null) return "—";
    if (percentage > 0 && percentage < 0.1) return "<0,1%";
    return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(percentage)}%`;
  }

  width(count: number): number {
    return scaledWidth(count, this.maximum());
  }

  select(label: string): void {
    if (this.selectable()) this.bucketSelected.emit(label);
  }

  // Columns use equal categorical spacing. No interpolation is made across missing periods.
  columnX(index: number): number {
    return (
      60 + ((index + 0.5) * 560) / Math.max(1, this.visibleBuckets().length)
    );
  }

  columnWidth(): number {
    return Math.max(
      0.5,
      Math.min(34, (560 / Math.max(1, this.visibleBuckets().length)) * 0.62),
    );
  }

  columnHeight(count: number): number {
    return (this.width(count) / 100) * 144;
  }

  tickLabel(count: number): string {
    return new Intl.NumberFormat("pt-BR", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(count);
  }
}
