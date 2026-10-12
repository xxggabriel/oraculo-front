import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, describe, expect, it } from "vitest";
import { JudicialMetadata } from "../../../core/search";
import { PublicationMetadataComponent } from "./publication-metadata.component";

afterEach(() => TestBed.resetTestingModule());
describe("Dados judiciais da publicação", () => {
  it("apresenta os cinco campos, sem promover valores ambíguos", () => {
    const component = TestBed.runInInjectionContext(
      () => new PublicationMetadataComponent(),
    );
    const metadata = signal<JudicialMetadata | null>({
      rapporteur: "Nome não confirmado",
      rapporteurStatus: "ambiguous",
      organName: "<b>2ª Câmara</b>",
      className: "Apelação &amp; Recurso",
      documentType: "Acórdão",
      instanceDegree: "2º grau",
      instanceDegreeStatus: "available",
    });
    Object.defineProperty(component, "metadata", { value: metadata });
    expect(component.fields().map((field) => field.value)).toEqual([
      "Informação ambígua na fonte",
      "2ª Câmara",
      "Apelação & Recurso",
      "Acórdão",
      "2º grau",
    ]);
    expect(component.fields()[0].available).toBe(false);
    metadata.set(null);
    expect(
      component.fields().every((field) => field.value === "Não informado"),
    ).toBe(true);
  });
});
