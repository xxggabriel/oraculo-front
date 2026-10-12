import { Criteria } from "../core/search";
export interface QueryParamsReader {
  get(name: string): string | null;
}

export function criteriaFromParams(params: QueryParamsReader): Criteria {
  const values = (key: string) => [
    ...new Set(
      (params.get(key) ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    ),
  ];
  const mode = params.get("mode"),
    axis = params.get("dateAxis"),
    missing = params.get("missingDates"),
    relation = params.get("relation"),
    cnj = params.get("process");
  return {
    q: params.get("q") ?? "",
    mode:
      mode === "phrase" || mode === "cnj" || mode === "lexical" ? mode : "auto",
    courts: values("courts"),
    documentTypes: values("types"),
    visibility:
      params.get("visibility") === "public" ||
      params.get("visibility") === "restricted"
        ? (params.get("visibility") as "public" | "restricted")
        : "both",
    partyName: params.get("partyName")?.trim() || null,
    attorneyName: params.get("attorneyName")?.trim() || null,
    oabNumber: params.get("oabNumber")?.trim() || null,
    oabState: params.get("oabState")?.trim().toUpperCase() || null,
    process: cnj
      ? {
          cnj,
          relation:
            relation === "any" || relation === "referenced"
              ? relation
              : "publication_process",
        }
      : null,
    dateAxis:
      axis === "availability" || axis === "source" ? axis : "publication",
    from: params.get("from") || null,
    to: params.get("to") || null,
    missingDates:
      missing === "only" || missing === "exclude" ? missing : "include",
    sort: params.get("sort") === "date_desc" ? "date_desc" : "relevance",
  };
}
export function criteriaToParams(c: Criteria, size = 10) {
  return {
    size: size === 10 ? null : size,
    q: c.q || null,
    mode: c.mode === "auto" ? null : c.mode,
    courts: c.courts.join(",") || null,
    types: c.documentTypes.join(",") || null,
    visibility: c.visibility && c.visibility !== "both" ? c.visibility : null,
    partyName: c.partyName || null,
    attorneyName: c.attorneyName || null,
    oabNumber: c.oabNumber || null,
    oabState: c.oabState || null,
    process: c.process?.cnj ?? null,
    relation:
      c.process && c.process.relation !== "publication_process"
        ? c.process.relation
        : null,
    dateAxis: c.dateAxis === "publication" ? null : c.dateAxis,
    from: c.from,
    to: c.to,
    missingDates: c.missingDates === "include" ? null : c.missingDates,
    sort: c.sort === "relevance" ? null : c.sort,
  };
}
