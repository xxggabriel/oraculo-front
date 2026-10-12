import { Component, effect, input, output } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { Criteria, Mode } from "../../../core/search";
@Component({
  selector: "app-search-query",
  standalone: true,
  host: { class: "block" },
  imports: [ReactiveFormsModule],
  templateUrl: "./search-query.component.html",
})
export class SearchQueryComponent {
  readonly criteria = input.required<Criteria>();
  readonly loading = input(false);
  readonly compact = input(false);
  readonly search = output<Pick<Criteria, "q" | "mode">>();
  readonly form = new FormGroup({
    q: new FormControl("", { nonNullable: true }),
    mode: new FormControl<Mode>("auto", { nonNullable: true }),
  });
  private lastQuery: Pick<Criteria, "q" | "mode"> | null = null;
  constructor() {
    effect(() => {
      const c = this.criteria();
      if (this.lastQuery?.q !== c.q || this.lastQuery.mode !== c.mode) {
        this.form.setValue({ q: c.q, mode: c.mode });
        this.lastQuery = { q: c.q, mode: c.mode };
      }
    });
  }
  submit() {
    const value = this.form.getRawValue();
    this.search.emit({ ...value, q: value.q.trim() });
  }
}
