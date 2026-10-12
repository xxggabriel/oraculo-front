import { Component, DestroyRef, inject } from "@angular/core";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { DOCUMENT } from "@angular/common";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AppShellComponent } from "./shared/layout/app-shell.component";
@Component({
  selector: "app-root",
  standalone: true,
  imports: [AppShellComponent, RouterOutlet],
  template: `<app-shell><router-outlet /></app-shell>`,
})
export class AppComponent {
  constructor() {
    const document = inject(DOCUMENT);
    const router = inject(Router);
    const destroy = inject(DestroyRef);
    let previousPage = "";
    router.events.pipe(takeUntilDestroyed(destroy)).subscribe((event) => {
      if (!(event instanceof NavigationEnd)) return;
      const page = event.urlAfterRedirects.split("#")[0]!;
      const changedPage = page !== previousPage;
      previousPage = page;
      // Fragment navigation is managed by the reading component itself.
      if (changedPage && !event.urlAfterRedirects.includes("#"))
        setTimeout(
          () => document.getElementById("main")?.focus({ preventScroll: true }),
          0,
        );
    });
  }
}
