import { PublicationContentStub } from "../../../../../tests/publication-content.stub";
import { signal } from "@angular/core";
import { By } from "@angular/platform-browser";
import { PublicationContentComponent } from "../publication-content/publication-content.component";
import { TestBed } from "@angular/core/testing";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicationTextComponent } from "./publication-text.component";
import { referenceAnchor } from "./reference-segments";
import { identity, reference } from "./reference-test-fixtures";

function createPublicationText() {
  TestBed.overrideComponent(PublicationTextComponent, {
    remove: { imports: [PublicationContentComponent] },
    add: { imports: [PublicationContentStub] },
  });
  return TestBed.createComponent(PublicationTextComponent);
}

afterEach(() => TestBed.resetTestingModule());
describe("PublicationTextComponent", () => {
  it("delega a fonte original sem injetar HTML no componente coordenador", () => {
    const fixture = createPublicationText();
    const text = "😀 <img src=x onerror=alert(1)> art. 5";
    Object.assign(fixture.componentInstance, { text: signal(text) });
    Object.assign(fixture.componentInstance, { identity: signal(identity) });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector(".publication-text").textContent,
    ).toBe(text);
    expect(fixture.nativeElement.querySelector("img")).toBeNull();
  });
  it("oferece cada destino sobreposto, preserva query e emite navegação acessível", () => {
    const fixture = createPublicationText();
    const normative = reference(
      "cf-5",
      [{ start: 2, end: 8, surface: "art. 5" }],
      "normative_reference",
    );
    const citation = reference("precedent", [
      { start: 2, end: 8, surface: "art. 5" },
    ]);
    Object.assign(fixture.componentInstance, { text: signal("😀 art. 5") });
    Object.assign(fixture.componentInstance, { identity: signal(identity) });
    Object.assign(fixture.componentInstance, {
      references: signal([normative, citation]),
    });
    Object.assign(fixture.componentInstance, {
      baseHref: signal("/publicacoes/publication?q=dano%20moral&court=TJGO"),
    });
    const navigate = vi.fn();
    fixture.componentInstance.anchorActivated.subscribe(navigate);
    fixture.detectChanges();
    const child = fixture.debugElement.query(
      By.directive(PublicationContentStub),
    ).componentInstance as PublicationContentStub;
    expect(child.baseHref).toBe(
      "/publicacoes/publication?q=dano%20moral&court=TJGO",
    );
    const mention = child.decorations.find((part) => part.references?.length);
    expect(mention?.references?.map((item) => item.id)).toEqual([
      "precedent",
      "cf-5",
    ]);
    expect(mention?.context).toBe("😀 art. 5");
    child.anchorActivated.emit({
      anchor: referenceAnchor(normative),
      sourceAnchor: "publication-fragment-2-8",
    });
    expect(navigate).toHaveBeenCalledWith({
      anchor: referenceAnchor(normative),
      sourceAnchor: "publication-fragment-2-8",
    });
  });
});
