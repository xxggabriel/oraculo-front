import type { components } from "../../../contracts/generated/api";
import { assertJudicialDistribution } from "../core/judicial-distribution";
import * as validators from "../../../contracts/generated/validators.js";
import {
  PublicationTimelineGateway,
  PublicationTimelineQuery,
  PublicationTimeline,
  compareTimelinePublications,
} from "../core/publication-timeline";
import {
  RelatedPublicationsGateway,
  RelatedPublications,
} from "../core/related-publications";
import {
  ReferenceJurimetryGateway,
  ReferenceQuery,
  ReferenceReport,
} from "../core/jurimetry";
import {
  Analysis,
  Capabilities,
  Criteria,
  Distribution,
  Publication,
  PublicationDetail,
  SearchFailure,
  SearchGateway,
  SearchPage,
  TextPart,
} from "../core/search";
type Api = components["schemas"];
function criteriaToApi(c: Criteria): Api["Criteria"] {
  return {
    ...c,
    visibility: c.visibility ?? "both",
    courts: [...c.courts],
    documentTypes: [...c.documentTypes],
    process: c.process ? { ...c.process } : null,
  };
}
export function snippetParts(s: Api["Snippet"]): TextPart[] {
  const parts: TextPart[] = [];
  let offset = 0;
  const text = Array.from(s.text);
  for (const span of [...s.highlights].sort((a, b) => a.start - b.start)) {
    if (span.start < offset || span.end < span.start || span.end > text.length)
      continue;
    if (span.start > offset)
      parts.push({
        text: text.slice(offset, span.start).join(""),
        highlighted: false,
      });
    parts.push({
      text: text.slice(span.start, span.end).join(""),
      highlighted: true,
    });
    offset = span.end;
  }
  if (offset < text.length)
    parts.push({ text: text.slice(offset).join(""), highlighted: false });
  return parts;
}
function publication(p: Api["Summary"]): Publication {
  return {
    id: p.id,
    revision: p.revisionId,
    textVersion: p.textVersionId,
    court: p.court,
    type: p.documentType,
    publicationDate: p.publicationDate,
    availabilityDate: p.availabilityDate,
    sourceDate: p.sourceDate,
    processes: [...p.processes],
    snippets: p.snippets.map(snippetParts),
    score: p.score,
  };
}
function distribution(f: Api["Facet"]): Distribution {
  return {
    field: f.field,
    buckets: f.buckets.map((b) => ({ label: b.key, count: b.count })),
    missing: f.missing,
    truncated: f.truncated,
    approximate: f.approximate,
    countError: f.countErrorUpperBound,
    other: f.sumOtherDocCount,
  };
}
export class HttpSearchGateway
  implements
    SearchGateway,
    ReferenceJurimetryGateway,
    RelatedPublicationsGateway,
    PublicationTimelineGateway
{
  constructor(
    private readonly base = "/api/v1",
    private readonly transport: typeof fetch = (input, init) =>
      fetch(input, init),
  ) {}
  private async request<T>(
    path: string,
    body: unknown,
    validator: (v: unknown) => v is T,
    signal?: AbortSignal,
  ): Promise<T> {
    let response: Response;
    try {
      response = await this.transport(`${this.base}${path}`, {
        method: body === undefined ? "GET" : "POST",
        headers: { "Content-Type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal,
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new SearchFailure(
        "NETWORK_ERROR",
        "Não foi possível acessar a API. Tente novamente.",
      );
    }
    let value: unknown;
    try {
      value = await response.json();
    } catch {
      throw new SearchFailure(
        "INVALID_RESPONSE",
        "A API retornou uma resposta ilegível.",
      );
    }
    if (!response.ok) {
      if (validators.validateErrorResponse(value))
        throw new SearchFailure(
          value.code,
          value.message,
          value.requestId,
          value.validation.map((issue) => ({ ...issue })),
        );
      throw new SearchFailure(
        "INVALID_RESPONSE",
        "A API retornou um erro fora do contrato.",
      );
    }
    if (!validator(value))
      throw new SearchFailure(
        "INVALID_RESPONSE",
        "A resposta da API não corresponde ao contrato publicado.",
      );
    return value;
  }
  async search(
    c: Criteria,
    cursor: string | null,
    signal: AbortSignal,
    pageSize = 10,
  ): Promise<SearchPage> {
    const body: Api["SearchRequest"] = {
      criteria: criteriaToApi(c),
      pageSize,
      cursor,
    };
    if (!validators.validateSearchRequest(body))
      throw new SearchFailure("VALIDATION_ERROR", "Revise os campos da busca.");
    const r = await this.request(
      "/publications/search",
      body,
      validators.validateSearchResponse,
      signal,
    );
    return {
      publications: r.items.map(publication),
      total: r.total.value,
      totalRelation: r.total.relation,
      nextCursor: r.nextCursor,
      sessionId: r.sessionId,
      expiresAt: r.expiresAt,
      duration: r.tookMs,
      strategy: r.strategy,
      consistency: r.consistency,
      warnings: r.warnings,
    };
  }
  async facets(
    c: Criteria,
    signal: AbortSignal,
  ): Promise<readonly Distribution[]> {
    const body: Api["FacetsRequest"] = {
      criteria: criteriaToApi(c),
      fields: ["court", "documentType"],
    };
    if (!validators.validateFacetsRequest(body))
      throw new SearchFailure("VALIDATION_ERROR", "Revise os filtros.");
    return (
      await this.request(
        "/search/facets",
        body,
        validators.validateFacetsResponse,
        signal,
      )
    ).facets.map(distribution);
  }
  async analyze(c: Criteria, signal: AbortSignal): Promise<Analysis> {
    const body: Api["JurimetryRequest"] = {
      criteria: criteriaToApi(c),
      metric: "publications",
      includeProposals: false,
    };
    if (!validators.validateJurimetryRequest(body))
      throw new SearchFailure("VALIDATION_ERROR", "Revise os filtros.");
    const r = await this.request(
      "/jurimetry/query",
      body,
      validators.validateJurimetryResponse,
      signal,
    );
    return {
      state: r.state,
      population: r.population,
      numerator: r.numerator,
      denominator: r.denominator,
      value: r.value,
      distributions: r.distributions.map(distribution),
      excludedMissingDates: r.excludedMissingDates,
      dateAxis: r.dateAxis,
      missingDates: r.missingDates,
      reviewPolicy: r.reviewPolicy,
      selectionPolicy: r.selectionPolicy,
      observedAt: r.observedAt,
      warnings: r.warnings,
      consistency: r.consistency,
    };
  }
  async queryReferences(
    query: ReferenceQuery,
    signal: AbortSignal,
  ): Promise<ReferenceReport> {
    const body: Api["ReferencesJurimetryRequest"] = {
      ...query,
      criteria: criteriaToApi(query.criteria),
    };
    if (!validators.validateReferencesJurimetryRequest(body))
      throw new SearchFailure(
        "VALIDATION_ERROR",
        "Revise os filtros da jurimetria.",
      );
    const r = await this.request(
      "/jurimetry/references/query",
      body,
      validators.validateReferencesJurimetryResponse,
      signal,
    );
    const presence = r.presence;
    if (r.judicialDistribution)
      assertJudicialDistribution(r.judicialDistribution, r.population);
    if (
      r.total.relation !== "eq" ||
      r.total.value !== r.population ||
      r.totalCandidates < r.population ||
      presence.jurisprudentialOnly +
        presence.normativeOnly +
        presence.both +
        presence.neither !==
        r.population
    )
      throw new SearchFailure(
        "INVALID_RESPONSE",
        "A população e as distribuições da API não são consistentes.",
      );
    return {
      publications: r.items.map(publication),
      population: r.population,
      totalCandidates: r.totalCandidates,
      page: r.page,
      pageSize: r.pageSize,
      hasMore: r.hasMore,
      presence: { ...r.presence },
      topReferences: r.topReferences.map((reference) => ({ ...reference })),
      ...(r.judicialDistribution
        ? { judicialDistribution: r.judicialDistribution }
        : {}),
      distributions: r.distributions.map(distribution),
      criteria: {
        ...r.criteria,
        courts: [...r.criteria.courts],
        documentTypes: [...r.criteria.documentTypes],
      },
      dateAxis: r.dateAxis,
      missingDates: r.missingDates,
      references: r.references,
      includeProposals: r.includeProposals,
      observedAt: r.observedAt,
      reviewPolicy: r.reviewPolicy,
      selectionPolicy: r.selectionPolicy,
      consistency: r.consistency,
      candidateLimit: r.candidateLimit,
      warnings: [...r.warnings],
    };
  }
  async capabilities(signal: AbortSignal): Promise<Capabilities> {
    const r = await this.request(
      "/search/capabilities",
      undefined,
      validators.validateCapabilitiesResponse,
      signal,
    );
    return {
      features: r.features.map((f) => ({ ...f })),
      checkedAt: r.checkedAt,
      versions: [...r.dataVersions],
      warnings: r.warnings,
    };
  }
  async detail(id: string, signal: AbortSignal): Promise<PublicationDetail> {
    const r = await this.request(
      `/publications/${encodeURIComponent(id)}`,
      undefined,
      validators.validateDetailResponse,
      signal,
    );
    return {
      publication: publication(r.publication),
      metadata: r.metadata ? { ...r.metadata } : null,
      text: r.text,
      source: { ...r.source },
      outputs: r.outputs.map((o) => ({
        ...o,
        evidence: o.evidence.map((e) => ({ ...e })),
      })),
      references: r.references.map((ref) => ({
        ...ref,
        evidence: ref.evidence.map((e) => ({ ...e })),
      })),
      consistency: r.consistency,
      warnings: [...r.warnings],
    };
  }
  async related(id: string, signal: AbortSignal): Promise<RelatedPublications> {
    const r = await this.request(
      `/publications/${encodeURIComponent(id)}/related`,
      undefined,
      validators.validateRelatedPublicationsResponse,
      signal,
    );
    const ids = r.items.map((item) => item.publication.id);
    if (
      r.publicationId !== id ||
      ids.includes(id) ||
      new Set(ids).size !== ids.length
    )
      throw new SearchFailure(
        "INVALID_RESPONSE",
        "As publicações relacionadas não correspondem à origem consultada.",
      );
    return {
      publicationId: r.publicationId,
      items: r.items.map((item) => ({
        publication: publication(item.publication),
        reason: item.reason,
      })),
      strategy: r.strategy,
      strategyVersion: r.strategyVersion,
      consistency: r.consistency,
      warnings: [...r.warnings],
    };
  }
  async timeline(
    id: string,
    query: PublicationTimelineQuery,
    signal: AbortSignal,
  ): Promise<PublicationTimeline> {
    if (!validators.validatePublicationTimelineRequest(query))
      throw new SearchFailure(
        "INVALID_CRITERIA",
        "Consulta da linha do tempo inválida.",
      );
    const r = await this.request(
      `/publications/${encodeURIComponent(id)}/timeline/query`,
      query,
      validators.validatePublicationTimelineResponse,
      signal,
    );
    const publications = r.items.map(publication);
    const ids = publications.map((item) => item.id);
    const defaultProcess = [...r.processes].sort()[0] ?? null;
    if (
      r.publicationId !== id ||
      r.page !== query.page ||
      r.pageSize !== query.pageSize ||
      new Set(ids).size !== ids.length ||
      new Set(r.processes).size !== r.processes.length ||
      r.selectedProcess !== (query.cnj ?? defaultProcess) ||
      (r.selectedProcess !== null &&
        !r.processes.includes(r.selectedProcess)) ||
      (r.selectedProcess === null &&
        (publications.length || r.total.value || r.hasMore)) ||
      r.total.value < publications.length ||
      publications.some(
        (item, index) =>
          !item.processes.includes(r.selectedProcess ?? "") ||
          (index > 0 &&
            compareTimelinePublications(publications[index - 1], item) > 0),
      )
    )
      throw new SearchFailure(
        "INVALID_RESPONSE",
        "A linha do tempo não corresponde ao processo ou à ordem de publicação.",
      );
    return {
      publicationId: r.publicationId,
      processes: [...r.processes],
      processLinkPolicy: r.processLinkPolicy,
      selectedProcess: r.selectedProcess,
      publications,
      page: r.page,
      pageSize: r.pageSize,
      total: { ...r.total },
      hasMore: r.hasMore,
      truncated: r.truncated,
      consistency: r.consistency,
      warnings: [...r.warnings],
    };
  }
  async close(sessionId: string): Promise<void> {
    await this.request(
      "/search/sessions/close",
      { sessionId },
      validators.validateCloseSessionResponse,
    );
  }
}
