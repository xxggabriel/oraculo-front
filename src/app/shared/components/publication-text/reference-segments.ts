import { Publication, Reference } from "../../../core/search";

export type TextIdentity = Pick<Publication, "id" | "revision" | "textVersion">;
export interface ReferenceNavigation {
  readonly anchor: string;
  readonly sourceAnchor: string;
}
export interface ReferenceSegment {
  readonly text: string;
  readonly start: number;
  readonly end: number;
  readonly anchor: string;
  readonly references: readonly Reference[];
}
export function referenceAnchor(
  reference: Pick<Reference, "id" | "family">,
  namespace = "publication",
): string {
  return `${encodeURIComponent(namespace)}-reference-${encodeURIComponent(JSON.stringify([reference.family, reference.id]))}`;
}
export function sectionAnchor(
  section: string,
  namespace = "publication",
): string {
  return namespace === "publication"
    ? section
    : `${encodeURIComponent(namespace)}-${section}`;
}
export function uniqueReferences(
  references: readonly Reference[],
): readonly Reference[] {
  const grouped = new Map<string, Reference>();
  for (const reference of references) {
    const key = referenceAnchor(reference);
    const previous = grouped.get(key);
    const evidence = new Map<string, Reference["evidence"][number]>();
    for (const item of [...(previous?.evidence ?? []), ...reference.evidence]) {
      evidence.set(
        JSON.stringify([
          item.publicationId,
          item.revisionId,
          item.textVersionId,
          item.start,
          item.end,
          item.surface,
        ]),
        item,
      );
    }
    grouped.set(key, {
      ...(previous ?? reference),
      evidence: [...evidence.values()],
    });
  }
  return [...grouped.values()];
}
export function referenceLabel(reference: Reference): string {
  return `${reference.family === "citation" ? "Referência jurisprudencial" : "Referência normativa"}: ${reference.key}`;
}

/** Offsets are Unicode code points in the exact stored text, never UTF-16 offsets.
 * Only spans of the mention itself may become links; contextual evidence remains in the inspector.
 */
export function referenceSegments(
  text: string,
  identity: TextIdentity,
  references: readonly Reference[],
  namespace = "publication",
): readonly ReferenceSegment[] {
  const points = Array.from(text);
  const events = new Map<number, { reference: Reference; delta: number }[]>();
  const seen = new Set<string>();
  for (const reference of uniqueReferences(references)) {
    for (const evidence of reference.evidence) {
      if (
        evidence.publicationId !== identity.id ||
        evidence.revisionId !== identity.revision ||
        evidence.textVersionId !== identity.textVersion ||
        !Number.isInteger(evidence.start) ||
        !Number.isInteger(evidence.end) ||
        evidence.start < 0 ||
        evidence.end <= evidence.start ||
        evidence.end > points.length ||
        evidence.surface !== reference.surface
      )
        continue;
      const key = JSON.stringify([
        referenceAnchor(reference),
        evidence.start,
        evidence.end,
      ]);
      if (seen.has(key)) continue;
      seen.add(key);
      if (
        points.slice(evidence.start, evidence.end).join("") !== evidence.surface
      )
        continue;
      for (const [at, delta] of [
        [evidence.start, 1],
        [evidence.end, -1],
      ]) {
        const list = events.get(at) ?? [];
        list.push({ reference, delta });
        events.set(at, list);
      }
    }
  }
  const boundaries = [...new Set([0, points.length, ...events.keys()])].sort(
    (a, b) => a - b,
  );
  const active = new Map<string, { reference: Reference; count: number }>();
  return boundaries.slice(0, -1).map((start, index) => {
    for (const event of events.get(start) ?? []) {
      const key = referenceAnchor(event.reference);
      const count = (active.get(key)?.count ?? 0) + event.delta;
      if (count <= 0) active.delete(key);
      else active.set(key, { reference: event.reference, count });
    }
    const end = boundaries[index + 1];
    return {
      start,
      end,
      text: points.slice(start, end).join(""),
      anchor: `${encodeURIComponent(namespace)}-fragment-${start}-${end}`,
      references: [...active.values()]
        .map((item) => item.reference)
        .sort((a, b) => referenceAnchor(a).localeCompare(referenceAnchor(b))),
    };
  });
}
