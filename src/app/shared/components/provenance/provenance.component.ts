import { Component, input } from "@angular/core";
import { Publication, PublicationDetail } from "../../../core/search";
@Component({
  selector: "app-publication-provenance",
  standalone: true,
  host: { class: "block min-w-0" },
  templateUrl: "./provenance.component.html",
})
export class PublicationProvenanceComponent {
  readonly publication = input.required<Publication>();
  readonly source = input.required<PublicationDetail["source"]>();
  readonly warnings = input<readonly string[]>([]);
}
