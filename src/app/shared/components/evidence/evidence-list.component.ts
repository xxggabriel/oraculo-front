import { PublicationContentComponent } from "../publication-content/publication-content.component";
import { Component, input } from "@angular/core";
import { Evidence } from "../../../core/search";
@Component({
  selector: "app-evidence-list",
  standalone: true,
  imports: [PublicationContentComponent],
  host: { class: "block min-w-0" },
  template: `
    @if (!evidence().length) {
      <p class="mt-3 text-sm text-muted">Nenhuma evidência disponível.</p>
    }
    @for (item of evidence(); track $index) {
      <blockquote
        class="mt-4 whitespace-pre-wrap border-l-2 border-brand-500 bg-brand-50 px-4 py-3 text-sm leading-7 text-ink [overflow-wrap:anywhere]"
      >
        <app-publication-content [text]="item.surface" />
      </blockquote>
      <p class="evidence-meta mt-2 break-all text-xs leading-6 text-muted">
        Intervalo {{ item.start }}–{{ item.end }} · publicação
        {{ item.publicationId }} · revisão {{ item.revisionId }} · texto
        {{ item.textVersionId }}
      </p>
    }
  `,
})
export class EvidenceListComponent {
  readonly evidence = input.required<readonly Evidence[]>();
}
