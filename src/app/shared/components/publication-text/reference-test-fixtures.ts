import { Evidence, Reference } from "../../../core/search";
import { TextIdentity } from "./reference-segments";
export const identity: TextIdentity = {
  id: "publication",
  revision: "revision",
  textVersion: "text",
};
export function reference(
  id: string,
  evidence: readonly Partial<Evidence>[],
  family = "citation",
): Reference {
  return {
    id,
    family,
    type: "article",
    key: id,
    surface: evidence[0]?.surface ?? "a",
    mentionRole: null,
    attributionStatus: "explicit",
    attributedEntity: null,
    resolutionStatus: "unresolved",
    legalStatus: null,
    reviewStatus: "proposed",
    evidence: evidence.map((item) => ({
      publicationId: identity.id,
      revisionId: identity.revision,
      textVersionId: identity.textVersion,
      start: 0,
      end: 1,
      surface: "a",
      ...item,
    })),
  };
}
