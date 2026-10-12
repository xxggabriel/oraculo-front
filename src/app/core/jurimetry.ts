import {
  Criteria,
  DateAxis,
  MissingDates,
  Distribution,
  Publication,
} from "./search";

export type ReferenceMode =
  "any" | "jurisprudential" | "normative" | "either" | "both";
export interface ReferenceQuery {
  readonly criteria: Criteria;
  readonly references: ReferenceMode;
  readonly includeProposals: boolean;
  readonly pageSize: number;
  readonly page: number;
}
export interface ReferenceReport {
  readonly judicialDistribution?: JudicialDistribution;
  readonly criteria: Criteria;
  readonly dateAxis: DateAxis;
  readonly missingDates: MissingDates;
  readonly publications: readonly Publication[];
  readonly population: number;
  readonly totalCandidates: number;
  readonly page: number;
  readonly pageSize: number;
  readonly hasMore: boolean;
  readonly presence: {
    readonly jurisprudentialOnly: number;
    readonly normativeOnly: number;
    readonly both: number;
    readonly neither: number;
  };
  readonly topReferences: readonly {
    readonly family: "citation" | "normative";
    readonly key: string;
    readonly surface: string;
    readonly publications: number;
    readonly mentions: number;
  }[];
  readonly distributions: readonly Distribution[];
  readonly references: ReferenceMode;
  readonly includeProposals: boolean;
  readonly observedAt: string;
  readonly reviewPolicy: string;
  readonly selectionPolicy: string;
  readonly consistency: string;
  readonly candidateLimit: number | null;
  readonly warnings: readonly string[];
}
export interface JudicialOrgan {
  readonly name: string | null;
  readonly publications: number;
  readonly rapporteurs: readonly {
    readonly name: string;
    readonly publications: number;
  }[];
  readonly missingRapporteur: number;
  readonly ambiguousRapporteur: number;
}
export interface JudicialCourt {
  readonly name: string | null;
  readonly publications: number;
  readonly organs: readonly JudicialOrgan[];
}
export interface JudicialClass {
  readonly code: string;
  readonly publications: number;
  readonly names: readonly {
    readonly name: string;
    readonly publications: number;
  }[];
  readonly missingName: number;
}
export interface JudicialDistribution {
  readonly courts: readonly JudicialCourt[];
  readonly classes: readonly JudicialClass[];
  readonly missingClassCode: number;
  readonly missingClassName: number;
}
export interface ReferenceJurimetryGateway {
  queryReferences(
    query: ReferenceQuery,
    signal: AbortSignal,
  ): Promise<ReferenceReport>;
}
