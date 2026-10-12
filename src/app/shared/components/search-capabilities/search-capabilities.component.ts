import { Component, input, signal } from "@angular/core";
import { Capabilities, Capability, SearchFailure } from "../../../core/search";
import { featureLabels } from "../../../shared/format";
@Component({
  selector: "app-search-capabilities",
  standalone: true,
  host: { class: "block" },
  templateUrl: "./search-capabilities.component.html",
})
export class SearchCapabilitiesComponent {
  readonly capabilities = input<Capabilities | null>(null);
  readonly error = input<SearchFailure | null>(null);
  readonly expanded = signal(false);
  readonly featureLabels = featureLabels;
  reasonLabel(feature: Capability): string | null {
    if (
      ["partyNameFilter", "attorneyNameFilter", "oabFilter"].includes(
        feature.name,
      )
    )
      return feature.available ? null : "Ainda não disponível neste acervo.";
    return feature.reason;
  }
}
