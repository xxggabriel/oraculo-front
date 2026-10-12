import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ContentDecoration } from "../src/app/shared/components/publication-content/content-decorations";
import { ReferenceNavigation } from "../src/app/shared/components/publication-text/reference-segments";
@Component({
  selector: "app-publication-content",
  standalone: true,
  template: "{{ text }}",
})
export class PublicationContentStub {
  @Input() text = "";
  @Input() decorations: readonly ContentDecoration[] = [];
  @Input() baseHref = "";
  @Input() anchorNamespace = "publication";
  @Output() anchorActivated = new EventEmitter<ReferenceNavigation>();
}
