import {
  ContentPart,
  visibleReferenceParts,
} from "../publication-content/content-decorations";
import { PublicationContentComponent } from "../publication-content/publication-content.component";
import {
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from "@angular/core";
import { LoadingSkeletonComponent } from "../loading-skeleton/loading-skeleton.component";
import { Reference } from "../../../core/search";
import { presentReference, referenceExcerpt } from "./reference-presentation";
import { EvidenceListComponent } from "../evidence/evidence-list.component";
import {
  TextIdentity,
  referenceAnchor,
  referenceSegments,
  uniqueReferences,
  sectionAnchor,
} from "../publication-text/reference-segments";
@Component({
  selector: "app-publication-references",
  standalone: true,
  imports: [
    EvidenceListComponent,
    PublicationContentComponent,
    LoadingSkeletonComponent,
  ],
  host: { class: "block min-w-0" },
  templateUrl: "./references.component.html",
})
export class PublicationReferencesComponent {
  readonly references = input.required<readonly Reference[]>();
  readonly loading = input(false);
  readonly text = input.required<string>();
  readonly identity = input.required<TextIdentity>();
  readonly baseHref = input("");
  readonly anchorNamespace = input("publication");
  readonly activeReference = input<string | null>(null);
  readonly sourceAnchor = input<string | null>(null);
  readonly anchorActivated = output<string>();
  readonly referenceAnchor = (reference: Reference) =>
    referenceAnchor(reference, this.anchorNamespace());
  readonly presentation = presentReference;
  readonly sectionAnchor = (section: string) =>
    sectionAnchor(section, this.anchorNamespace());
  readonly encodeFragment = encodeURIComponent;
  readonly uniqueReferences = computed(() =>
    uniqueReferences(this.references()),
  );
  private readonly requestedCount = linkedSignal(() => {
    this.references();
    this.identity();
    return 5;
  });
  readonly visibleCount = computed(() => {
    const activeIndex = this.uniqueReferences().findIndex(
      (reference) => this.referenceAnchor(reference) === this.activeReference(),
    );
    const activePageCount =
      activeIndex < 5 ? 5 : 5 + Math.ceil((activeIndex + 1 - 5) / 10) * 10;
    return Math.max(this.requestedCount(), activePageCount);
  });
  readonly visibleReferences = computed(() =>
    this.uniqueReferences().slice(0, this.visibleCount()),
  );
  readonly remainingCount = computed(
    () => this.uniqueReferences().length - this.visibleReferences().length,
  );
  readonly nextCount = computed(() => Math.min(10, this.remainingCount()));
  showMore() {
    this.requestedCount.set(this.visibleCount() + 10);
  }
  private readonly segments = computed(() =>
    referenceSegments(
      this.text(),
      this.identity(),
      this.references(),
      this.anchorNamespace(),
    ),
  );
  private readonly points = computed(() => Array.from(this.text()));
  private readonly segmentByAnchor = computed(
    () => new Map(this.segments().map((segment) => [segment.anchor, segment])),
  );
  private readonly visibleParts = computed(() =>
    visibleReferenceParts(this.text(), this.segments()),
  );
  private readonly partByAnchor = computed(
    () => new Map(this.visibleParts().map((part) => [part.anchor, part])),
  );
  private readonly partsByReference = computed(() => {
    const result = new Map<string, ContentPart[]>();
    for (const part of this.visibleParts()) {
      for (const reference of part.references) {
        const key = this.referenceAnchor(reference);
        const list = result.get(key) ?? [];
        list.push(part);
        result.set(key, list);
      }
    }
    return result;
  });
  private selectedPart(reference: Reference): ContentPart | null {
    const key = this.referenceAnchor(reference);
    const selected = this.partByAnchor().get(this.sourceAnchor());
    if (selected?.references.some((item) => this.referenceAnchor(item) === key))
      return selected;
    return this.partsByReference().get(key)?.[0] ?? null;
  }
  context(reference: Reference) {
    const origin = this.selectedPart(reference)?.originAnchor;
    const segment = origin ? this.segmentByAnchor().get(origin) : null;
    return segment
      ? referenceExcerpt(this.points(), segment.start, segment.end)
      : null;
  }
  backAnchor(reference: Reference): string | null {
    return this.selectedPart(reference)?.anchor ?? null;
  }
  navigate(event: MouseEvent, anchor: string) {
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    )
      return;
    event.preventDefault();
    this.anchorActivated.emit(anchor);
  }
}
