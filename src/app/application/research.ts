import { Criteria, SearchGateway } from "../core/search";
export class Research {
  constructor(private readonly gateway: SearchGateway) {}
  search(
    criteria: Criteria,
    cursor: string | null,
    signal: AbortSignal,
    pageSize = 10,
  ) {
    return this.gateway.search(criteria, cursor, signal, pageSize);
  }
  facets(criteria: Criteria, signal: AbortSignal) {
    return this.gateway.facets(criteria, signal);
  }
  analyze(criteria: Criteria, signal: AbortSignal) {
    return this.gateway.analyze(criteria, signal);
  }
  capabilities(signal: AbortSignal) {
    return this.gateway.capabilities(signal);
  }
  detail(id: string, signal: AbortSignal) {
    return this.gateway.detail(id, signal);
  }
  close(sessionId: string) {
    return this.gateway.close(sessionId);
  }
}
