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
  it("usa datas de publicação, marca a atual e conserva texto e contexto de navegação", () => {
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
    expect(entries[1].textContent).toContain("Tema de undated");
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

it("limita o texto visível após interpretar atributos longos e tags repartidas no snippet", () => {
  const fixture = setup();
  const publication = testTimeline("html").publications[0];
  const source = `<div title="${"x".repeat(500)}"><b>Dano &amp; reparação</b><br>Próximo trecho</div>`;
  Object.assign(publication, {
    snippets: [
      [
        { text: source.slice(0, 20), highlighted: true },
        { text: source.slice(20), highlighted: false },
      ],
    ],
  });
  expect(fixture.componentInstance.excerpt(publication)).toBe(
    "Dano & reparação Próximo trecho",
  );
});
