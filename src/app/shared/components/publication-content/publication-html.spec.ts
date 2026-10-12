import { describe, expect, it } from "vitest";
import {
  parsePublicationHtml,
  publicationPlainText,
  type ContentText,
  type PublicationContentNode,
} from "./publication-html";

function textNodes(nodes: readonly PublicationContentNode[]): ContentText[] {
  const result: ContentText[] = [];
  const pending = [...nodes].reverse();
  while (pending.length) {
    const node = pending.pop();
    if (node?.kind === "text") result.push(node);
    else if (node?.kind === "element") {
      for (let i = node.children.length - 1; i >= 0; i--)
        pending.push(node.children[i]);
    }
  }
  return result;
}
function raw(source: string, node: ContentText): string {
  return Array.from(source).slice(node.start, node.end).join("");
}

describe("parser de conteúdo passivo com posições do source original", () => {
  it("preserva center e marcação tipográfica sem copiar atributos", () => {
    const source =
      '<center id="origem" style="color:red" onclick="evil()"><h2>Decisão</h2><p>Pedido <strong>deferido</strong>.</p></center>';
    const nodes = parsePublicationHtml(source);
    expect(nodes[0]).toMatchObject({
      kind: "element",
      tag: "center",
      href: null,
    });
    expect(publicationPlainText(source)).toBe("Decisão\nPedido deferido.");
    const encoded = JSON.stringify(nodes);
    expect(encoded).not.toMatch(/origem|color:red|onclick|evil/);
    for (const node of textNodes(nodes))
      expect(raw(source, node)).toBe(node.text);
  });
  it("lê texto puro e comparações com menor que sem tratá-las como tags", () => {
    const source = "😀 Valor <3 e 2 < 4; assunto & termos. > fim";
    const texts = textNodes(parsePublicationHtml(source));
    expect(texts.map((node) => node.text).join("")).toBe(source);
    expect(publicationPlainText(source)).toBe(source);
    for (const node of texts) expect(raw(source, node)).toBe(node.text);
  });
  it("mantém entidades separadas e ranges brutos integrais em Unicode", () => {
    const source = "😀<p>A&amp;B &#x1F600; &lt; &#233;</p>";
    const texts = textNodes(parsePublicationHtml(source));
    expect(texts.map((node) => node.text).join("")).toBe("😀A&B 😀 < é");
    expect(texts.find((node) => node.text === "&")).toEqual({
      kind: "text",
      text: "&",
      start: 5,
      end: 10,
    });
    expect(
      texts
        .filter((node) => node.text === "😀")
        .map((node) => raw(source, node)),
    ).toEqual(["😀", "&#x1F600;"]);
    expect(texts.find((node) => node.text === "<")?.end).toBeGreaterThan(
      texts.find((node) => node.text === "<")?.start ?? 0,
    );
    expect(
      texts.find((node) => node.text === "é") &&
        raw(
          source,
          texts.find((node) => node.text === "é")!,
        ),
    ).toBe("&#233;");
  });
  it("reúne somente os dois callbacks de uma entidade composta no mesmo range", () => {
    const source = "😀X&NotEqualTilde;Y";
    expect(textNodes(parsePublicationHtml(source))).toEqual([
      { kind: "text", text: "😀X", start: 0, end: 2 },
      { kind: "text", text: "≂̸", start: 2, end: 17 },
      { kind: "text", text: "Y", start: 17, end: 18 },
    ]);
    expect(publicationPlainText(source)).toBe("😀X≂̸Y");
  });
  it("preserva aninhamento válido e texto em HTML malformado e tags órfãs", () => {
    const source =
      "</div><p>Um<strong>dois</p>três</strong><br>quatro<hr>cinco";
    expect(publicationPlainText(source)).toBe("Umdois\ntrês\nquatro\ncinco");
    const nodes = parsePublicationHtml(source);
    expect(nodes[0]).toMatchObject({
      kind: "element",
      tag: "p",
      children: [
        { kind: "text", text: "Um" },
        { kind: "element", tag: "strong" },
      ],
    });
    expect(nodes.some((node) => node.kind === "break")).toBe(true);
    expect(nodes.some((node) => node.kind === "rule")).toBe(true);
    for (const node of textNodes(nodes))
      expect(raw(source, node)).toBe(node.text);
  });
  it("adiciona separadores de parágrafos, listas, linhas e células de tabela", () => {
    const source =
      "<p>Um</p><p>Dois</p><ul><li>Três</li><li>Quatro</li></ul><table><tr><th>Tipo</th><th>Total</th></tr><tr><td>A</td><td>2</td></tr></table>Fim";
    expect(publicationPlainText(source)).toBe(
      "Um\nDois\nTrês\nQuatro\nTipo Total \nA 2 \nFim",
    );
    expect(
      publicationPlainText("<pre>  Primeiro\n    Segundo  </pre>"),
    ).toContain("Primeiro\n    Segundo");
    expect(publicationPlainText("a<br><br>b")).toBe("a\n\nb");
  });
  it("remove subárvores ativas, mídia e comentários, desarma wrappers desconhecidos", () => {
    const source =
      '<head><title>oculto</title></head><script>alert(1)</script><style>body{display:none}</style><iframe><p>iframe</p></iframe><object>object</object><embed src="/tracking"><svg><text>svg</text></svg><math><mi>math</mi></math><template>template</template><noscript>noscript</noscript><audio>audio</audio><video>video</video><picture><img src="https://tracker/secret"></picture><input value="secret"><!-- comentário --><form action="/send"><custom-element id="secret">Texto <b>legal</b></custom-element></form>';
    const nodes = parsePublicationHtml(source);
    expect(publicationPlainText(source)).toBe("Texto legal");
    expect(JSON.stringify(nodes)).not.toMatch(
      /oculto|alert|display|iframe|object|tracking|svg|math|template|noscript|audio|video|tracker|secret|send|comentário/,
    );
  });
  it("mantém apenas href HTTP(S) absoluto sem credenciais e remove links inseguros", () => {
    const source =
      '<a href="https://example.org/document?q=a&amp;b=2" onclick="evil()" target="_blank" rel="opener">Seguro</a><a href="http://example.org">HTTP</a><a href="javascript:alert(1)">JS</a><a href="data:text/html,a">Data</a><a href="//example.org">Relativo</a><a href="/local">Local</a><a href="https://user:pass@example.org">Credenciais</a><a href="https://user@example.org">Usuário</a><a href="mailto:a@example.org">Mail</a><a>Sem href</a>';
    const nodes = parsePublicationHtml(source);
    const links = nodes.filter(
      (node) => node.kind === "element" && node.tag === "a",
    );
    expect(links).toHaveLength(2);
    expect(links[0]).toEqual({
      kind: "element",
      tag: "a",
      href: "https://example.org/document?q=a&b=2",
      children: [{ kind: "text", text: "Seguro", start: 97, end: 103 }],
    });
    expect(publicationPlainText(source)).toBe(
      "SeguroHTTPJSDataRelativoLocalCredenciaisUsuárioMailSem href",
    );
    expect(JSON.stringify(nodes)).not.toMatch(
      /onclick|target|opener|javascript:|user:pass/,
    );
  });
  it("limita a árvore renderizável sem perder texto em profundidade extrema", () => {
    const source =
      "<span>".repeat(2000) + "Texto 😀 preservado" + "</span>".repeat(2000);
    const nodes = parsePublicationHtml(source);
    let depth = 0;
    let descendants = nodes;
    while (descendants[0]?.kind === "element") {
      depth++;
      descendants = descendants[0].children;
    }
    expect(depth).toBe(128);
    expect(publicationPlainText(source)).toBe("Texto 😀 preservado");
    const text = textNodes(nodes)[0];
    expect(raw(source, text)).toBe("Texto 😀 preservado");
  });
  it("preserva só números/enums delimitados para listas e células", () => {
    const nodes = parsePublicationHtml(
      '<ol start="-2" type="A" style="x" onclick="evil()"><li>Primeiro</li></ol><table><tr><td colspan="2" rowspan="100" id="origem">A</td><th colspan="101" rowspan="0">B</th></tr></table><ol start="1000001" type="javascript:evil()"><li>C</li></ol>',
    );
    expect(nodes[0]).toMatchObject({
      kind: "element",
      tag: "ol",
      orderedStart: -2,
      orderedType: "A",
    });
    const pending = [...nodes];
    const cells: PublicationContentNode[] = [];
    while (pending.length) {
      const node = pending.pop();
      if (node?.kind === "element") {
        if (node.tag === "td" || node.tag === "th") cells.push(node);
        pending.push(...node.children);
      }
    }
    expect(
      cells.find((node) => node.kind === "element" && node.tag === "td"),
    ).toMatchObject({ colSpan: 2, rowSpan: 100 });
    const header = cells.find(
      (node) => node.kind === "element" && node.tag === "th",
    );
    expect(header).not.toHaveProperty("colSpan");
    expect(header).not.toHaveProperty("rowSpan");
    expect(nodes[2]).not.toHaveProperty("orderedStart");
    expect(nodes[2]).not.toHaveProperty("orderedType");
    expect(JSON.stringify(nodes)).not.toMatch(
      /javascript|onclick|evil|style|origem/,
    );
  });
  it.each([
    '<a href="https://a.example">A<a href="https://b.example">B</a>C</a>',
    '<a href="https://a.example">A<span><unknown><a href="https://b.example">B</a></unknown></span>C</a>',
  ])("desarma âncoras internas sem alterar texto ou posições: %s", (source) => {
    const nodes = parsePublicationHtml(source);
    expect(publicationPlainText(source)).toBe("ABC");
    expect(
      textNodes(nodes)
        .map((node) => node.text)
        .join(""),
    ).toBe("ABC");
    for (const node of textNodes(nodes))
      expect(raw(source, node)).toBe(node.text);
    const pending = nodes.map((node) => ({ node, insideLink: false }));
    let linkCount = 0;
    while (pending.length) {
      const step = pending.pop();
      if (step?.node.kind !== "element") continue;
      const link = step.node.tag === "a" && step.node.href !== null;
      if (link) {
        expect(step.insideLink).toBe(false);
        linkCount++;
      }
      for (const child of step.node.children)
        pending.push({ node: child, insideLink: step.insideLink || link });
    }
    expect(linkCount).toBe(1);
    expect(nodes[0]).toMatchObject({
      kind: "element",
      tag: "a",
      href: "https://a.example/",
    });
    expect(JSON.stringify(nodes)).not.toContain("https://b.example");
  });
  it("restaura âncoras válidas depois de fechar a externa e dentro de wrappers inseguros", () => {
    const source =
      '<a href="https://a.example">A<a href="https://b.example">B</a>C</a><a href="https://c.example">D</a><a href="javascript:evil()"><a href="https://d.example">E</a></a>';
    const nodes = parsePublicationHtml(source);
    const links = nodes.filter(
      (node) => node.kind === "element" && node.tag === "a",
    );
    expect(
      links.map((node) => (node.kind === "element" ? node.href : null)),
    ).toEqual([
      "https://a.example/",
      "https://c.example/",
      "https://d.example/",
    ]);
    expect(publicationPlainText(source)).toBe("ABCDE");
  });
  it.each(["reversed", 'reversed=""', 'reversed="false"'])(
    "preserva a presença booleana de ol %s e a numeração de li",
    (attribute) => {
      const source = `<ol ${attribute} start="7" type="a"><li value="42">Inciso</li><li value="-2">Parágrafo</li></ol>`;
      const nodes = parsePublicationHtml(source);
      expect(nodes[0]).toMatchObject({
        kind: "element",
        tag: "ol",
        orderedStart: 7,
        orderedType: "a",
        orderedReversed: true,
        children: [
          { kind: "element", tag: "li", listValue: 42 },
          { kind: "element", tag: "li", listValue: -2 },
        ],
      });
      expect(publicationPlainText(source)).toBe("Inciso\nParágrafo");
      for (const node of textNodes(nodes))
        expect(raw(source, node)).toBe(node.text);
    },
  );
  it("não expande atributos de numeração para outras tags nem aceita valores fora do limite", () => {
    const source =
      '<ol><li value="1000001">A</li><li value="1.5">B</li><li value="javascript:evil()">C</li><li value="-1000000">D</li><li value="1000000">E</li><li value="0">F</li></ol><p reversed value="4">G</p>';
    const nodes = parsePublicationHtml(source);
    expect(nodes[0]).not.toHaveProperty("orderedReversed");
    const list = nodes[0];
    expect(list.kind).toBe("element");
    if (list.kind !== "element") throw Error("Lista ausente");
    for (const child of list.children.slice(0, 3))
      expect(child).not.toHaveProperty("listValue");
    expect(list.children[3]).toMatchObject({ listValue: -1000000 });
    expect(list.children[4]).toMatchObject({ listValue: 1000000 });
    expect(list.children[5]).toMatchObject({ listValue: 0 });
    expect(nodes[1]).not.toHaveProperty("orderedReversed");
    expect(nodes[1]).not.toHaveProperty("listValue");
    expect(JSON.stringify(nodes)).not.toContain("javascript");
  });
});
