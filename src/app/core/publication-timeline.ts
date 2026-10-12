import { Publication } from "./search";
export interface PublicationTimelineQuery {
  readonly cnj: string | null;
  readonly page: number;
  readonly pageSize: 20;
}
export interface PublicationTimeline {
  readonly processLinkPolicy:
    "canonical_primary" | "comunica_v2_legacy_metadata";
  readonly publicationId: string;
  readonly processes: readonly string[];
  readonly selectedProcess: string | null;
  readonly publications: readonly Publication[];
  readonly page: number;
  readonly pageSize: 20;
  readonly total: { readonly value: number; readonly relation: "eq" | "gte" };
  readonly hasMore: boolean;
  readonly truncated: boolean;
  readonly consistency: string;
  readonly warnings: readonly string[];
}
export interface PublicationTimelineGateway {
  timeline(
    id: string,
    query: PublicationTimelineQuery,
    signal: AbortSignal,
  ): Promise<PublicationTimeline>;
}
export function compareTimelinePublications(
  a: Publication,
  b: Publication,
): number {
  if (a.publicationDate === null && b.publicationDate !== null) return 1;
  if (b.publicationDate === null && a.publicationDate !== null) return -1;
  return (
    (a.publicationDate ?? "").localeCompare(b.publicationDate ?? "") ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}
