export interface PlotBucket {
  readonly label: string;
  readonly count: number;
}

/** Chart scales always include zero and have a nonzero range, including empty series. */
export function plotMaximum(buckets: readonly PlotBucket[]): number {
  return buckets.reduce(
    (maximum, bucket) => Math.max(maximum, validCount(bucket.count)),
    1,
  );
}

export function validCount(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

/** A bucket's share uses the queried population, never the sum of visible buckets. */
export function populationShare(
  count: number,
  population: number,
): number | null {
  return Number.isFinite(population) && population > 0
    ? (validCount(count) / population) * 100
    : null;
}

export function scaledWidth(count: number, maximum: number): number {
  return Math.min(100, (validCount(count) / Math.max(1, maximum)) * 100);
}

export function plotLabel(label: string, kind: "bars" | "timeline"): string {
  if (kind === "timeline" && /^\d{4}-(0[1-9]|1[0-2])$/.test(label)) {
    return label.split("-").reverse().join("/");
  }
  if (kind === "timeline" && /^\d{4}-\d{2}-\d{2}$/.test(label)) {
    return label.split("-").reverse().join("/");
  }
  return label;
}
