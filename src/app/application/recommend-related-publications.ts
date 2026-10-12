import { RelatedPublicationsGateway } from "../core/related-publications";
import { SearchFailure } from "../core/search";

export class RecommendRelatedPublications {
  constructor(private readonly gateway: RelatedPublicationsGateway) {}
  execute(id: string, signal: AbortSignal) {
    if (!id || id.length > 512)
      throw new SearchFailure(
        "INVALID_ID",
        "Identificador da publicação inválido.",
      );
    return this.gateway.related(id, signal);
  }
}
