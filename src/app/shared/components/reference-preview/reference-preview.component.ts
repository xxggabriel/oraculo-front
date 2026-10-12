import { publicationPlainText } from "../publication-content/publication-html";
import { Component, input } from "@angular/core";
import { Reference } from "../../../core/search";
import { reviewLabels } from "../../format";

@Component({
  selector: "app-reference-preview",
  standalone: true,
  host: { class: "block whitespace-normal" },
  template: `
    <span
      class="block text-[11px] font-semibold uppercase tracking-wide text-brand-700"
    >
      {{
        reference().family === "citation"
          ? "Referência jurisprudencial"
          : "Referência normativa"
      }}
    </span>
    <span class="mt-2 block text-base font-semibold leading-6">{{
      title()
    }}</span>
    @if (reference().attributedEntity; as entity) {
      <span class="mt-1 block text-xs text-muted">{{ entity }}</span>
    }
    @if (visibleContext()) {
      <span class="mt-3 block border-t border-line pt-3">
        <span class="block text-[11px] font-medium text-muted"
          >Trecho da publicação</span
        >
        <span class="mt-1 block text-sm leading-6">{{ visibleContext() }}</span>
      </span>
    }
    <span class="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
      <span>{{
        reviewLabels[reference().reviewStatus] ?? reference().reviewStatus
      }}</span>
      @if (reference().resolutionStatus === "unresolved") {
        <span>Identificação não resolvida</span>
      } @else if (reference().resolutionStatus === "ambiguous") {
        <span>Identificação ambígua</span>
      }
    </span>
    <span class="mt-3 block text-xs font-medium text-brand-700"
      >Clique no link para ver detalhes e evidências.</span
    >
  `,
})
export class ReferencePreviewComponent {
  readonly reference = input.required<Reference>();
  readonly context = input("");
  readonly contextIsPlain = input(false);
  readonly reviewLabels = reviewLabels;
  visibleContext() {
    const points = Array.from(
      (this.contextIsPlain()
        ? this.context()
        : publicationPlainText(this.context())
      )
        .replace(/\s+/g, " ")
        .trim(),
    );
    return points.slice(0, 380).join("") + (points.length > 380 ? "…" : "");
  }
  title() {
    const title = publicationPlainText(this.reference().surface)
      .replace(/\s+/g, " ")
      .trim();
    const points = Array.from(title || this.reference().key);
    return points.length > 220
      ? points.slice(0, 220).join("") + "…"
      : points.join("");
  }
}
