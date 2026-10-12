import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, describe, expect, it, vi } from "vitest";
import { reference } from "../publication-text/reference-test-fixtures";
import { ReferencePreviewComponent } from "./reference-preview.component";
import { ReferenceLinkComponent } from "./reference-link.component";

afterEach(() => TestBed.resetTestingModule());
describe("ReferencePreviewComponent", () => {
  it("mostra texto visível de HTML e mantém estado sem inferir identificação", () => {
    const fixture = TestBed.createComponent(ReferencePreviewComponent);
    Object.assign(fixture.componentInstance, {
      reference: signal(
        reference(
          "norm",
          [{ surface: "Art. 5 <img src=x>" }],
          "normative_reference",
        ),
      ),
      context: signal("Foi citado <script>alert(1)</script> no texto."),
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Referência normativa");
    expect(fixture.nativeElement.textContent).toContain("Art. 5");
    expect(fixture.nativeElement.textContent).not.toContain("<img");
    expect(fixture.nativeElement.textContent).not.toContain("alert(1)");
    expect(fixture.nativeElement.textContent).toContain("Foi citado no texto.");
    expect(fixture.nativeElement.textContent).toContain(
      "Identificação não resolvida",
    );
    expect(fixture.nativeElement.textContent).toContain(
      "Proposta não validada",
    );
    expect(fixture.nativeElement.querySelector("img, script")).toBeNull();
  });
  it("limita títulos longos sem dividir pares Unicode", () => {
    const component = TestBed.createComponent(
      ReferencePreviewComponent,
    ).componentInstance;
    Object.assign(component, {
      reference: signal(reference("long", [{ surface: "😀".repeat(250) }])),
    });
    expect(component.title()).toBe("😀".repeat(220) + "…");
  });
});
describe("ReferenceLinkComponent", () => {
  it("preserva cliques modificados e emite o destino e a ocorrência no clique normal", () => {
    const component = TestBed.createComponent(
      ReferenceLinkComponent,
    ).componentInstance;
    Object.assign(component, {
      anchor: signal("reference"),
      sourceAnchor: signal("occurrence"),
    });
    const navigate = vi.fn();
    component.anchorActivated.subscribe(navigate);
    const modified = new MouseEvent("click", {
      ctrlKey: true,
      cancelable: true,
    });
    component.activate(modified);
    expect(modified.defaultPrevented).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
    const click = new MouseEvent("click", { cancelable: true });
    component.activate(click);
    expect(click.defaultPrevented).toBe(true);
    expect(navigate).toHaveBeenCalledWith({
      anchor: "reference",
      sourceAnchor: "occurrence",
    });
  });
});

it("normaliza títulos e contextos HTML antes de limitar caracteres visíveis", () => {
  const fixture = TestBed.createComponent(ReferencePreviewComponent);
  const surface = `<strong title="${"x".repeat(300)}">Art. 5 &amp; Constituição</strong>`;
  const item = reference("norm", [{ surface }], "normative");
  Object.assign(fixture.componentInstance, {
    reference: signal(item),
    context: signal(`<p>Antes</p><p><em>Art. 5</em> &amp; contexto</p>`),
  });
  expect(fixture.componentInstance.title()).toBe("Art. 5 & Constituição");
  expect(fixture.componentInstance.visibleContext()).toBe(
    "Antes Art. 5 & contexto",
  );
  expect(item.surface).toBe(surface);
});

it("preserva marcação literal quando o contexto já foi projetado do HTML", () => {
  const component = TestBed.createComponent(
    ReferencePreviewComponent,
  ).componentInstance;
  Object.assign(component, {
    reference: signal(reference("literal", [])),
    context: signal("Trecho contém <b>literal</b> & norma."),
    contextIsPlain: signal(true),
  });
  expect(component.visibleContext()).toBe(
    "Trecho contém <b>literal</b> & norma.",
  );
});
