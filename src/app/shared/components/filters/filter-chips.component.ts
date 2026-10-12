import { Component, input, output } from "@angular/core";
import { FilterChip } from "./filter-state";
@Component({
  selector: "app-filter-chips",
  standalone: true,
  host: { class: "block" },
  template: `
    @if (chips().length) {
      <div class="flex flex-wrap gap-2" [attr.aria-label]="label()">
        @for (chip of chips(); track chip.key + chip.value) {
          <button
            class="flex max-w-full items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
            type="button"
            (click)="remove.emit(chip)"
            [attr.aria-label]="'Remover filtro: ' + chip.label"
          >
            <span class="min-w-0 break-words">{{ chip.label }}</span
            ><span aria-hidden="true">×</span>
          </button>
        }
      </div>
    }
  `,
})
export class FilterChipsComponent {
  readonly chips = input<readonly FilterChip[]>([]);
  readonly label = input("Filtros aplicados");
  readonly remove = output<FilterChip>();
}
