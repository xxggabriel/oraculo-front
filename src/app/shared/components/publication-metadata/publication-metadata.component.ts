import { Component, computed, input } from "@angular/core";
import { JudicialMetadata } from "../../../core/search";
import { publicationPlainText } from "../publication-content/publication-html";

@Component({
  selector: "app-publication-metadata",
  standalone: true,
  host: { class: "block min-w-0" },
  template: `
    <section
      class="mt-6 border-t border-line pt-5"
      aria-label="Dados da publicação"
    >
      <h2 class="text-sm font-semibold text-ink">Dados da publicação</h2>
      <dl
        class="mt-4 grid min-w-0 gap-x-8 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3"
      >
        @for (field of fields(); track field.label) {
          <div class="min-w-0">
            <dt class="text-xs text-muted">{{ field.label }}</dt>
            <dd
              class="mt-1 break-words [overflow-wrap:anywhere]"
              [class.font-medium]="field.available"
              [class.text-muted]="!field.available"
            >
              {{ field.value }}
            </dd>
          </div>
        }
      </dl>
    </section>
  `,
})
export class PublicationMetadataComponent {
  readonly metadata = input<JudicialMetadata | null | undefined>(null);
  readonly fields = computed(() => {
    const m = this.metadata();
    const field = (
      label: string,
      value: string | null | undefined,
      status?: JudicialMetadata["rapporteurStatus"],
    ) => {
      const text = value
        ? publicationPlainText(value).replace(/\s+/g, " ").trim()
        : "";
      const available =
        Boolean(text) && (status === undefined || status === "available");
      return {
        label,
        available,
        value: available
          ? text
          : status === "ambiguous"
            ? "Informação ambígua na fonte"
            : "Não informado",
      };
    };
    return [
      field("Relator", m?.rapporteur, m?.rapporteurStatus),
      field("Órgão judicial", m?.organName),
      field("Classe processual", m?.className),
      field("Tipo de documento", m?.documentType),
      field("Grau de instância", m?.instanceDegree, m?.instanceDegreeStatus),
    ];
  });
}
