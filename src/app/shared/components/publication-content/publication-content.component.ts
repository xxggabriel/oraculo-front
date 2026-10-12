import { Component, computed, input, output } from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";
import { ReferenceLinkComponent } from "../reference-preview/reference-link.component";
import {
  ReferenceNavigation,
  referenceAnchor,
} from "../publication-text/reference-segments";
import {
  ContentDecoration,
  decoratePublicationContent,
} from "./content-decorations";

@Component({
  selector: "app-publication-content",
  standalone: true,
  imports: [NgTemplateOutlet, ReferenceLinkComponent],
  host: { class: "publication-content block min-w-0 [overflow-wrap:anywhere]" },
  templateUrl: "./publication-content.component.html",
})
export class PublicationContentComponent {
  readonly text = input.required<string>();
  readonly decorations = input<readonly ContentDecoration[]>([]);
  readonly baseHref = input("");
  readonly anchorNamespace = input("publication");
  readonly anchorActivated = output<ReferenceNavigation>();
  readonly nodes = computed(() =>
    decoratePublicationContent(this.text(), this.decorations()),
  );
  readonly referenceAnchor = (
    reference: Parameters<typeof referenceAnchor>[0],
  ) => referenceAnchor(reference, this.anchorNamespace());
  readonly encodeFragment = encodeURIComponent;
  listStyle(type?: "1" | "a" | "A" | "i" | "I"): string {
    return {
      "1": "decimal",
      a: "lower-alpha",
      A: "upper-alpha",
      i: "lower-roman",
      I: "upper-roman",
    }[type ?? "1"];
  }
}
