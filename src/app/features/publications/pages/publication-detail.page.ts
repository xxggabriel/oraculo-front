import {
  Component,
  OnDestroy,
  afterRenderEffect,
  inject,
  signal,
} from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { Subscription } from "rxjs";
import { Research } from "../../../application/research";
import { RecommendRelatedPublications } from "../../../application/recommend-related-publications";
import { RelatedPublications } from "../../../core/related-publications";
import { PublicationDetail, SearchFailure } from "../../../core/search";
import { ReferenceNavigation } from "../../../shared/components/publication-text/reference-segments";
import { DOCUMENT } from "@angular/common";
import { LoadingSkeletonComponent } from "../../../shared/components/loading-skeleton/loading-skeleton.component";
import { PublicationTextComponent } from "../../../shared/components/publication-text/publication-text.component";
import { PublicationReferencesComponent } from "../../../shared/components/references/references.component";
import { SelectedOutputsComponent } from "../../../shared/components/selected-outputs/selected-outputs.component";
import { PublicationProvenanceComponent } from "../../../shared/components/provenance/provenance.component";
import { civilDate, processNumber } from "../../../shared/format";
import { RelatedPublicationsComponent } from "../../../shared/components/related-publications/related-publications.component";
import { PublicationTimelineComponent } from "../../../shared/components/publication-timeline/publication-timeline.component";
import { PublicationTimelineFacade } from "../state/publication-timeline.facade";
import { PublicationMetadataComponent } from "../../../shared/components/publication-metadata/publication-metadata.component";
@Component({
  selector: "app-publication-detail",
  standalone: true,
  imports: [
    RouterLink,
    LoadingSkeletonComponent,
    PublicationTextComponent,
    PublicationReferencesComponent,
    SelectedOutputsComponent,
    PublicationProvenanceComponent,
    RelatedPublicationsComponent,
    PublicationTimelineComponent,
    PublicationMetadataComponent,
  ],
  providers: [PublicationTimelineFacade],
  templateUrl: "./publication-detail.page.html",
})
export class PublicationDetailPage implements OnDestroy {
  readonly timeline = inject(PublicationTimelineFacade);
  readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly research = inject(Research);
  private readonly recommendations = inject(RecommendRelatedPublications);
  private readonly subscription: Subscription;
  private controller: AbortController | null = null;
  private relatedController: AbortController | null = null;
  private generation = 0;
  private readonly timelineFocus = signal<{
    anchor: string;
    generation: number;
    id: string;
    process: string | null;
  } | null>(null);
  readonly detail = signal<PublicationDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<SearchFailure | null>(null);
  readonly related = signal<RelatedPublications | null>(null);
  readonly relatedLoading = signal(false);
  readonly relatedError = signal<SearchFailure | null>(null);
  readonly civilDate = civilDate;
  readonly processNumber = processNumber;
  readonly activeReference = signal<string | null>(null);
  readonly sourceAnchor = signal<string | null>(null);
  private readonly document = inject(DOCUMENT);
  constructor() {
    afterRenderEffect(() => {
      const pending = this.timelineFocus();
      if (!pending) return;
      if (
        pending.generation === this.generation &&
        pending.id === this.detail()?.publication.id &&
        pending.process === this.timeline.selectedProcess()
      )
        this.focusAnchor(pending.anchor);
      this.timelineFocus.set(null);
    });
    afterRenderEffect(() => {
      if (!this.detail()) return;
      const fragment = this.route.snapshot.fragment;
      if (!fragment) {
        this.focusAnchor("publication-heading");
        return;
      }
      this.activeReference.set(fragment);
      this.focusAnchor(fragment);
    });
    this.subscription = this.route.paramMap.subscribe((p) => {
      void this.load(p.get("id") ?? "");
    });
  }
  async load(id: string) {
    this.timelineFocus.set(null);
    this.timeline.reset();
    this.controller?.abort();
    this.relatedController?.abort();
    this.controller = new AbortController();
    const signal = this.controller.signal;
    const generation = ++this.generation;
    this.loading.set(true);
    this.detail.set(null);
    this.activeReference.set(null);
    this.sourceAnchor.set(null);
    this.error.set(null);
    this.related.set(null);
    this.relatedError.set(null);
    this.relatedLoading.set(false);
    try {
      const detail = await this.research.detail(id, signal);
      if (generation === this.generation) {
        this.activeReference.set(this.route.snapshot.fragment ?? null);
        this.detail.set(detail);
        void this.loadRelated(detail.publication.id, generation);
        void this.timeline.load(detail.publication.id);
      }
    } catch (e) {
      if (!signal.aborted && generation === this.generation)
        this.error.set(
          e instanceof SearchFailure
            ? e
            : new SearchFailure(
                "DETAIL_ERROR",
                "Não foi possível carregar a publicação.",
              ),
        );
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
  }
  private async loadRelated(id: string, generation: number) {
    this.relatedController?.abort();
    const controller = new AbortController();
    this.relatedController = controller;
    this.related.set(null);
    this.relatedError.set(null);
    this.relatedLoading.set(true);
    const current = () =>
      generation === this.generation &&
      this.relatedController === controller &&
      !controller.signal.aborted;
    try {
      const related = await this.recommendations.execute(id, controller.signal);
      if (current()) this.related.set(related);
    } catch (error) {
      if (current())
        this.relatedError.set(
          error instanceof SearchFailure
            ? error
            : new SearchFailure(
                "RELATED_ERROR",
                "Não foi possível carregar as publicações relacionadas.",
              ),
        );
    } finally {
      if (current()) this.relatedLoading.set(false);
    }
  }
  retryRelated() {
    const detail = this.detail();
    if (detail) {
      this.focusAnchor("related-publications");
      void this.loadRelated(detail.publication.id, this.generation);
    }
  }
  retryTimeline() {
    this.focusAnchor("timeline-publications");
    void this.timeline.retry();
  }
  async moreTimeline() {
    const id = this.detail()?.publication.id;
    const generation = this.generation;
    const process = this.timeline.selectedProcess();
    const next = await this.timeline.loadMore();
    if (
      next !== undefined &&
      generation === this.generation &&
      process === this.timeline.selectedProcess() &&
      id &&
      id === this.detail()?.publication.id &&
      !this.timeline.loading()
    )
      this.timelineFocus.set({
        anchor: next
          ? `timeline-item-${encodeURIComponent(next)}`
          : "timeline-publications",
        generation,
        id,
        process,
      });
  }
  baseHref(): string {
    return this.router.url.split("#")[0] ?? "";
  }
  returnRoute() {
    return this.route.snapshot.queryParamMap.get("returnTo") === "jurimetria"
      ? "/jurimetria"
      : "/";
  }
  async navigateTo(navigation: string | ReferenceNavigation) {
    const anchor =
      typeof navigation === "string" ? navigation : navigation.anchor;
    this.sourceAnchor.set(
      typeof navigation === "string" ? null : navigation.sourceAnchor,
    );
    this.activeReference.set(anchor);
    await this.router.navigate([], {
      relativeTo: this.route,
      fragment: anchor,
      queryParamsHandling: "preserve",
      replaceUrl: true,
    });
    this.focusAnchor(anchor);
  }
  private focusAnchor(anchor: string) {
    const target = this.document.getElementById(anchor);
    target?.focus({ preventScroll: true });
    target?.scrollIntoView?.({ block: "center", behavior: "auto" });
  }
  sectionHref(fragment: string): string {
    return `${this.router.url.split("#")[0]}#${fragment}`;
  }
  retry() {
    void this.load(this.route.snapshot.paramMap.get("id") ?? "");
  }
  ngOnDestroy() {
    this.timelineFocus.set(null);
    this.generation++;
    this.controller?.abort();
    this.relatedController?.abort();
    this.timeline.reset();
    this.subscription.unsubscribe();
  }
}
