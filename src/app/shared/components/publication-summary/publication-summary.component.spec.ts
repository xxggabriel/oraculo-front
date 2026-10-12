import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, describe, expect, it } from "vitest";
import { Publication } from "../../../core/search";
import { PublicationSummaryComponent } from "./publication-summary.component";

afterEach(() => TestBed.resetTestingModule());
describe("Datas do resumo", () => {
  it("distingue publicação, disponibilização e ausência sem inferir data", () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(
      () => new PublicationSummaryComponent(),
    );
    const publication = signal<Publication>({
      id: "1",
      revision: "1",
      textVersion: "1",
      court: "TJGO",
      type: "Sentença",
      publicationDate: "2026-10-08",
      availabilityDate: "2026-10-07",
      sourceDate: null,
      processes: [],
      snippets: [],
      score: null,
    });
    Object.defineProperty(component, "publication", { value: publication });
    expect(component.dateLabel()).toBe("Publicado em 08/10/2026");
    publication.update((p) => ({ ...p, publicationDate: null }));
    expect(component.dateLabel()).toBe(
      "Disponibilizado em 07/10/2026 · Data de publicação não informada",
    );
    publication.update((p) => ({
      ...p,
      availabilityDate: null,
      sourceDate: "2026-10-06",
    }));
    expect(component.dateLabel()).toBe("Data de publicação não informada");
  });
});
