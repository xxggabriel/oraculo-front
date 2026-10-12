import { Publication, PublicationDetail } from "../src/app/core/search";
import { RelatedPublications } from "../src/app/core/related-publications";
export function testPublication(id: string): Publication {
  return {
    id,
    revision: id + "-revision",
    textVersion: id + "-text",
    court: "TJGO",
    type: "sentença",
    publicationDate: "2026-10-08",
    availabilityDate: null,
    sourceDate: null,
    processes: [],
    snippets: [
      [
        {
          text: '<script>alert("xss")</script> Tema de ' + id,
          highlighted: false,
        },
      ],
    ],
    score: null,
  };
}
export function testDetail(id: string): PublicationDetail {
  return {
    publication: testPublication(id),
    text: "Texto de " + id,
    source: {
      id: "test",
      recordId: id,
      adapterId: "test",
      adapterVersion: "1",
      schemaVersion: "2",
      projectionVersion: "2",
      observedAt: "2026-10-11T00:00:00Z",
      ingestedAt: "2026-10-11T00:00:00Z",
      textSha256: "0".repeat(64),
    },
    outputs: [],
    references: [],
    consistency: "projection_snapshot",
    warnings: [],
  };
}
export function testRelated(
  publicationId: string,
  ids: readonly string[] = ["recommendation"],
): RelatedPublications {
  return {
    publicationId,
    items: ids.map((id) => ({
      publication: testPublication(id),
      reason: "similar_text",
    })),
    strategy: "process_text_metadata",
    strategyVersion: "1",
    consistency: "projection_snapshot",
    warnings: [],
  };
}

export function testTimeline(
  publicationId: string,
  ids: readonly string[] = [publicationId],
) {
  return {
    publicationId,
    processLinkPolicy: "canonical_primary" as const,
    processes: ["00012345120248090001"],
    selectedProcess: "00012345120248090001",
    publications: ids.map((id) => ({
      ...testPublication(id),
      processes: ["00012345120248090001"],
    })),
    page: 0,
    pageSize: 20 as const,
    total: { value: ids.length, relation: "eq" as const },
    hasMore: false,
    truncated: false,
    consistency: "projection_snapshot",
    warnings: [],
  };
}
