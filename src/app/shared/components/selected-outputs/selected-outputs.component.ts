import { Component, input } from "@angular/core";
import { Output } from "../../../core/search";
import { reviewLabels } from "../../format";
import { EvidenceListComponent } from "../evidence/evidence-list.component";
@Component({
  selector: "app-selected-outputs",
  standalone: true,
  imports: [EvidenceListComponent],
  host: { class: "block min-w-0" },
  templateUrl: "./selected-outputs.component.html",
})
export class SelectedOutputsComponent {
  readonly outputs = input.required<readonly Output[]>();
  readonly reviewLabels = reviewLabels;
}
