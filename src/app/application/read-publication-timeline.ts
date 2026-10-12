import {
  PublicationTimelineGateway,
  PublicationTimelineQuery,
} from "../core/publication-timeline";
import { SearchFailure } from "../core/search";
export class ReadPublicationTimeline {
  constructor(private readonly gateway: PublicationTimelineGateway) {}
  execute(id: string, query: PublicationTimelineQuery, signal: AbortSignal) {
    if (
      !id.trim() ||
      id.length > 512 ||
      !Number.isInteger(query.page) ||
      query.page < 0 ||
      query.page > 499 ||
      query.pageSize !== 20 ||
      (query.cnj !== null && !/^\d{20}$/.test(query.cnj))
    ) {
      throw new SearchFailure(
        "INVALID_CRITERIA",
        "Consulta da linha do tempo inválida.",
      );
    }
    return this.gateway.timeline(id, query, signal);
  }
}
