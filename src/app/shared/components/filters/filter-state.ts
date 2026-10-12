import { Criteria, MissingDates, initialCriteria } from "../../../core/search";
import { axisLabels, civilDate, processNumber } from "../../format";

export type FilterSelection = Pick<
  Criteria,
  | "courts"
  | "documentTypes"
  | "partyName"
  | "attorneyName"
  | "oabNumber"
  | "oabState"
  | "visibility"
  | "process"
  | "dateAxis"
  | "from"
  | "to"
  | "missingDates"
>;
export interface FilterChip {
  readonly key:
    | "court"
    | "documentType"
    | "partyName"
    | "attorneyName"
    | "oabNumber"
    | "oabState"
    | "visibility"
    | "process"
    | "date"
    | "dateAxis"
    | "missingDates";
  readonly value: string;
  readonly label: string;
}
export function filterSelection(criteria: Criteria): FilterSelection {
  const { courts, documentTypes, process, dateAxis, from, to, missingDates } =
    criteria;
  return {
    courts: [...courts],
    documentTypes: [...documentTypes],
    visibility: criteria.visibility ?? "both",
    partyName: criteria.partyName ?? null,
    attorneyName: criteria.attorneyName ?? null,
    oabNumber: criteria.oabNumber ?? null,
    oabState: criteria.oabState ?? null,
    process: process ? { ...process } : null,
    dateAxis,
    from,
    to,
    missingDates,
  };
}
export function emptyFilters(): FilterSelection {
  return filterSelection(initialCriteria);
}
export function sameFilters(a: FilterSelection, b: FilterSelection): boolean {
  const canonical = (f: FilterSelection) =>
    JSON.stringify({
      ...f,
      courts: [...f.courts].sort(),
      documentTypes: [...f.documentTypes].sort(),
    });
  return canonical(a) === canonical(b);
}
export function filterChips(c: FilterSelection): readonly FilterChip[] {
  const chips: FilterChip[] = [
    ...c.courts.map((value) => ({
      key: "court" as const,
      value,
      label: value,
    })),
    ...c.documentTypes.map((value) => ({
      key: "documentType" as const,
      value,
      label: value,
    })),
  ];
  if (c.visibility && c.visibility !== "both")
    chips.push({
      key: "visibility",
      value: c.visibility,
      label:
        c.visibility === "public"
          ? "Processos públicos"
          : "Processos privados (restritos)",
    });
  for (const [key, label] of [
    ["partyName", "Parte"],
    ["attorneyName", "Advogado"],
    ["oabNumber", "OAB"],
    ["oabState", "UF da OAB"],
  ] as const) {
    if (c[key])
      chips.push({ key, value: c[key], label: `${label}: ${c[key]}` });
  }
  if (c.process)
    chips.push({
      key: "process",
      value: c.process.cnj,
      label: processNumber(c.process.cnj),
    });
  if (c.from || c.to)
    chips.push({
      key: "date",
      value: "",
      label: `${axisLabels[c.dateAxis]}: ${civilDate(c.from)}–${civilDate(c.to)}`,
    });
  if (!c.from && !c.to && c.dateAxis !== "publication")
    chips.push({
      key: "dateAxis",
      value: "",
      label: `Eixo: ${axisLabels[c.dateAxis]}`,
    });
  if (c.missingDates !== "include")
    chips.push({
      key: "missingDates",
      value: "",
      label:
        c.missingDates === "only"
          ? "Somente sem data"
          : "Excluir datas ausentes",
    });
  return chips;
}
export function removeFilter(
  c: FilterSelection,
  chip: FilterChip,
): FilterSelection {
  switch (chip.key) {
    case "partyName":
    case "oabState":
      return { ...c, [chip.key]: null };
    case "attorneyName":
      return {
        ...c,
        attorneyName: null,
        oabState: c.oabNumber ? c.oabState : null,
      };
    case "oabNumber":
      return {
        ...c,
        oabNumber: null,
        oabState: c.attorneyName ? c.oabState : null,
      };
    case "visibility":
      return { ...c, visibility: "both" };
    case "court":
      return { ...c, courts: c.courts.filter((v) => v !== chip.value) };
    case "documentType":
      return {
        ...c,
        documentTypes: c.documentTypes.filter((v) => v !== chip.value),
      };
    case "process":
      return { ...c, process: null };
    case "date":
      return { ...c, from: null, to: null };
    case "dateAxis":
      return { ...c, dateAxis: "publication" };
    case "missingDates":
      return { ...c, missingDates: "include" };
  }
}
export function validatePeriod(
  from: string | null,
  to: string | null,
  missingDates: MissingDates = "include",
): string | null {
  if (Boolean(from) !== Boolean(to))
    return "Informe a data inicial e a data final, ou deixe ambas vazias.";
  const valid = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return (
      year >= 1 &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= days[month - 1]
    );
  };
  if ((from && !valid(from)) || (to && !valid(to)))
    return "Informe datas válidas no formato dia, mês e ano.";
  if (from && to && from > to)
    return "A data inicial deve ser anterior ou igual à data final.";
  if (from && to && Date.parse(to) - Date.parse(from) > 366 * 10 * 86400000)
    return "O período máximo permitido é de dez anos. Reduza o intervalo.";
  if (missingDates === "only" && from)
    return "Para consultar somente publicações sem data, selecione Todo o período. Para usar um intervalo, escolha Incluir ou Excluir datas ausentes.";
  return null;
}
export type DatePreset =
  "all" | "last7" | "last30" | "month" | "previousMonth" | "year" | "custom";
export function presetPeriod(
  preset: Exclude<DatePreset, "custom">,
  now = new Date(),
): { from: string | null; to: string | null } {
  if (preset === "all") return { from: null, to: null };
  const civil = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  let from = new Date(today),
    to = new Date(today);
  if (preset === "last7" || preset === "last30")
    from.setDate(from.getDate() - (preset === "last7" ? 6 : 29));
  if (preset === "month")
    from = new Date(today.getFullYear(), today.getMonth(), 1, 12);
  if (preset === "previousMonth") {
    from = new Date(today.getFullYear(), today.getMonth() - 1, 1, 12);
    to = new Date(today.getFullYear(), today.getMonth(), 0, 12);
  }
  if (preset === "year") from = new Date(today.getFullYear(), 0, 1, 12);
  return { from: civil(from), to: civil(to) };
}
