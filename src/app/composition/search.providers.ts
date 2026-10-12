import { InjectionToken } from "@angular/core";
import { SearchGateway } from "../core/search";
import { Research } from "../application/research";
import { HttpSearchGateway } from "../adapters/http-search.gateway";
import { ReferenceJurimetryGateway } from "../core/jurimetry";
import { ReferenceJurimetry } from "../application/reference-jurimetry";
import { RelatedPublicationsGateway } from "../core/related-publications";
import { RecommendRelatedPublications } from "../application/recommend-related-publications";
import { PublicationTimelineGateway } from "../core/publication-timeline";
import { ReadPublicationTimeline } from "../application/read-publication-timeline";
export const SEARCH_GATEWAY = new InjectionToken<SearchGateway>(
  "SearchGateway",
);
export const REFERENCE_JURIMETRY_GATEWAY =
  new InjectionToken<ReferenceJurimetryGateway>("ReferenceJurimetryGateway");
export const RELATED_PUBLICATIONS_GATEWAY =
  new InjectionToken<RelatedPublicationsGateway>("RelatedPublicationsGateway");
export const PUBLICATION_TIMELINE_GATEWAY =
  new InjectionToken<PublicationTimelineGateway>("PublicationTimelineGateway");
export const searchProviders = [
  { provide: HttpSearchGateway, useFactory: () => new HttpSearchGateway() },
  { provide: SEARCH_GATEWAY, useExisting: HttpSearchGateway },
  { provide: REFERENCE_JURIMETRY_GATEWAY, useExisting: HttpSearchGateway },
  { provide: RELATED_PUBLICATIONS_GATEWAY, useExisting: HttpSearchGateway },
  { provide: PUBLICATION_TIMELINE_GATEWAY, useExisting: HttpSearchGateway },
  {
    provide: ReadPublicationTimeline,
    useFactory: (gateway: PublicationTimelineGateway) =>
      new ReadPublicationTimeline(gateway),
    deps: [PUBLICATION_TIMELINE_GATEWAY],
  },
  {
    provide: RecommendRelatedPublications,
    useFactory: (gateway: RelatedPublicationsGateway) =>
      new RecommendRelatedPublications(gateway),
    deps: [RELATED_PUBLICATIONS_GATEWAY],
  },
  {
    provide: ReferenceJurimetry,
    useFactory: (gateway: ReferenceJurimetryGateway) =>
      new ReferenceJurimetry(gateway),
    deps: [REFERENCE_JURIMETRY_GATEWAY],
  },
  {
    provide: Research,
    useFactory: (gateway: SearchGateway) => new Research(gateway),
    deps: [SEARCH_GATEWAY],
  },
];
