import { describe, expect, it, vi } from "vitest";
import { HttpSearchGateway, snippetParts } from "./http-search.gateway";
import { initialCriteria } from "../core/search";
import { validateSearchRequest } from "../../../contracts/generated/validators.js";
import { ReferenceQuery } from "../core/jurimetry";
import { referenceReport } from "../../../tests/jurimetry-fixtures";
import { testDetail } from "../../../tests/related-fixtures";
import { judicialDistribution } from "../../../tests/judicial-fixtures";
describe("HTTP boundary e contrato gerado", () => {
  it("mapeia metadados do detalhe e aceita respostas legadas sem esses campos", async () => {
    const detail = testDetail("pub-001");
    const metadata = {
      rapporteur: "Maria Silva",
      organName: "2ª Câmara",
      className: "Apelação",
      documentType: "Acórdão",
      instanceDegree: "2º grau",
      rapporteurStatus: "available",
      instanceDegreeStatus: "available",
    };
    const body = {
      ...detail,
      publication: {
        id: detail.publication.id,
        revisionId: detail.publication.revision,
        textVersionId: detail.publication.textVersion,
        court: "TJGO",
        documentType: "acórdão",
        publicationDate: "2026-10-08",
        availabilityDate: null,
        sourceDate: null,
        processes: [],
        snippets: [],
        score: null,
      },
    };
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...body, metadata }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(body), { status: 200 }),
      );
    const gateway = new HttpSearchGateway("/api/v1", transport);
    expect(
      (await gateway.detail("pub-001", new AbortController().signal)).metadata,
    ).toEqual(metadata);
    expect(
      (await gateway.detail("pub-001", new AbortController().signal)).metadata,
    ).toBeNull();
  });
  it("recusa uma publicidade inválida antes de consultar a API", async () => {
    const transport = vi.fn<typeof fetch>();
    const gateway = new HttpSearchGateway("/api/v1", transport);
    await expect(
      gateway.search(
        { ...initialCriteria, visibility: "wrong" as "public" },
        null,
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(transport).not.toHaveBeenCalled();
  });
  it("valida o request real e não permite chaves desconhecidas", () => {
    expect(
      validateSearchRequest({
        criteria: initialCriteria,
        pageSize: 10,
        cursor: null,
      }),
    ).toBe(true);
    expect(
      validateSearchRequest({
        criteria: { ...initialCriteria, arbitraryField: "secret" },
        pageSize: 10,
      }),
    ).toBe(false);
  });
  it("rejeita resposta inválida antes de entrar no domínio", async () => {
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify({ items: [], total: 0 }), { status: 200 }),
      );
    const gateway = new HttpSearchGateway("/api/v1", transport);
    await expect(
      gateway.search(initialCriteria, null, new AbortController().signal),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });
  it("preserva erro tipado e requestId", async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "CURSOR_EXPIRED",
          message: "Sessão expirada.",
          requestId: "req1",
          validation: [],
        }),
        { status: 410 },
      ),
    );
    await expect(
      new HttpSearchGateway("/api/v1", transport).search(
        initialCriteria,
        "cursor",
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ code: "CURSOR_EXPIRED", requestId: "req1" });
  });
  it("constrói segmentos de texto seguros e offsets Unicode em pontos de código", () => {
    const text = "⚖️ 😀 <script>alert(1)</script> mérito";
    const start = Array.from(text).findIndex((_, i, a) =>
      a.slice(i).join("").startsWith("mérito"),
    );
    const parts = snippetParts({
      text,
      highlights: [{ start, end: start + 6 }],
    });
    expect(parts.map((p) => p.text).join("")).toBe(text);
    expect(parts.filter((p) => p.highlighted).map((p) => p.text)).toEqual([
      "mérito",
    ]);
    expect(parts[0].text).toContain("<script>");
  });
  it("descarta spans inválidos ou sobrepostos sem perder texto", () => {
    const parts = snippetParts({
      text: "abcdef",
      highlights: [
        { start: 1, end: 3 },
        { start: 2, end: 4 },
        { start: 5, end: 9 },
      ],
    });
    expect(parts.map((p) => p.text).join("")).toBe("abcdef");
    expect(parts.filter((p) => p.highlighted)).toEqual([
      { text: "bc", highlighted: true },
    ]);
  });
});
describe("Contrato da jurimetria por referências", () => {
  const query: ReferenceQuery = {
    criteria: initialCriteria,
    references: "both",
    includeProposals: false,
    pageSize: 10,
    page: 0,
  };
  function response(population = 1) {
    const { publications: _publications, ...report } =
      referenceReport(population);
    void _publications;
    return {
      ...report,
      items: [],
      total: { value: population, relation: "eq" },
      references: "both",
      includeProposals: false,
    };
  }
  it("recebe a hierarquia completa independente da página e recusa partições inconsistentes", async () => {
    const distribution = judicialDistribution();
    const body = { ...response(6), judicialDistribution: distribution };
    const invalid = {
      ...body,
      judicialDistribution: {
        ...distribution,
        courts: [
          { ...distribution.courts[0], publications: 3 },
          ...distribution.courts.slice(1),
        ],
      },
    };
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(body), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(invalid), { status: 200 }),
      );
    const gateway = new HttpSearchGateway("/api/v1", transport);
    expect(
      (await gateway.queryReferences(query, new AbortController().signal))
        .judicialDistribution,
    ).toEqual(distribution);
    await expect(
      gateway.queryReferences(query, new AbortController().signal),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });
  it("envia condições tipadas e mapeia um resultado validado pelo schema", async () => {
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify(response()), { status: 200 }),
      );
    const gateway = new HttpSearchGateway("/api/v1", transport);
    const report = await gateway.queryReferences(
      query,
      new AbortController().signal,
    );
    expect(transport.mock.calls[0][0]).toBe(
      "/api/v1/jurimetry/references/query",
    );
    expect(
      JSON.parse(transport.mock.calls[0][1]!.body as string),
    ).toMatchObject({ references: "both", includeProposals: false, page: 0 });
    expect(report).toMatchObject({
      population: 1,
      references: "both",
      presence: { jurisprudentialOnly: 1 },
    });
  });
  it("rejeita população e grupos inconsistentes mesmo quando o JSON satisfaz o schema", async () => {
    const data = response();
    data.presence.both = 10;
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify(data), { status: 200 }));
    await expect(
      new HttpSearchGateway("/api/v1", transport).queryReferences(
        query,
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });
  it("aceita contagens exatas acima de mil e paginação após a página mil", async () => {
    const data = { ...response(25001), page: 1001, hasMore: true };
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify(data), { status: 200 }));
    const report = await new HttpSearchGateway(
      "/api/v1",
      transport,
    ).queryReferences({ ...query, page: 1001 }, new AbortController().signal);
    expect(report).toMatchObject({
      population: 25001,
      page: 1001,
      candidateLimit: null,
    });
    expect(JSON.parse(transport.mock.calls[0][1]!.body as string).page).toBe(
      1001,
    );
  });
});

describe("Contrato das publicações relacionadas", () => {
  function response(ids = ["candidate"]) {
    return {
      publicationId: "origin",
      items: ids.map((id) => ({
        reason: "similar_text",
        publication: {
          id,
          revisionId: `${id}-rev`,
          textVersionId: `${id}-text`,
          court: "TJGO",
          documentType: "sentença",
          publicationDate: null,
          availabilityDate: null,
          sourceDate: null,
          processes: [],
          score: null,
          snippets: [
            { text: "😀 tema relacionado", highlights: [{ start: 2, end: 6 }] },
          ],
        },
      })),
      strategy: "process_text_metadata",
      strategyVersion: "1",
      consistency: "projection_snapshot",
      warnings: [],
    };
  }
  it("consulta o endpoint próprio e mapeia sugestões com highlights seguros", async () => {
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify(response()), { status: 200 }),
      );
    const signal = new AbortController().signal;
    const result = await new HttpSearchGateway("/api/v1", transport).related(
      "origin",
      signal,
    );
    expect(transport).toHaveBeenCalledWith(
      "/api/v1/publications/origin/related",
      expect.objectContaining({ method: "GET", signal }),
    );
    expect(result.items[0].publication.revision).toBe("candidate-rev");
    expect(result.items[0].publication.snippets[0]).toContainEqual({
      text: "tema",
      highlighted: true,
    });
  });
  it.each(["origin", "duplicate", "wrong-source", "too-many"])(
    "rejeita sugestões inconsistentes: %s",
    async (kind) => {
      const data = response(
        kind === "origin"
          ? ["origin"]
          : kind === "duplicate"
            ? ["candidate", "candidate"]
            : kind === "too-many"
              ? ["a", "b", "c", "d", "e"]
              : ["candidate"],
      );
      if (kind === "wrong-source") data.publicationId = "other";
      const transport = vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(JSON.stringify(data), { status: 200 }));
      await expect(
        new HttpSearchGateway("/api/v1", transport).related(
          "origin",
          new AbortController().signal,
        ),
      ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
    },
  );
});

describe("Contrato da timeline do processo", () => {
  const cnj = "00012345120248090001";
  const query = { cnj: null, page: 0, pageSize: 20 as const };
  function response() {
    return {
      publicationId: "source",
      processLinkPolicy: "canonical_primary",
      processes: [cnj],
      selectedProcess: cnj,
      page: 0,
      pageSize: 20,
      items: ["a", "b"].map((id, i) => ({
        id,
        revisionId: id + "-r",
        textVersionId: id + "-t",
        court: "TJGO",
        documentType: "sentenca",
        publicationDate: i ? null : "2026-10-08",
        availabilityDate: null,
        sourceDate: null,
        processes: [cnj],
        snippets: [],
        score: null,
      })),
      total: { value: 2, relation: "eq" },
      hasMore: false,
      truncated: false,
      consistency: "projection_snapshot",
      warnings: [],
    };
  }
  it("envia a consulta própria e valida ordem cronológica com nulos ao final", async () => {
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify(response()), { status: 200 }),
      );
    const result = await new HttpSearchGateway("/api/v1", transport).timeline(
      "source",
      query,
      new AbortController().signal,
    );
    expect(transport.mock.calls[0][0]).toBe(
      "/api/v1/publications/source/timeline/query",
    );
    expect(result.publications.map((p) => p.id)).toEqual(["a", "b"]);
  });
  it.each(["source", "page", "process", "order", "duplicate"])(
    "rejeita resposta semanticamente inválida: %s",
    async (kind) => {
      const data = response();
      if (kind === "source") data.publicationId = "another";
      if (kind === "page") data.page = 1;
      if (kind === "process") data.selectedProcess = "00099991120248090001";
      if (kind === "order") data.items.reverse();
      if (kind === "duplicate") data.items[1] = data.items[0];
      const transport = vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(JSON.stringify(data), { status: 200 }));
      await expect(
        new HttpSearchGateway("/api/v1", transport).timeline(
          "source",
          query,
          new AbortController().signal,
        ),
      ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
    },
  );
});
