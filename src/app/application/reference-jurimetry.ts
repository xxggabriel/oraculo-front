import { ReferenceJurimetryGateway, ReferenceQuery } from "../core/jurimetry";

export class ReferenceJurimetry {
  constructor(private readonly gateway: ReferenceJurimetryGateway) {}
  query(query: ReferenceQuery, signal: AbortSignal) {
    return this.gateway.queryReferences(query, signal);
  }
}
