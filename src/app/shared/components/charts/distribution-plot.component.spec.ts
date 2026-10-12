import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DistributionPlotComponent } from "./distribution-plot.component";
import {
  PlotBucket,
  plotMaximum,
  populationShare,
  scaledWidth,
} from "./plot-values";
import template from "./distribution-plot.component.html?raw";

afterEach(() => TestBed.resetTestingModule());

describe("escalas e denominadores dos gráficos", () => {
  it("usa a população consultada mesmo quando grupos se sobrepõem ou há valores omitidos", () => {
    expect(populationShare(60, 100)).toBe(60);
    expect(populationShare(80, 100)).toBe(80);
    expect(populationShare(60, 0)).toBeNull();
    expect(populationShare(0, 100)).toBe(0);
    expect(populationShare(60, Number.NaN)).toBeNull();
  });

  it("inclui zero e mantém escala finita para série vazia, única ou inteiramente nula", () => {
    expect(plotMaximum([])).toBe(1);
    expect(plotMaximum([{ label: "vazio", count: 0 }])).toBe(1);
    expect(plotMaximum([{ label: "único", count: 53 }])).toBe(53);
    expect(scaledWidth(0, 1)).toBe(0);
    expect(scaledWidth(53, 53)).toBe(100);
    expect(scaledWidth(12, 24)).toBe(50);
    expect(plotMaximum([{ label: "inválido", count: Number.NaN }])).toBe(1);
  });
});

function fixtureFor(buckets: readonly PlotBucket[], population = 100) {
  TestBed.overrideComponent(DistributionPlotComponent, {
    set: { template },
  });
  const fixture = TestBed.createComponent(DistributionPlotComponent);
  Object.assign(fixture.componentInstance, {
    title: signal("Distribuição do recorte"),
    buckets: signal(buckets),
    population: signal(population),
  });
  return fixture;
}

describe("DistributionPlotComponent", () => {
  it("apresenta estado vazio explícito sem inventar um gráfico", () => {
    const fixture = fixtureFor([], 0);
    Object.assign(fixture.componentInstance, { kind: signal("timeline") });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector("svg")).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      "Nenhum valor informado",
    );
    expect(fixture.componentInstance.periodLabels()).toEqual([]);
    expect(Number.isFinite(fixture.componentInstance.columnWidth())).toBe(true);
  });

  it("distingue participações pequenas de contagens nulas", () => {
    const fixture = fixtureFor(
      [
        { label: "raro", count: 1 },
        { label: "nenhum", count: 0 },
      ],
      10000,
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.share(1)).toBe("<0,1%");
    expect(fixture.componentInstance.share(0)).toBe("0%");
  });

  it("exibe as dez maiores contagens e permite revelar todos os valores sem alterar o denominador", () => {
    const buckets = Array.from({ length: 12 }, (_, index) => ({
      label: `Tribunal ${index + 1}`,
      count: index + 1,
    }));
    const fixture = fixtureFor(buckets);
    fixture.detectChanges();
    const rows = () => [...fixture.nativeElement.querySelectorAll("li")];
    expect(rows()).toHaveLength(10);
    expect(rows()[0]?.textContent).toContain("Tribunal 12");
    expect(rows()[0]?.textContent).toContain("12%");
    expect(fixture.nativeElement.querySelectorAll("tbody tr")).toHaveLength(14);
    const expansion = fixture.nativeElement.querySelector(
      "button[aria-expanded]",
    ) as HTMLButtonElement;
    expansion.click();
    fixture.detectChanges();
    expect(rows()).toHaveLength(12);
    expect(rows()[0]?.textContent).toContain("12%");
    expect(expansion.getAttribute("aria-expanded")).toBe("true");
  });

  it("emite o valor original apenas para valores selecionáveis", () => {
    const fixture = fixtureFor([{ label: "TJGO", count: 25 }]);
    const selectable = signal(false);
    Object.assign(fixture.componentInstance, { selectable });
    const selected = vi.fn();
    fixture.componentInstance.bucketSelected.subscribe(selected);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      "li button",
    ) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    button.click();
    expect(selected).not.toHaveBeenCalled();
    selectable.set(true);
    fixture.detectChanges();
    expect(button.getAttribute("aria-label")).toContain("25 publicações");
    button.click();
    expect(selected).toHaveBeenCalledExactlyOnceWith("TJGO");
  });

  it("representa um período único com zero no eixo, sem fabricar linha de tendência", () => {
    const fixture = fixtureFor([{ label: "2026-10-11", count: 0 }], 0);
    Object.assign(fixture.componentInstance, { kind: signal("timeline") });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector("svg circle")).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector("svg rect").getAttribute("height"),
    ).toBe("0");
    expect(
      fixture.nativeElement.querySelectorAll("svg path, svg polyline"),
    ).toHaveLength(0);
    expect(
      fixture.nativeElement.querySelectorAll("svg text[text-anchor=middle]"),
    ).toHaveLength(2);
    expect(fixture.nativeElement.textContent).toContain("11/10/2026");
    expect(fixture.nativeElement.textContent).toContain("—");
    expect(fixture.nativeElement.innerHTML).not.toMatch(/NaN|Infinity/);
  });

  it("mantém a ordem temporal fornecida e avisa quando valores recebidos estão recolhidos", () => {
    const buckets = Array.from({ length: 25 }, (_, index) => ({
      label: `2026-10-${String(index + 1).padStart(2, "0")}`,
      count: 25 - index,
    }));
    const fixture = fixtureFor(buckets);
    Object.assign(fixture.componentInstance, { kind: signal("timeline") });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll("svg rect")).toHaveLength(24);
    expect(fixture.nativeElement.textContent).toContain("24 de 25");
    (
      fixture.nativeElement.querySelector(
        "button[aria-expanded]",
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll("svg rect")).toHaveLength(25);
    const labels = [...fixture.nativeElement.querySelectorAll("li")].map(
      (row: Element) => row.textContent,
    );
    expect(labels[0]).toContain("01/10/2026");
    expect(labels[24]).toContain("25/10/2026");
  });

  it("explicita ausentes, outros valores, truncamento e erro desconhecido sem inserir HTML", () => {
    const fixture = fixtureFor([
      { label: '<script>alert("xss")</script>', count: 60 },
    ]);
    Object.assign(fixture.componentInstance, {
      missing: signal(10),
      other: signal(30),
      truncated: signal(true),
      approximate: signal(true),
      countError: signal(-1),
    });
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain("10 (10%)");
    expect(text).toContain("30 (30%)");
    expect(text).toContain("está truncada");
    expect(text).toContain("não estimado");
    expect(text).toContain('<script>alert("xss")</script>');
    expect(fixture.nativeElement.querySelector("script")).toBeNull();
  });
  it("não inventa ausentes ou outros valores em um ranking sem resíduos fornecidos", () => {
    const fixture = fixtureFor([{ label: "Referência", count: 60 }], 100);
    Object.assign(fixture.componentInstance, { showCoverage: signal(false) });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain("Não informado");
    expect(fixture.nativeElement.textContent).not.toContain("Outros valores");
    expect(fixture.nativeElement.querySelectorAll("tbody tr")).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain("60%");
  });
  it("identifica buckets mensais como mês/ano, preservando o significado do período", () => {
    const fixture = fixtureFor([{ label: "2026-10", count: 95 }], 95);
    Object.assign(fixture.componentInstance, { kind: signal("timeline") });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("10/2026");
    expect(fixture.nativeElement.textContent).not.toContain("01/10/2026");
    expect(
      fixture.nativeElement.querySelector("svg rect").getAttribute("height"),
    ).toBe("144");
  });
});
