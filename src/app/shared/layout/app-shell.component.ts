import { Component } from "@angular/core";
import { SiteHeaderComponent } from "./site-header.component";
import { SiteFooterComponent } from "./site-footer.component";
@Component({
  selector: "app-shell",
  standalone: true,
  imports: [SiteHeaderComponent, SiteFooterComponent],
  host: { class: "block" },
  template: ` <a
      class="fixed -top-20 left-4 z-50 rounded-lg bg-brand-700 px-4 py-3 font-medium text-white focus:top-3"
      href="#main"
      >Ir para o conteúdo</a
    >
    <app-site-header />
    <main
      id="main"
      tabindex="-1"
      class="mx-auto min-h-[calc(100vh-160px)] max-w-7xl px-5 pb-16 pt-7 sm:px-8 sm:pt-9"
    >
      <ng-content />
    </main>
    <app-site-footer />`,
})
export class AppShellComponent {}
