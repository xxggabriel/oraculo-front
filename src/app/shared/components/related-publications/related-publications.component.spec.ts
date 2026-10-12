import { signal } from "@angular/core";
import { readFileSync } from "node:fs";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SearchFailure } from "../../../core/search";
import { testRelated } from "../../../../../tests/related-fixtures";
import { RelatedPublicationsComponent } from "./related-publications.component";
afterEach(() => TestBed.resetTestingModule());
function createComponent() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  TestBed.overrideComponent(RelatedPublicationsComponent, {
    set: {
      templateUrl: undefined,
      template: readFileSync(
        "src/app/shared/components/related-publications/related-publications.component.html",
        "utf8",
      ),
    },
  });
  return TestBed.createComponent(RelatedPublicationsComponent);
}
describe("RelatedPublicationsComponent", () => {
  it("mostra quatro sugestões com motivos, texto seguro e links que preservam o recorte", () => {
    const fixture = createComponent();
    Object.assign(fixture.componentInstance, {
      items: signal(
        testRelated("origin", ["first", "second", "third", "fourth"]).items,
      ),
      queryParams: signal({
        q: "dano moral",
        returnTo: "jurimetria",
        references: "both",
      }),
    });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll(".related-publication"),
    ).toHaveLength(4);
    expect(fixture.nativeElement.textContent).toContain("Texto semelhante");
    expect(fixture.nativeElement.textContent).not.toContain('alert("xss")');
    expect(fixture.nativeElement.textContent).toContain("Tema de first");
    expect(fixture.nativeElement.querySelector("script")).toBeNull();
    const href = fixture.nativeElement
      .querySelector(".related-publication a")
      .getAttribute("href");
    const url = new URL(href, "http://localhost");
    expect(url.pathname).toBe("/publicacoes/first");
    expect(url.searchParams.get("returnTo")).toBe("jurimetria");
    expect(url.searchParams.get("q")).toBe("dano moral");
    expect(url.searchParams.get("references")).toBe("both");
  });
  it("distingue indisponibilidade de resultado vazio e permite repetir somente a recomendação", () => {
    const fixture = createComponent();
    const error = signal<SearchFailure | null>(
      new SearchFailure("RELATED_ERROR", "Erro."),
    );
    Object.assign(fixture.componentInstance, { error });
    const retry = vi.fn();
    fixture.componentInstance.retry.subscribe(retry);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      "Não foi possível carregar",
    );
    fixture.nativeElement.querySelector("button").click();
    expect(retry).toHaveBeenCalledOnce();
    error.set(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      "Nenhuma publicação relacionada",
    );
  });
});

it("interpreta o snippet inteiro antes de truncar texto visível entre partes", () => {
  const fixture = createComponent();
  const publication = testRelated("origin", ["html"]).items[0].publication;
  const source = `<p data-label="${"x".repeat(500)}">😀 <strong>Art. 5 &amp; dano</strong></p>`;
  Object.assign(publication, {
    snippets: [
      [
        { text: source.slice(0, 17), highlighted: false },
        { text: source.slice(17), highlighted: true },
      ],
    ],
  });
  expect(fixture.componentInstance.excerpt(publication)).toBe(
    "😀 Art. 5 & dano",
  );
  Object.assign(publication, {
    snippets: [[{ text: `<b>${"😀".repeat(250)}</b>`, highlighted: false }]],
  });
  expect(fixture.componentInstance.excerpt(publication)).toBe(
    "😀".repeat(240) + "…",
  );
});
