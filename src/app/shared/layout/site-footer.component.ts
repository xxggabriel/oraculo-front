import { Component } from "@angular/core";
@Component({
  selector: "app-site-footer",
  standalone: true,
  host: { class: "block" },
  template: `
    <footer class="border-t border-line bg-surface">
      <div
        class="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8"
      >
        <span class="text-sm font-semibold text-ink"
          >Oráculo · Publicações e jurimetria</span
        >
        <span>Publicação, processo e julgamento são unidades distintas.</span>
      </div>
    </footer>
  `,
})
export class SiteFooterComponent {}
