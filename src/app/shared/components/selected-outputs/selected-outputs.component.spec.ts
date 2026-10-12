import { Component, Input, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, describe, expect, it } from "vitest";
import { Evidence, Output } from "../../../core/search";
import { identity } from "../publication-text/reference-test-fixtures";
import { SelectedOutputsComponent } from "./selected-outputs.component";
import template from "./selected-outputs.component.html?raw";

@Component({ selector: "app-evidence-list", standalone: true, template: "" })
class EvidenceStub {
  @Input() evidence: readonly Evidence[] = [];
}

@Component({
  selector: "app-loading-skeleton",
  standalone: true,
  template: "{{ label }}",
})
class SkeletonStub {
  @Input() label = "";
}

const outputs: Output[] = Array.from({ length: 26 }, (_, index) => ({
  id: `output-${index}`,
  family: "act",
  actId: null,
  actVersionId: null,
  label: `Ato ${index}`,
  reviewStatus: "proposed",
  informationState: "known",
  meritsState: null,
  meritsResult: null,
  evidence: [],
}));

afterEach(() => TestBed.resetTestingModule());
describe("SelectedOutputsComponent", () => {
  it("expande cinco atos iniciais em páginas de dez e reinicia na nova lista ou publicação", () => {
    TestBed.overrideComponent(SelectedOutputsComponent, {
      set: { template, imports: [EvidenceStub, SkeletonStub] },
    });
    const fixture = TestBed.createComponent(SelectedOutputsComponent);
    const items = signal(outputs);
    const currentIdentity = signal(identity);
    Object.assign(fixture.componentInstance, {
      outputs: items,
      identity: currentIdentity,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll("article")).toHaveLength(5);
    const clickMore = () => {
      fixture.nativeElement.querySelector("button").click();
      fixture.detectChanges();
    };
    clickMore();
    expect(fixture.nativeElement.querySelectorAll("article")).toHaveLength(15);
    clickMore();
    expect(fixture.nativeElement.querySelectorAll("article")).toHaveLength(25);
    expect(fixture.nativeElement.querySelector("button").textContent).toContain(
      "mais 1",
    );
    clickMore();
    expect(fixture.nativeElement.querySelectorAll("article")).toHaveLength(26);
    expect(fixture.nativeElement.querySelector("button")).toBeNull();
    currentIdentity.set({ ...identity, id: "another" });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll("article")).toHaveLength(5);
    clickMore();
    items.set([...outputs]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll("article")).toHaveLength(5);
  });

  it("renderiza skeleton durante a carga e só apresenta vazio quando ela termina", () => {
    TestBed.overrideComponent(SelectedOutputsComponent, {
      set: { template, imports: [EvidenceStub, SkeletonStub] },
    });
    const fixture = TestBed.createComponent(SelectedOutputsComponent);
    const loading = signal(true);
    Object.assign(fixture.componentInstance, { outputs: signal([]), loading });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector("app-loading-skeleton"),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector("section").getAttribute("aria-busy"),
    ).toBe("true");
    expect(fixture.nativeElement.textContent).not.toContain("Nenhum output");
    loading.set(false);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector("app-loading-skeleton"),
    ).toBeNull();
    expect(fixture.nativeElement.textContent).toContain("Nenhum output");
  });
});
