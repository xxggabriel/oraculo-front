import { signal } from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";
import template from "./publication-content.component.html?raw";
import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { afterEach, describe, expect, it } from "vitest";
import { ReferenceLinkStub } from "../../../../../tests/reference-link.stub";
import { PublicationContentComponent } from "./publication-content.component";
import { referenceSegments } from "../publication-text/reference-segments";
import {
  identity,
  reference,
} from "../publication-text/reference-test-fixtures";
afterEach(() => TestBed.resetTestingModule());
function create(text: string) {
  TestBed.overrideComponent(PublicationContentComponent, {
    set: {
      template,
      templateUrl: undefined,
      imports: [NgTemplateOutlet, ReferenceLinkStub],
    },
  });
  const fixture = TestBed.createComponent(PublicationContentComponent);
  Object.assign(fixture.componentInstance, { text: signal(text) });
  return fixture;
}
describe("PublicationContentComponent", () => {
  it("renders passive formatting and table/list semantics while dropping active markup and source attributes", () => {
    const fixture = create(
      '<center id="texto-publicacao" style="color:red">ATO &amp; TEXTO</center><p><b>decisão</b><br>legível</p><ol start="4" type="I"><li>item</li></ol><table><tr><th>Título</th><td colspan="2">Valor</td></tr></table><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">rótulo</a>',
    );
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector(".publication-html-center")?.textContent).toBe(
      "ATO & TEXTO",
    );
    expect(root.querySelector("b")?.textContent).toBe("decisão");
    expect(root.querySelector("ol")?.getAttribute("start")).toBe("4");
    expect(root.querySelector("ol")?.style.listStyleType).toBe("upper-roman");
    expect(root.querySelector("td")?.colSpan).toBe(2);
    expect(
      root.querySelector("script,img,[onerror],#texto-publicacao"),
    ).toBeNull();
    expect(root.querySelector("a")).toBeNull();
    expect(root.textContent).toContain("rótulo");
  });
  it("links each overlap once and keeps unique anchors and decoded context across formatting", () => {
    const text = "😀 art. <b>5</b>";
    const surface = "art. <b>5</b>";
    const refs = [
      reference("case", [{ start: 2, end: Array.from(text).length, surface }]),
      reference(
        "cf",
        [{ start: 2, end: Array.from(text).length, surface }],
        "normative_reference",
      ),
    ];
    const fixture = create(text);
    Object.assign(fixture.componentInstance, {
      decorations: signal(
        referenceSegments(text, identity, refs).map((part) => ({
          ...part,
          context: "😀 art. 5 <literal>",
        })),
      ),
      baseHref: signal("/publicacoes/publication?q=dano"),
    });
    fixture.detectChanges();
    const children = fixture.debugElement.queryAll(
      By.directive(ReferenceLinkStub),
    );
    expect(children).toHaveLength(3); // primary before/inside b, secondary destination once
    const links = children.map(
      (node) => node.componentInstance as ReferenceLinkStub,
    );
    expect(links[0].text).toBe("art. ");
    expect(links[2].text).toBe("5");
    expect(links[0].context).toBe("😀 art. 5 <literal>");
    expect(links[0].contextIsPlain).toBe(true);
    expect(links[1].href).toContain("/publicacoes/publication?q=dano#");
    const anchors = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll("[id]"),
    ].map((node) => node.id);
    expect(new Set(anchors).size).toBe(anchors.length);
  });
});
