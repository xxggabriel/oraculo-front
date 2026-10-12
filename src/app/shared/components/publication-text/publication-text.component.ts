import { Component, computed, input, output } from "@angular/core";
import { Reference } from "../../../core/search";
import { PublicationContentComponent } from "../publication-content/publication-content.component";
import { referenceExcerpt } from "../references/reference-presentation";
import { visibleReferenceParts } from "../publication-content/content-decorations";
import {
  TextIdentity,
  ReferenceNavigation,
  referenceSegments,
  sectionAnchor,
} from "./reference-segments";

@Component({
  selector: "app-publication-text",
  standalone: true,
  host: { class: "block min-w-0" },
  imports: [PublicationContentComponent],
  template: `
    <article
      [id]="sectionAnchor('texto-publicacao')"
      tabindex="-1"
      class="full-text min-w-0 scroll-mt-24"
      [attr.aria-labelledby]="sectionAnchor('titulo-texto-publicacao')"
    >
      <h2
        [id]="sectionAnchor('titulo-texto-publicacao')"
        class="text-lg font-semibold tracking-tight text-ink"
      >
        Texto da publicação
      </h2>
      @if (hasReferences()) {
        <p class="mt-2 text-xs leading-6 text-muted">
          Passe o mouse ou use o teclado nos trechos sublinhados para ver uma
          prévia. Clique para abrir as referências e suas evidências.
        </p>
      }
      <div
        class="publication-text mt-5 whitespace-pre-wrap text-[15px] leading-8 text-ink [overflow-wrap:anywhere] sm:text-base"
      >
        <app-publication-content
          [text]="text()"
          [decorations]="segments()"
          [baseHref]="baseHref()"
          [anchorNamespace]="anchorNamespace()"
          (anchorActivated)="anchorActivated.emit($event)"
        />
      </div>
    </article>
  `,
})
export class PublicationTextComponent {
  readonly text = input.required<string>();
  readonly identity = input.required<TextIdentity>();
  readonly references = input<readonly Reference[]>([]);
  readonly baseHref = input("");
  readonly anchorNamespace = input("publication");
  readonly anchorActivated = output<ReferenceNavigation>();
  readonly sectionAnchor = (section: string) =>
    sectionAnchor(section, this.anchorNamespace());
  readonly segments = computed(() => {
    const text = this.text();
    const points = Array.from(text);
    return referenceSegments(
      text,
      this.identity(),
      this.references(),
      this.anchorNamespace(),
    ).map((segment) => {
      const excerpt = segment.references.length
        ? referenceExcerpt(points, segment.start, segment.end)
        : null;
      const context = excerpt
        ? (excerpt.leadingEllipsis ? "…" : "") +
          (excerpt.before + excerpt.mention + excerpt.after)
            .replace(/\s+/g, " ")
            .trim() +
          (excerpt.trailingEllipsis ? "…" : "")
        : "";
      return { ...segment, context };
    });
  });
  readonly hasReferences = computed(
    () => visibleReferenceParts(this.text(), this.segments()).length > 0,
  );
}
