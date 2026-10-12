export type Mode = "auto" | "lexical" | "phrase" | "cnj";
export type DateAxis = "publication" | "availability" | "source";
export type MissingDates = "include" | "exclude" | "only";
export type Sort = "relevance" | "date_desc";
export type Visibility = "public" | "restricted" | "both";
export type RankingMode = "bm25" | "rerank";
export interface Criteria {
  readonly q: string;
  readonly mode: Mode;
  readonly courts: readonly string[];
  readonly documentTypes: readonly string[];
  readonly visibility?: Visibility;
  readonly partyName?: string | null;
  readonly attorneyName?: string | null;
  readonly oabNumber?: string | null;
  readonly oabState?: string | null;
  readonly process: {
    readonly cnj: string;
    readonly relation: "any" | "publication_process" | "referenced";
  } | null;
  readonly dateAxis: DateAxis;
  readonly from: string | null;
  readonly to: string | null;
  readonly missingDates: MissingDates;
  readonly sort: Sort;
  readonly collection?: "jurisprudence";
  readonly ranking?: RankingMode;
}
export const initialCriteria: Criteria = {
  q: "",
  mode: "auto",
  courts: [],
  documentTypes: [],
  visibility: "both",
  process: null,
  dateAxis: "publication",
  from: null,
  to: null,
  missingDates: "include",
  sort: "relevance",
};
export interface TextPart {
  readonly text: string;
  readonly highlighted: boolean;
}
export interface Publication {
  readonly id: string;
  readonly revision: string;
  readonly textVersion: string;
  readonly court: string | null;
  readonly type: string | null;
  readonly publicationDate: string | null;
  readonly availabilityDate: string | null;
  readonly sourceDate: string | null;
  readonly processes: readonly string[];
  readonly snippets: readonly (readonly TextPart[])[];
  readonly score: number | null;
  readonly jurisprudence?: JurisprudencePreview;
}
export interface JurisprudencePreview {
  readonly textKind: "ementa" | "publication";
  readonly preview: readonly TextPart[];
  readonly ementaHighlights: readonly (readonly TextPart[])[];
  readonly publicationHighlights: readonly (readonly TextPart[])[];
  readonly truncated: boolean;
  readonly ementaSource: EmentaSource | null;
}
export interface EmentaSource {
  readonly ementaId: string;
  readonly enrichmentId: string;
  readonly revisionId: string;
  readonly textVersionId: string;
  readonly inputTextSha256: string;
  readonly start: number;
  readonly end: number;
  readonly offsetUnit: "unicode_codepoint";
  readonly rulesVersion: string;
  readonly configurationHash: string;
  readonly reviewStatus:
    "unreviewed" | "proposed" | "validated" | "needs_review";
}
export interface SearchRanking {
  readonly mode: RankingMode;
  readonly windowSize: number | null;
  readonly candidates: number | null;
  readonly truncated: boolean;
  readonly version: "1";
}
export interface SearchPage {
  readonly publications: readonly Publication[];
  readonly total: number;
  readonly totalRelation: "eq" | "gte";
  readonly nextCursor: string | null;
  readonly sessionId: string | null;
  readonly expiresAt: string | null;
  readonly duration: number;
  readonly strategy: string;
  readonly consistency: string;
  readonly warnings: readonly string[];
  readonly ranking?: SearchRanking;
}
export interface Distribution {
  readonly field: "court" | "documentType" | "period";
  readonly buckets: readonly {
    readonly label: string;
    readonly count: number;
  }[];
  readonly missing: number;
  readonly truncated: boolean;
  readonly approximate: boolean;
  readonly countError: number;
  readonly other: number;
}
export interface Analysis {
  readonly state: "ok" | "no_population";
  readonly population: number;
  readonly numerator: number | null;
  readonly denominator: number;
  readonly value: number | null;
  readonly distributions: readonly Distribution[];
  readonly excludedMissingDates: number;
  readonly dateAxis: DateAxis;
  readonly missingDates: MissingDates;
  readonly reviewPolicy: string;
  readonly selectionPolicy: string;
  readonly observedAt: string;
  readonly warnings: readonly string[];
  readonly consistency: string;
}
export interface Capability {
  readonly name: string;
  readonly available: boolean;
  readonly reason: string | null;
}
export interface Capabilities {
  readonly features: readonly Capability[];
  readonly checkedAt: string;
  readonly versions: readonly string[];
  readonly warnings: readonly string[];
}
export interface Evidence {
  readonly publicationId: string;
  readonly revisionId: string;
  readonly textVersionId: string;
  readonly start: number;
  readonly end: number;
  readonly surface: string;
}
export interface Output {
  readonly id: string;
  readonly family: string;
  readonly actId: string | null;
  readonly actVersionId: string | null;
  readonly label: string | null;
  readonly reviewStatus: string;
  readonly informationState: string;
  readonly meritsState: string | null;
  readonly meritsResult: string | null;
  readonly evidence: readonly Evidence[];
}
export interface Reference {
  readonly id: string;
  readonly family: string;
  readonly type: string;
  readonly key: string;
  readonly mentionRole: string | null;
  readonly surface: string;
  readonly attributionStatus: string;
  readonly attributedEntity: string | null;
  readonly resolutionStatus: string;
  readonly legalStatus: string | null;
  readonly reviewStatus: string;
  readonly evidence: readonly Evidence[];
}
export interface JudicialMetadata {
  readonly rapporteur: string | null;
  readonly organName: string | null;
  readonly className: string | null;
  readonly documentType: string | null;
  readonly instanceDegree: string | null;
  readonly rapporteurStatus: "available" | "ambiguous" | "absent";
  readonly instanceDegreeStatus: "available" | "ambiguous" | "absent";
}
export interface PublicationDetail {
  readonly metadata?: JudicialMetadata | null;
  readonly publication: Publication;
  readonly text: string;
  readonly source: {
    readonly id: string;
    readonly recordId: string;
    readonly adapterId: string;
    readonly adapterVersion: string;
    readonly schemaVersion: string;
    readonly projectionVersion: string;
    readonly observedAt: string;
    readonly ingestedAt: string;
    readonly textSha256: string;
  };
  readonly outputs: readonly Output[];
  readonly references: readonly Reference[];
  readonly consistency: string;
  readonly warnings: readonly string[];
}
export class SearchFailure extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly requestId: string | null = null,
    readonly issues: readonly {
      readonly path: string;
      readonly message: string;
    }[] = [],
  ) {
    super(message);
  }
}
export interface SearchGateway {
  search(
    criteria: Criteria,
    cursor: string | null,
    signal: AbortSignal,
    pageSize?: number,
  ): Promise<SearchPage>;
  facets(
    criteria: Criteria,
    signal: AbortSignal,
  ): Promise<readonly Distribution[]>;
  analyze(criteria: Criteria, signal: AbortSignal): Promise<Analysis>;
  capabilities(signal: AbortSignal): Promise<Capabilities>;
  detail(id: string, signal: AbortSignal): Promise<PublicationDetail>;
  close(sessionId: string): Promise<void>;
}
