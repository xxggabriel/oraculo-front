import {
  publicationPlainText,
  parsePublicationHtml,
} from "../publication-content/publication-html";
import { Reference } from "../../../core/search";

const types: Record<string, { label: string; explanation: string }> = {
  case: {
    label: "Processo ou julgamento",
    explanation: "Menção a um processo ou julgamento.",
  },
  sumula: {
    label: "Súmula",
    explanation:
      "Resumo de um entendimento adotado repetidamente por um tribunal.",
  },
  binding_sumula: {
    label: "Súmula vinculante",
    explanation: "Súmula identificada como vinculante na extração do texto.",
  },
  theme: {
    label: "Tema de julgamento",
    explanation: "Questão jurídica identificada por um número de tema.",
  },
  statute: {
    label: "Lei ou norma",
    explanation: "Lei, código ou outro texto normativo mencionado.",
  },
  statute_provision: {
    label: "Artigo ou trecho de norma",
    explanation: "Um artigo ou outra parte de uma norma mencionada no texto.",
  },
  article: { label: "Artigo", explanation: "Artigo mencionado no texto." },
};
const reviews: Record<string, { label: string; explanation: string }> = {
  proposed: {
    label: "A conferir",
    explanation:
      "Identificada automaticamente. A extração desta referência ainda não foi validada.",
  },
  unreviewed: {
    label: "A conferir",
    explanation: "A extração desta referência ainda não passou por revisão.",
  },
  needs_review: {
    label: "Revisão pendente",
    explanation: "A extração desta referência precisa de revisão.",
  },
  validated: {
    label: "Extração revisada",
    explanation:
      "A extração foi validada. Isso não confirma que a referência se aplica a este caso.",
  },
  rejected: {
    label: "Extração rejeitada",
    explanation:
      "A revisão rejeitou esta extração. A referência pode ter sido identificada incorretamente.",
  },
};
const resolutions: Record<string, string> = {
  unique: "Uma correspondência foi encontrada no acervo consultado.",
  ambiguous:
    "Há mais de uma correspondência possível. Nenhuma foi escolhida como definitiva.",
  no_match: "Nenhuma correspondência foi encontrada no acervo consultado.",
  not_attempted: "A busca por uma correspondência ainda não foi realizada.",
  unresolved: "Ainda não há uma correspondência identificada.",
};
const attributions: Record<string, string> = {
  explicit: "Informado na referência extraída.",
  inferred: "Sugerido pelo contexto; não informado diretamente na referência.",
  inherited: "Associado a partir do contexto da publicação.",
  ambiguous: "Há mais de uma origem possível.",
  unknown: "A origem não foi identificada.",
};
const roles: Record<string, string> = {
  jurisprudential_citation: "Citação de jurisprudência",
  publication_process: "Processo desta publicação",
  other_process_reference: "Outro processo mencionado",
  indeterminate: "Uso da referência não determinado",
};
export function referenceTitle(reference: Reference): string {
  const points = Array.from(
    publicationPlainText(reference.surface).replace(/\s+/g, " ").trim(),
  );
  return points.length
    ? points.slice(0, 180).join("") + (points.length > 180 ? "…" : "")
    : "Referência sem título";
}
export function presentReference(reference: Reference) {
  const normative = ["normative", "normative_reference"].includes(
    reference.family,
  );
  const judicial = reference.family === "citation";
  const type = types[reference.type] ?? {
    label: "Tipo não informado",
    explanation:
      "O tipo desta referência ainda não está disponível em linguagem simples.",
  };
  const review = reviews[reference.reviewStatus] ?? {
    label: "Revisão não informada",
    explanation: "O estado da revisão desta extração não foi informado.",
  };
  const originLabel = normative
    ? "Norma de origem"
    : judicial
      ? "Tribunal ou órgão indicado"
      : "Origem da referência";
  // Entity IDs may be canonical technical keys, not display names. Do not infer a statute from an article number.
  const entity = reference.attributedEntity;
  const origin =
    reference.attributionStatus === "ambiguous"
      ? "Mais de uma origem possível"
      : reference.attributionStatus === "unknown"
        ? "Não identificada"
        : entity && /^[\p{L}\p{N} .()/-]+$/u.test(entity)
          ? entity
          : entity
            ? "Origem associada; identificação nos detalhes"
            : "Não informada";
  return {
    title: referenceTitle(reference),
    type,
    review,
    normative,
    category: normative
      ? "Norma"
      : reference.mentionRole === "publication_process"
        ? "Processo da publicação"
        : reference.mentionRole === "other_process_reference"
          ? "Processo mencionado"
          : judicial
            ? "Referência judicial"
            : "Referência",
    originLabel,
    origin,
    attribution:
      !entity &&
      ["explicit", "inferred", "inherited"].includes(
        reference.attributionStatus,
      )
        ? "O nome da origem não está disponível."
        : (attributions[reference.attributionStatus] ??
          "A forma de identificação da origem não foi informada."),
    resolution:
      resolutions[reference.resolutionStatus] ??
      "A identificação da referência não foi informada.",
    role: reference.mentionRole
      ? (roles[reference.mentionRole] ?? "Uso da referência não determinado")
      : null,
    legal:
      reference.legalStatus === "not_assessed" || !reference.legalStatus
        ? "Vigência não verificada"
        : "Há informação de vigência nos detalhes; consulte o registro original",
  };
}
interface VisibleSpan {
  readonly points: readonly string[];
  readonly start: number;
  readonly end: number;
}
const excerptCache = new WeakMap<readonly string[], readonly VisibleSpan[]>();
const blockTags = new Set([
  "center",
  "section",
  "article",
  "pre",
  "p",
  "div",
  "blockquote",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
]);
function visibleSpans(points: readonly string[]): readonly VisibleSpan[] {
  const cached = excerptCache.get(points);
  if (cached) return cached;
  const spans: VisibleSpan[] = [];
  let cursor = 0;
  const separator = (text = "\n", explicit = false) => {
    const last = spans.at(-1)?.points.at(-1);
    if (
      !spans.length ||
      (!explicit && (text === "\n" ? last === "\n" : /\s/.test(last ?? "")))
    )
      return;
    spans.push({ points: [text], start: cursor, end: cursor });
  };
  const visit = (nodes: ReturnType<typeof parsePublicationHtml>) => {
    for (const node of nodes) {
      if (node.kind === "text") {
        spans.push({
          points: Array.from(node.text),
          start: node.start,
          end: node.end,
        });
        cursor = node.end;
      } else if (node.kind === "element") {
        if (blockTags.has(node.tag)) separator();
        else if (["td", "th"].includes(node.tag)) separator(" ");
        visit(node.children);
        if (blockTags.has(node.tag)) separator();
        else if (["td", "th"].includes(node.tag)) separator(" ");
      } else separator("\n", true);
    }
  };
  visit(parsePublicationHtml(points.join("")));
  while (
    spans.at(-1)?.points[0] === "\n" &&
    spans.at(-1)?.start === spans.at(-1)?.end
  )
    spans.pop();
  excerptCache.set(points, spans);
  return spans;
}
function firstIndex(
  spans: readonly VisibleSpan[],
  predicate: (span: VisibleSpan) => boolean,
): number {
  let from = 0,
    to = spans.length;
  while (from < to) {
    const middle = Math.floor((from + to) / 2);
    if (predicate(spans[middle])) to = middle;
    else from = middle + 1;
  }
  return from;
}
function visibleRange(
  spans: readonly VisibleSpan[],
  start: number,
  end: number,
  limit: number,
  kind: "before" | "mention" | "after",
) {
  const from = firstIndex(spans, (span) => span.end >= start);
  const to = firstIndex(spans, (span) => span.start > end);
  const backwards = kind === "before";
  const parts: string[] = [];
  let length = 0;
  for (
    let index = backwards ? to - 1 : from;
    backwards ? index >= from : index < to;
    index += backwards ? -1 : 1
  ) {
    const span = spans[index];
    const separator = span.start === span.end;
    if (
      separator &&
      !(kind === "before"
        ? span.start <= end
        : kind === "after"
          ? span.start >= start
          : span.start > start && span.start < end)
    )
      continue;
    let left = 0,
      right = span.points.length;
    if (!separator && span.end - span.start === span.points.length) {
      left = Math.max(0, start - span.start);
      right = Math.min(span.points.length, end - span.start);
    } else if (!separator && !(span.start >= start && span.end <= end))
      continue;
    if (right <= left) continue;
    const budget = limit + 1 - length;
    const selected = span.points.slice(
      backwards ? Math.max(left, right - budget) : left,
      backwards ? right : Math.min(right, left + budget),
    );
    if (backwards) parts.unshift(selected.join(""));
    else parts.push(selected.join(""));
    length += selected.length;
    if (length > limit) break;
  }
  const visible = Array.from(parts.join(""));
  return {
    text: (backwards ? visible.slice(-limit) : visible.slice(0, limit)).join(
      "",
    ),
    truncated: length > limit,
  };
}
/** Read the whole source before selecting a range: tag fragments must never become visible text. */
export function referenceExcerpt(
  points: readonly string[],
  start: number,
  end: number,
) {
  const spans = visibleSpans(points);
  const before = visibleRange(spans, 0, start, 100, "before");
  const mention = visibleRange(spans, start, end, 160, "mention");
  const after = visibleRange(spans, end, points.length, 120, "after");
  return {
    before: before.text,
    mention: mention.text,
    after: after.text,
    leadingEllipsis: before.truncated,
    mentionEllipsis: mention.truncated,
    trailingEllipsis: after.truncated,
  };
}
