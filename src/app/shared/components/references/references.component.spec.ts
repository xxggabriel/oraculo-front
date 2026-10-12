import { Component, Input, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Evidence } from "../../../core/search";
import {
  identity,
  reference,
} from "../publication-text/reference-test-fixtures";
import { referenceAnchor } from "../publication-text/reference-segments";
import { PublicationTextComponent } from "../publication-text/publication-text.component";
import { PublicationReferencesComponent } from "./references.component";
import template from "./references.component.html?raw";

@Component({ selector: "app-evidence-list", standalone: true, template: "" })
class EvidenceStub {
  @Input() evidence: readonly Evidence[] = [];
}

@Component({
  selector: "app-publication-content",
  standalone: true,
  template: "{{ text }}",
})
class ContentStub {
  @Input() text = "";
  @Input() decorations: readonly unknown[] = [];
  @Input() baseHref = "";
  @Input() anchorNamespace = "publication";
}

@Component({
  selector: "app-loading-skeleton",
  standalone: true,
  template: "{{ label }}",
})
class SkeletonStub {
  @Input() label = "";
}

afterEach(() => TestBed.resetTestingModule());
describe("PublicationReferencesComponent", () => {
  it("apresenta destino focável, destaca a menção e mantém auditoria recolhida", () => {
    TestBed.overrideComponent(PublicationReferencesComponent, {
      set: { template, imports: [EvidenceStub, ContentStub, SkeletonStub] },
    });
    const fixture = TestBed.createComponent(PublicationReferencesComponent);
    const ref = reference(
      "art. 5/CF 😀",
      [{ start: 2, end: 8, surface: "art. 5" }],
      "normative_reference",
    );
    Object.assign(fixture.componentInstance, {
      text: signal("😀 art. 5"),
      identity: signal(identity),
      references: signal([ref]),
      baseHref: signal("/publicacoes/publication?q=dano"),
      activeReference: signal(referenceAnchor(ref)),
    });
    const navigate = vi.fn();
    fixture.componentInstance.anchorActivated.subscribe(navigate);
    fixture.detectChanges();
    const article = fixture.nativeElement.querySelector(
      "article",
    ) as HTMLElement;
    expect(article.id).toBe(referenceAnchor(ref));
    expect(article.getAttribute("tabindex")).toBe("-1");
    expect(article.classList.contains("bg-brand-50")).toBe(true);
    expect(article.querySelector("details")?.open).toBe(false);
    expect(article.querySelector("h3")?.textContent).toContain("art. 5");
    expect(article.querySelector("mark")?.textContent).toBe("art. 5");
    const link = article.querySelector("a") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe(
      "/publicacoes/publication?q=dano#publication-fragment-2-8",
    );
    expect(
      decodeURIComponent(
        new URL(
          `/publicacoes/publication?q=dano#${encodeURIComponent(article.id)}`,
          "http://localhost",
        ).hash.slice(1),
      ),
    ).toBe(article.id);
    link.click();
    expect(navigate).toHaveBeenCalledWith("publication-fragment-2-8");
  });
  it("preserva referências sem vínculo verificável e não oferece retorno para evidência de outra revisão", () => {
    TestBed.overrideComponent(PublicationReferencesComponent, {
      set: { template, imports: [EvidenceStub, ContentStub, SkeletonStub] },
    });
    const fixture = TestBed.createComponent(PublicationReferencesComponent);
    const ref = reference("stale", [
      { start: 0, end: 1, surface: "a", revisionId: "old" },
    ]);
    Object.assign(fixture.componentInstance, {
      text: signal("abc"),
      identity: signal(identity),
      references: signal([ref, ref]),
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll("article")).toHaveLength(1);
    expect(fixture.nativeElement.querySelector("a")).toBeNull();
    expect(fixture.nativeElement.textContent).toContain("stale");
    expect(fixture.nativeElement.querySelector("mark")).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      "Não foi possível localizar esta menção",
    );
  });
});

it("volta à ocorrência que abriu a referência, inclusive menções repetidas", () => {
  TestBed.overrideComponent(PublicationReferencesComponent, {
    set: { template, imports: [EvidenceStub, ContentStub, SkeletonStub] },
  });
  const fixture = TestBed.createComponent(PublicationReferencesComponent);
  const ref = reference("law", [
    { start: 0, end: 6, surface: "art. 5" },
    { start: 9, end: 15, surface: "art. 5" },
  ]);
  Object.assign(fixture.componentInstance, {
    text: signal("art. 5 / art. 5"),
    identity: signal(identity),
    references: signal([ref]),
    sourceAnchor: signal("publication-fragment-9-15"),
  });
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelector("a").getAttribute("href")).toBe(
    "#publication-fragment-9-15",
  );
  expect(fixture.componentInstance.context(ref)?.before).toBe("art. 5 / ");
});

it("isola headings, regiões, trechos e destinos entre duas instâncias na mesma página", () => {
  TestBed.overrideComponent(PublicationTextComponent, {
    set: { imports: [ContentStub] },
  });
  TestBed.overrideComponent(PublicationReferencesComponent, {
    set: { template, imports: [EvidenceStub, ContentStub, SkeletonStub] },
  });
  const ref = reference("same", [{ start: 0, end: 1, surface: "a" }]);
  const ids: string[] = [];
  for (const namespace of ["first", "second"]) {
    for (const component of [
      PublicationTextComponent,
      PublicationReferencesComponent,
    ]) {
      const fixture =
        component === PublicationTextComponent
          ? TestBed.createComponent(PublicationTextComponent)
          : TestBed.createComponent(PublicationReferencesComponent);
      Object.assign(fixture.componentInstance, {
        text: signal("abc"),
        identity: signal(identity),
        references: signal([ref]),
        anchorNamespace: signal(namespace),
      });
      fixture.detectChanges();
      ids.push(
        ...[...fixture.nativeElement.querySelectorAll("[id]")].map(
          (element: Element) => element.id,
        ),
      );
      const heading = fixture.nativeElement.querySelector("h2") as HTMLElement;
      const region = fixture.nativeElement.querySelector(
        "[aria-labelledby]",
      ) as HTMLElement;
      expect(region.getAttribute("aria-labelledby")).toBe(heading.id);
    }
  }
  expect(new Set(ids).size).toBe(ids.length);
});

it("mantém destinos distintos quando famílias diferentes usam o mesmo ID", () => {
  TestBed.overrideComponent(PublicationReferencesComponent, {
    set: { template, imports: [EvidenceStub, ContentStub, SkeletonStub] },
  });
  const fixture = TestBed.createComponent(PublicationReferencesComponent);
  const citation = reference(
    "same",
    [{ start: 0, end: 1, surface: "a" }],
    "citation",
  );
  const normative = {
    ...reference("same", [{ start: 1, end: 2, surface: "b" }], "normative"),
    key: "normative-key",
  };
  const references = signal([citation, normative]);
  const warnings = vi.spyOn(console, "warn");
  try {
    Object.assign(fixture.componentInstance, {
      text: signal("abc"),
      identity: signal(identity),
      references,
    });
    fixture.detectChanges();
    references.set([normative, citation]);
    fixture.detectChanges();
    const articles = [
      ...fixture.nativeElement.querySelectorAll("article"),
    ] as HTMLElement[];
    expect(articles.map((article) => article.id)).toEqual([
      referenceAnchor(normative),
      referenceAnchor(citation),
    ]);
    expect(articles[0]!.querySelector("h3")?.textContent).toContain("b");
    expect(articles[0]!.querySelector("details")?.textContent).toContain(
      "normative-key",
    );
    expect(
      warnings.mock.calls.some((call) =>
        call.some((value) => String(value).includes("NG0955")),
      ),
    ).toBe(false);
  } finally {
    warnings.mockRestore();
  }
});

it("apresenta menção HTML como texto visível e conserva fonte original nos detalhes", () => {
  TestBed.overrideComponent(PublicationReferencesComponent, {
    set: { template, imports: [EvidenceStub, ContentStub, SkeletonStub] },
  });
  const fixture = TestBed.createComponent(PublicationReferencesComponent);
  const surface = "<b>Art. 5 &amp; CF</b>";
  const source = `<p>Antes ${surface} depois.</p>`;
  const start = Array.from(source.slice(0, source.indexOf(surface))).length;
  const ref = reference(
    "norm:cf:5",
    [{ start, end: start + Array.from(surface).length, surface }],
    "normative",
  );
  Object.assign(fixture.componentInstance, {
    text: signal(source),
    identity: signal(identity),
    references: signal([ref]),
  });
  fixture.detectChanges();
  const article = fixture.nativeElement.querySelector("article") as HTMLElement;
  expect(article.querySelector("h3")?.textContent?.trim()).toBe("Art. 5 & CF");
  expect(article.querySelector("mark")?.textContent).toBe("Art. 5 & CF");
  expect(article.querySelector("blockquote")?.textContent).not.toContain("<b>");
  expect(article.querySelector("details")?.textContent).toContain(surface);
  expect(article.querySelector("details")?.textContent).toContain("norm:cf:5");
  expect(ref.evidence[0]?.start).toBe(start);
  expect(ref.surface).toBe(surface);
});

it("retorna à parte HTML clicada da segunda ocorrência e usa o contexto da ocorrência original", () => {
  TestBed.overrideComponent(PublicationReferencesComponent, {
    set: { template, imports: [EvidenceStub, ContentStub, SkeletonStub] },
  });
  const fixture = TestBed.createComponent(PublicationReferencesComponent);
  const surface = "Art. <b>5</b>";
  const source = `Primeira ${surface}; segunda ${surface}; fim.`;
  const first = Array.from(source.slice(0, source.indexOf(surface))).length;
  const second = Array.from(
    source.slice(0, source.lastIndexOf(surface)),
  ).length;
  const length = Array.from(surface).length;
  const ref = reference(
    "repeated-html",
    [
      { start: first, end: first + length, surface },
      { start: second, end: second + length, surface },
    ],
    "normative",
  );
  const anchor = `publication-fragment-${second}-${second + length}-part-1`;
  Object.assign(fixture.componentInstance, {
    text: signal(source),
    identity: signal(identity),
    references: signal([ref]),
    sourceAnchor: signal(anchor),
  });
  fixture.detectChanges();
  expect(fixture.componentInstance.backAnchor(ref)).toBe(anchor);
  expect(fixture.nativeElement.querySelector("a").getAttribute("href")).toBe(
    "#" + anchor,
  );
  expect(fixture.componentInstance.context(ref)?.mention).toBe("Art. 5");
  expect(fixture.componentInstance.context(ref)?.before).toBe(
    "Primeira Art. 5; segunda ",
  );
});

it.each([
  { source: '<p title="Art. 5">Texto visível</p>', surface: "Art. 5" },
  { source: "<script>Art. 5</script><p>Texto visível</p>", surface: "Art. 5" },
])(
  "não oferece destino inexistente para referência removida de $source",
  ({ source, surface }) => {
    TestBed.overrideComponent(PublicationReferencesComponent, {
      set: { template, imports: [EvidenceStub, ContentStub, SkeletonStub] },
    });
    const fixture = TestBed.createComponent(PublicationReferencesComponent);
    const start = Array.from(source.slice(0, source.indexOf(surface))).length;
    const ref = reference(
      "invisible",
      [{ start, end: start + Array.from(surface).length, surface }],
      "normative",
    );
    Object.assign(fixture.componentInstance, {
      text: signal(source),
      identity: signal(identity),
      references: signal([ref]),
      sourceAnchor: signal(
        `publication-fragment-${start}-${start + Array.from(surface).length}`,
      ),
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.backAnchor(ref)).toBeNull();
    expect(fixture.componentInstance.context(ref)).toBeNull();
    expect(fixture.nativeElement.querySelector("a")).toBeNull();
    expect(fixture.nativeElement.querySelector("mark")).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain(
      "Ver no texto da publicação",
    );
    expect(
      fixture.nativeElement.querySelector("details").textContent,
    ).toContain("invisible");
    expect(ref.evidence[0]?.start).toBe(start);
  },
);

it("mostra cinco referências e expande em páginas de dez, reiniciando ao mudar a publicação", () => {
  TestBed.overrideComponent(PublicationReferencesComponent, {
    set: { template, imports: [EvidenceStub, ContentStub, SkeletonStub] },
  });
  const fixture = TestBed.createComponent(PublicationReferencesComponent);
  const refs = Array.from({ length: 23 }, (_, index) =>
    reference(`ref-${index}`, []),
  );
  const currentIdentity = signal(identity);
  const references = signal(refs);
  Object.assign(fixture.componentInstance, {
    text: signal("abc"),
    identity: currentIdentity,
    references,
  });
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelectorAll("article")).toHaveLength(5);
  fixture.nativeElement.querySelector("button").click();
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelectorAll("article")).toHaveLength(15);
  expect(fixture.nativeElement.querySelector("button").textContent).toContain(
    "mais 8",
  );
  fixture.nativeElement.querySelector("button").click();
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelectorAll("article")).toHaveLength(23);
  expect(fixture.nativeElement.querySelector("button")).toBeNull();
  currentIdentity.set({ ...identity, id: "another" });
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelectorAll("article")).toHaveLength(5);
  fixture.nativeElement.querySelector("button").click();
  fixture.detectChanges();
  references.set([...refs]);
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelectorAll("article")).toHaveLength(5);
});

it("revela a página da referência profunda ativa mantendo o destino focável", () => {
  TestBed.overrideComponent(PublicationReferencesComponent, {
    set: { template, imports: [EvidenceStub, ContentStub, SkeletonStub] },
  });
  const fixture = TestBed.createComponent(PublicationReferencesComponent);
  const refs = Array.from({ length: 28 }, (_, index) =>
    reference(`ref-${index}`, []),
  );
  const activeReference = signal<string | null>(null);
  Object.assign(fixture.componentInstance, {
    text: signal("abc"),
    identity: signal(identity),
    references: signal(refs),
    activeReference,
  });
  fixture.detectChanges();
  activeReference.set(referenceAnchor(refs[21]!));
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelectorAll("article")).toHaveLength(25);
  const target = [...fixture.nativeElement.querySelectorAll("article")].find(
    (article: HTMLElement) => article.id === referenceAnchor(refs[21]!),
  ) as HTMLElement;
  expect(target.getAttribute("tabindex")).toBe("-1");
  target.focus();
  expect(document.activeElement).toBe(target);
  fixture.nativeElement.querySelector("button").click();
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelectorAll("article")).toHaveLength(28);
});

it("exibe skeleton sem estado vazio nem referências enquanto carrega", () => {
  TestBed.overrideComponent(PublicationReferencesComponent, {
    set: { template, imports: [EvidenceStub, ContentStub, SkeletonStub] },
  });
  const fixture = TestBed.createComponent(PublicationReferencesComponent);
  const loading = signal(true);
  Object.assign(fixture.componentInstance, {
    text: signal(""),
    identity: signal(identity),
    references: signal([]),
    loading,
  });
  fixture.detectChanges();
  expect(
    fixture.nativeElement.querySelector("app-loading-skeleton"),
  ).not.toBeNull();
  expect(
    fixture.nativeElement.querySelector("section").getAttribute("aria-busy"),
  ).toBe("true");
  expect(fixture.nativeElement.textContent).not.toContain("Nenhuma referência");
  loading.set(false);
  fixture.detectChanges();
  expect(
    fixture.nativeElement.querySelector("app-loading-skeleton"),
  ).toBeNull();
  expect(fixture.nativeElement.textContent).toContain("Nenhuma referência");
});
