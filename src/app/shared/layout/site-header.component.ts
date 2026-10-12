import { Component } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
@Component({
  selector: "app-site-header",
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  host: { class: "block" },
  template: `
    <header class="border-b border-line bg-white">
      <div
        class="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 sm:px-8"
      >
        <a
          class="flex shrink-0 items-center gap-2.5 text-ink"
          routerLink="/"
          aria-label="Oráculo, início"
        >
          <svg
            class="size-8 text-brand-600"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M16 4C9.37 4 4 9.37 4 16s5.37 12 12 12 12-5.37 12-12S22.63 4 16 4Z"
              stroke="currentColor"
              stroke-width="4"
            />
            <path d="m19.5 12.5-3 7-7 3 3-7 7-3Z" fill="currentColor" />
          </svg>
          <span class="text-[28px] font-semibold tracking-[-1.2px]"
            >Oráculo</span
          >
        </a>
        <nav
          class="order-last flex w-full gap-5 text-sm sm:order-none sm:w-auto"
          aria-label="Navegação principal"
        >
          <a
            routerLink="/"
            routerLinkActive="text-brand-700 font-semibold"
            [routerLinkActiveOptions]="{
              paths: 'exact',
              queryParams: 'ignored',
              fragment: 'ignored',
              matrixParams: 'ignored',
            }"
            ariaCurrentWhenActive="page"
            class="min-h-8 py-1 hover:text-brand-700"
            >Pesquisa</a
          >
          <a
            routerLink="/jurisprudencia"
            routerLinkActive="text-brand-700 font-semibold"
            ariaCurrentWhenActive="page"
            class="min-h-8 py-1 hover:text-brand-700"
            >Jurisprudência</a
          >
          <a
            routerLink="/jurimetria"
            routerLinkActive="text-brand-700 font-semibold"
            ariaCurrentWhenActive="page"
            class="min-h-8 py-1 hover:text-brand-700"
            >Jurimetria</a
          >
        </nav>
        <div
          class="ml-auto flex items-center gap-2 text-xs font-medium text-brand-700 sm:text-sm"
        >
          <span
            class="size-1.5 rounded-full bg-brand-500"
            aria-hidden="true"
          ></span>
          Acervo público e ativo
        </div>
      </div>
    </header>
  `,
})
export class SiteHeaderComponent {}
