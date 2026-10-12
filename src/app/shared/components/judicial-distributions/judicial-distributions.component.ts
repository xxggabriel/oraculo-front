import { Component, computed, input, signal } from "@angular/core";
import { JudicialDistribution } from "../../../core/jurimetry";
import { DistributionPlotComponent } from "../charts/distribution-plot.component";
import { publicationPlainText } from "../publication-content/publication-html";
import { number } from "../../format";

@Component({
  selector: "app-judicial-distributions",
  standalone: true,
  host: { class: "block min-w-0" },
  imports: [DistributionPlotComponent],
  templateUrl: "./judicial-distributions.component.html",
})
export class JudicialDistributionsComponent {
  readonly distribution = input<JudicialDistribution | null>(null);
  readonly population = input(0);
  readonly idPrefix = input("judicial");
  readonly id = (suffix: string) => `${this.idPrefix()}-${suffix}`;
  readonly courtKey = signal<string | null>(null);
  readonly organKey = signal<{ court: string; organ: string } | null>(null);
  readonly showNames = signal(false);
  readonly number = number;
  readonly key = (name: string | null) => JSON.stringify(name);
  readonly label = (name: string | null, missing: string) =>
    name === null
      ? missing
      : publicationPlainText(name).replace(/\s+/g, " ").trim() || missing;
  readonly court = computed(() => {
    const courts = this.distribution()?.courts ?? [];
    return (
      courts.find((court) => this.key(court.name) === this.courtKey()) ??
      courts[0] ??
      null
    );
  });
  readonly organ = computed(() => {
    const court = this.court();
    const chosen = this.organKey();
    return (
      court?.organs.find(
        (organ) =>
          chosen?.court === this.key(court.name) &&
          chosen.organ === this.key(organ.name),
      ) ??
      court?.organs[0] ??
      null
    );
  });
  readonly organBuckets = computed(
    () =>
      this.court()
        ?.organs.filter((organ) => organ.name !== null)
        .map((organ) => ({
          label: this.label(organ.name, "Órgão não informado"),
          count: organ.publications,
        })) ?? [],
  );
  readonly missingOrgan = computed(
    () =>
      this.court()?.organs.find((organ) => organ.name === null)?.publications ??
      0,
  );
  readonly rapporteurBuckets = computed(
    () =>
      this.organ()?.rapporteurs.map((rapporteur) => ({
        label: this.label(rapporteur.name, "Relator não informado"),
        count: rapporteur.publications,
      })) ?? [],
  );
  readonly classBuckets = computed(
    () =>
      this.distribution()?.classes.map((item) => ({
        label: `${this.label(item.names[0]?.name ?? null, "Classe sem nome")} · Código ${item.code}`,
        count: item.publications,
      })) ?? [],
  );
  chooseCourt(event: Event) {
    this.courtKey.set((event.target as HTMLSelectElement).value);
    this.organKey.set(null);
  }
  chooseOrgan(event: Event) {
    const court = this.court();
    this.organKey.set(
      court
        ? {
            court: this.key(court.name),
            organ: (event.target as HTMLSelectElement).value,
          }
        : null,
    );
  }
}
