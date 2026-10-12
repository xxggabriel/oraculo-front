import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
} from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
import {
  Capabilities,
  Criteria,
  DateAxis,
  Distribution,
  MissingDates,
  Visibility,
} from "../../../core/search";
import { FacetSelectComponent } from "./facet-select.component";
import {
  DatePreset,
  FilterSelection,
  emptyFilters,
  filterChips,
  filterSelection,
  presetPeriod,
  sameFilters,
  validatePeriod,
} from "./filter-state";
@Component({
  selector: "app-filter-panel",
  standalone: true,
  host: { class: "block min-w-0" },
  imports: [ReactiveFormsModule, FacetSelectComponent],
  templateUrl: "./filter-panel.component.html",
})
export class FilterPanelComponent implements OnDestroy {
  readonly criteria = input.required<Criteria>();
  readonly idPrefix = input("filter");
  readonly toggleButton =
    viewChild<ElementRef<HTMLButtonElement>>("toggleButton");
  readonly facets = input<readonly Distribution[]>([]);
  readonly capabilities = input<Capabilities | null>(null);
  readonly loading = input(false);
  readonly apply = output<FilterSelection>();
  readonly clear = output<void>();
  readonly open = signal(false);
  readonly error = signal<string | null>(null);
  readonly preset = signal<DatePreset>("all");
  readonly draft = signal<FilterSelection>(emptyFilters());
  readonly pending = computed(
    () => !sameFilters(this.draft(), filterSelection(this.criteria())),
  );
  readonly appliedCount = computed(() => filterChips(this.criteria()).length);
  readonly contextKey = computed(() => {
    const c = this.criteria();
    return JSON.stringify([
      c.q,
      c.mode,
      c.process,
      c.dateAxis,
      c.from,
      c.to,
      c.missingDates,
      c.visibility ?? "both",
    ]);
  });
  readonly inputClass =
    "h-10 w-full min-w-0 rounded-lg border border-line bg-white px-3 text-sm text-ink disabled:bg-surface disabled:opacity-60";
  readonly form = new FormGroup({
    courts: new FormControl<readonly string[]>([], { nonNullable: true }),
    types: new FormControl<readonly string[]>([], { nonNullable: true }),
    visibility: new FormControl<Visibility>("both", { nonNullable: true }),
    process: new FormControl("", { nonNullable: true }),
    relation: new FormControl<"any" | "publication_process" | "referenced">(
      "publication_process",
      { nonNullable: true },
    ),
    dateAxis: new FormControl<DateAxis>("publication", { nonNullable: true }),
    from: new FormControl("", { nonNullable: true }),
    to: new FormControl("", { nonNullable: true }),
    missingDates: new FormControl<MissingDates>("include", {
      nonNullable: true,
    }),
  });
  private readonly changes: Subscription;
  constructor() {
    this.changes = this.form.valueChanges.subscribe(() => {
      this.draft.set(this.selection());
      this.error.set(null);
    });
    effect(() => {
      this.reset(filterSelection(this.criteria()));
    });
  }
  id(name: string) {
    return `${this.idPrefix()}-${name}`;
  }
  private selection(): FilterSelection {
    const f = this.form.getRawValue();
    return {
      courts: f.courts,
      documentTypes: f.types,
      visibility: f.visibility,
      process: f.process.trim()
        ? { cnj: f.process.trim(), relation: f.relation }
        : null,
      dateAxis: f.dateAxis,
      from: f.from || null,
      to: f.to || null,
      missingDates: f.missingDates,
    };
  }
  private reset(filters: FilterSelection) {
    this.form.setValue(
      {
        courts: [...filters.courts],
        types: [...filters.documentTypes],
        visibility: filters.visibility ?? "both",
        process: filters.process?.cnj ?? "",
        relation: filters.process?.relation ?? "publication_process",
        dateAxis: filters.dateAxis,
        from: filters.from ?? "",
        to: filters.to ?? "",
        missingDates: filters.missingDates,
      },
      { emitEvent: false },
    );
    this.draft.set(filters);
    this.preset.set(filters.from || filters.to ? "custom" : "all");
    this.error.set(null);
  }
  facet(field: "court" | "documentType") {
    return this.facets().find((f) => f.field === field) ?? null;
  }
  available(name: string) {
    return (
      this.capabilities()?.features.find((f) => f.name === name)?.available ??
      true
    );
  }
  selectCourts(values: readonly string[]) {
    this.form.controls.courts.setValue(values);
  }
  selectTypes(values: readonly string[]) {
    this.form.controls.types.setValue(values);
  }
  choosePreset(event: Event) {
    const preset = (event.target as HTMLSelectElement).value as DatePreset;
    this.preset.set(preset);
    if (preset !== "custom") {
      const dates = presetPeriod(preset);
      this.form.patchValue({ from: dates.from ?? "", to: dates.to ?? "" });
    }
  }
  submit() {
    const filters = this.selection();
    const error = validatePeriod(
      filters.from,
      filters.to,
      filters.missingDates,
    );
    this.error.set(error);
    if (error) return;
    this.open.set(false);
    this.apply.emit(filters);
  }
  clearFilters() {
    this.reset(emptyFilters());
    this.open.set(false);
    this.clear.emit();
  }
  cancel() {
    this.reset(filterSelection(this.criteria()));
    this.open.set(false);
    this.toggleButton()?.nativeElement.focus({ preventScroll: true });
  }
  toggleOpen() {
    if (this.open()) this.cancel();
    else this.open.set(true);
  }
  @HostListener("keydown.escape") closeOnEscape() {
    if (this.open()) this.cancel();
  }
  ngOnDestroy() {
    this.changes.unsubscribe();
  }
}
