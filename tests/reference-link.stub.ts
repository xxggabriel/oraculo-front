import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Reference } from "../src/app/core/search";
import {
  ReferenceNavigation,
  referenceLabel,
} from "../src/app/shared/components/publication-text/reference-segments";

// Vitest transpiles decorators without Angular's signal-input metadata. Isolate
// the child's input/output contract here; compiled integration runs in E2E.
@Component({
  selector: "app-reference-link",
  standalone: true,
  template: `<a [href]="href" [attr.aria-label]="label(reference)">{{
    text
  }}</a>`,
})
export class ReferenceLinkStub {
  @Input() reference!: Reference;
  @Input() text = "";
  @Input() href = "";
  @Input() anchor = "";
  @Input() sourceAnchor = "";
  @Input() context = "";
  @Input() contextIsPlain = false;
  @Input() additional = false;
  @Output() anchorActivated = new EventEmitter<ReferenceNavigation>();
  readonly label = referenceLabel;
}
