import { Publication } from "./search";

export type RelatedReason = "same_process" | "similar_text" | "same_court_type";
export interface RelatedPublication {
  readonly publication: Publication;
  readonly reason: RelatedReason;
}
export interface RelatedPublications {
  readonly publicationId: string;
  readonly items: readonly RelatedPublication[];
  readonly strategy: string;
  readonly strategyVersion: string;
  readonly consistency: string;
  readonly warnings: readonly string[];
}
export interface RelatedPublicationsGateway {
  related(id: string, signal: AbortSignal): Promise<RelatedPublications>;
}
