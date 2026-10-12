import { Component, computed, input, output } from "@angular/core";
import { Reference } from "../../../core/search";
import { HoverCardComponent } from "../hover-card/hover-card.component";
import { ReferencePreviewComponent } from "./reference-preview.component";
import {
  ReferenceNavigation,
  referenceLabel,
} from "../publication-text/reference-segments";

@Component({
  selector: "app-reference-link",
  standalone: true,
  imports: [HoverCardComponent, ReferencePreviewComponent],
  host: { class: "inline" },
  template: `
    <app-hover-card
      #hover
      [cardId]="previewId()"
      [label]="referenceLabel(reference())"
    >
      <a
        hoverCardTrigger
        [href]="href()"
        [attr.aria-label]="referenceLabel(reference())"
        [attr.aria-describedby]="hover.open() ? previewId() : null"
        class="text-brand-700 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700 focus-visible:outline-2 focus-visible:outline-brand-600"
        [class.ml-1]="additional()"
        [class.text-xs]="additional()"
        (click)="activate($event)"
        >{{ text() }}</a
      >
      <app-reference-preview
        hoverCardContent
        [reference]="reference()"
        [context]="context()"
        [contextIsPlain]="contextIsPlain()"
      />
    </app-hover-card>
  `,
})
export class ReferenceLinkComponent {
  readonly reference = input.required<Reference>();
  readonly text = input.required<string>();
  readonly href = input.required<string>();
  readonly anchor = input.required<string>();
  readonly sourceAnchor = input.required<string>();
  readonly context = input("");
  readonly contextIsPlain = input(false);
  readonly additional = input(false);
  readonly anchorActivated = output<ReferenceNavigation>();
  readonly referenceLabel = referenceLabel;
  readonly previewId = computed(
    () => `${this.sourceAnchor()}-${this.anchor()}-preview`,
  );
  activate(event: MouseEvent) {
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    )
      return;
    event.preventDefault();
    this.anchorActivated.emit({
      anchor: this.anchor(),
      sourceAnchor: this.sourceAnchor(),
    });
  }
}
