import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { afterEach, describe, expect, it } from "vitest";
import { testTimeline } from "../../../../../tests/related-fixtures";
import { PublicationTimelineComponent } from "./publication-timeline.component";
import template from "./publication-timeline.component.html?raw";
function setup() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  TestBed.overrideComponent(PublicationTimelineComponent, {
    set: { templateUrl: undefined, template },
  });
  return TestBed.createComponent(PublicationTimelineComponent);
}
afterEach(() => TestBed.resetTestingModule());
describe("PublicationTimelineComponent", () => {
  it("usa datas de publicação, marca a atual e conserva contexto de navegação", () => {
    const fixture = setup();
    const report = testTimeline("current", ["current", "undated"]);
    report.publications[1].publicationDate = null;
    report.publications[1].sourceDate = "2026-10-10";
    Object.assign(fixture.componentInstance, {
      report: signal(report),
      publications: signal(report.publications),
      currentPublication: signal("current"),
      selectedProcess: signal(report.selectedProcess),
      queryParams: signal({ q: "dano moral", returnTo: "jurimetria" }),
    });
    fixture.detectChanges();
    const entries = fixture.nativeElement.querySelectorAll(".timeline-entry");
    expect(entries).toHaveLength(2);
    expect(entries[0].querySelector('[aria-current="true"]')).not.toBeNull();
    expect(entries[0].querySelector("a")).toBeNull();
    expect(entries[1].querySelector("time")).toBeNull();
    expect(entries[1].textContent).toContain(
      "Data de publicação não informada",
    );
    expect(entries[1].textContent).not.toContain("10/10/2026");
    expect(fixture.nativeElement.querySelector("script")).toBeNull();
    expect(entries[1].textContent).not.toContain('alert("xss")');
    expect(entries[1].textContent).not.toContain("Tema de undated");
    const href = entries[1].querySelector("a").getAttribute("href");
    expect(new URL(href, "http://localhost").searchParams.get("returnTo")).toBe(
      "jurimetria",
    );
  });
  it("não infere um processo quando a origem não tem vínculo válido", () => {
    const fixture = setup();
    const report = {
      ...testTimeline("source", []),
      processes: [],
      selectedProcess: null,
    };
    Object.assign(fixture.componentInstance, {
      report: signal(report),
      currentPublication: signal("source"),
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      "Não há um número de processo com vínculo confirmado",
    );
    expect(fixture.nativeElement.querySelector("ol")).toBeNull();
  });
});

it("explica o vínculo legado sem apresentar candidatas como total confirmado", () => {
  const fixture = setup();
  const report = {
    ...testTimeline("source"),
    processLinkPolicy: "comunica_v2_legacy_metadata" as const,
    total: { value: 20, relation: "eq" as const },
  };
  Object.assign(fixture.componentInstance, {
    report: signal(report),
    publications: signal(report.publications),
    selectedProcess: signal(report.selectedProcess),
    currentPublication: signal("source"),
  });
  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain(
    "Processo informado pela fonte",
  );
  expect(fixture.nativeElement.textContent).toContain("1 publicação exibida");
  expect(fixture.nativeElement.querySelector("details").textContent).toContain(
    "20 candidatas",
  );
});

it("mostra tipoDocumento e skeleton sem renderizar o texto da publicação", () => {
  const fixture = setup();
  const item = {
    ...testTimeline("current").publications[0],
    sourceDocumentType: "Decisão interlocutória",
  };
  const publications = signal([item]);
  const loading = signal(false);
  Object.assign(fixture.componentInstance, {
    currentPublication: signal("current"),
    publications,
    loading,
  });
  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain(
    "Tipo de documento: Decisão interlocutória",
  );
  expect(fixture.nativeElement.textContent).not.toContain("Tema de current");
  publications.set([]);
  loading.set(true);
  fixture.changeDetectorRef.markForCheck();
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelectorAll(".skeleton-row")).toHaveLength(
    5,
  );
  expect(
    fixture.nativeElement.querySelector("[role=status]").textContent,
  ).toContain("Carregando");
});

it("exibe partes com polos e advogados com OAB sem inferir campos ausentes", () => {
  const fixture = setup();
  const report = testTimeline("current");
  const item = {
    ...report.publications[0],
    recipients: [
      { name: "Ána Teste", pole: "A" },
      { name: "Bruno Exemplo", pole: "P" },
      { name: null, pole: "terceiro" },
    ],
    attorneys: [
      { name: "Dra. Érica", oabNumber: "00123-A", oabState: "GO" },
      { name: "Doutor João", oabNumber: null, oabState: null },
    ],
  };
  Object.assign(fixture.componentInstance, {
    currentPublication: signal("current"),
    publications: signal([item]),
  });
  fixture.detectChanges();
  const text = fixture.nativeElement.textContent.replace(/\s+/g, " ");
  expect(text).toContain("Ána Teste · Polo ativo");
  expect(text).toContain("Bruno Exemplo · Polo passivo");
  expect(text).toContain("Nome não informado · Polo informado: terceiro");
  expect(text).toContain("Dra. Érica · OAB GO / 00123-A");
  expect(text).toContain("Doutor João · OAB não informada");
});
