import { Component, computed, input } from "@angular/core";

@Component({
  selector: "app-loading-skeleton",
  standalone: true,
  host: { class: "block min-w-0" },
  template: `
    <div role="status" class="py-6">
      <span class="sr-only">{{ label() }}</span>
      <div aria-hidden="true" class="space-y-4 motion-safe:animate-pulse">
        @for (row of rows(); track row) {
          <div class="skeleton-row rounded-lg border border-line p-5">
            <div class="h-3 w-1/4 rounded bg-line"></div>
            <div class="mt-4 h-4 w-2/3 rounded bg-line"></div>
            <div class="mt-3 h-3 w-5/6 rounded bg-surface"></div>
            <div class="mt-2 h-3 w-1/2 rounded bg-surface"></div>
          </div>
        }
      </div>
    </div>
  `,
})
export class LoadingSkeletonComponent {
  readonly label = input("Carregando itens…");
  readonly count = input(5);
  readonly rows = computed(() =>
    Array.from({ length: this.count() }, (_, i) => i),
  );
}
