import {
  Component,
  ElementRef,
  afterEveryRender,
  computed,
  effect,
  input,
  output,
  signal,
  viewChildren,
} from "@angular/core";
import { Distribution } from "../../../core/search";
import { number } from "../../format";
@Component({
  selector: "app-facet-select",
  standalone: true,
  host: { class: "block" },
  templateUrl: "./facet-select.component.html",
})
export class FacetSelectComponent {
  readonly label = input.required<string>();
  readonly fieldId = input.required<string>();
  readonly distribution = input<Distribution | null>(null);
  readonly selected = input<readonly string[]>([]);
  readonly available = input(true);
  readonly contextKey = input("");
  readonly selectionChange = output<readonly string[]>();
  readonly search = signal("");
  readonly limit = signal(10);
  private readonly observed = signal<readonly string[]>([]);
  private previousContext: string | null = null;
  readonly number = number;
  private readonly optionInputs =
    viewChildren<ElementRef<HTMLInputElement>>("optionInput");
  readonly options = computed(() => {
    const counts = new Map(
      this.distribution()?.buckets.map((b) => [b.label, b.count]) ?? [],
    );
    const values = [...new Set([...this.selected(), ...this.observed()])];
    const term = this.fold(this.search().trim());
    return values
      .filter((value) => this.fold(value).includes(term))
      .map((value) => ({ value, count: counts.get(value) ?? null }));
  });
  readonly visible = computed(() => this.options().slice(0, this.limit()));
  constructor() {
    afterEveryRender({
      write: () => {
        // A checkbox mutates its own DOM before emitting change. If a draft is
        // cancelled before Angular renders that change, [checked] can remain
        // cached at its original value. Reconcile visible controls with the
        // selected input even when that binding did not change during rendering.
        const selected = new Set(this.selected());
        for (const option of this.optionInputs()) {
          const input = option.nativeElement;
          const checked = selected.has(input.value);
          if (input.checked !== checked) input.checked = checked;
        }
      },
    });

    effect(() => {
      const context = this.contextKey();
      const current = this.distribution()?.buckets.map((b) => b.label) ?? [];
      if (context !== this.previousContext) {
        this.previousContext = context;
        this.observed.set(current);
        this.search.set("");
        this.limit.set(10);
      } else
        this.observed.update((values) => [...new Set([...values, ...current])]);
    });
  }
  private fold(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  }
  changeSearch(event: Event) {
    this.search.set((event.target as HTMLInputElement).value);
    this.limit.set(10);
  }
  toggle(value: string) {
    this.selectionChange.emit(
      this.selected().includes(value)
        ? this.selected().filter((v) => v !== value)
        : [...this.selected(), value],
    );
  }
}
