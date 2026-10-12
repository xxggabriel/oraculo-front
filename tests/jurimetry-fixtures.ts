import { ReferenceReport } from "../src/app/core/jurimetry";
import { initialCriteria } from "../src/app/core/search";
export function referenceReport(population = 1): ReferenceReport {
  return {
    criteria: initialCriteria,
    dateAxis: "publication",
    missingDates: "include",
    publications: [],
    population,
    totalCandidates: population,
    page: 0,
    pageSize: 10,
    hasMore: false,
    presence: {
      jurisprudentialOnly: population,
      normativeOnly: 0,
      both: 0,
      neither: 0,
    },
    topReferences: [],
    distributions: [],
    references: "either",
    includeProposals: true,
    observedAt: "2026-10-11T00:00:00Z",
    reviewPolicy: "selected_not_rejected",
    selectionPolicy: "compatible_selected_enrichment",
    consistency: "pit_snapshot_revalidated_projection",
    candidateLimit: null,
    warnings: [],
  };
}
