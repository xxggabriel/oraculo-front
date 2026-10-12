export const civilDate = (date: string | null): string =>
  date ? date.split("-").reverse().join("/") : "Não informada";
export const number = (value: number): string =>
  new Intl.NumberFormat("pt-BR").format(value);
export const fieldLabels: Partial<Record<string, string>> = {
  court: "Tribunal",
  documentType: "Tipo de documento",
  period: "Período",
};
export const axisLabels: Partial<Record<string, string>> = {
  publication: "Publicação",
  availability: "Disponibilização",
  source: "Data da fonte (aquisição)",
};
export const featureLabels: Partial<Record<string, string>> = {
  search: "Pesquisa",
  courtFilter: "Filtro por tribunal",
  documentTypeFilter: "Filtro por tipo",
  publicationDate: "Data de publicação",
  availabilityDate: "Data de disponibilização",
  sourceDate: "Data da fonte",
  facets: "Facetas",
  publicationMetrics: "Distribuição de publicações",
  acts: "Atos selecionados",
  decisionUnits: "Unidades decisórias",
  classifications: "Classificações",
  citations: "Citações jurisprudenciais",
  normativeReferences: "Referências normativas",
  decisionMetrics: "Indicadores decisórios",
  exactProcessCount: "Contagem exata de processos",
  ledgerAccess: "Acesso atualizado pelo ledger",
  frozenCorpus: "Corpus congelado",
};
export const reviewLabels: Partial<Record<string, string>> = {
  proposed: "Proposta não validada",
  unreviewed: "Não revisado",
  validated: "Validado",
  rejected: "Rejeitado",
  needs_review: "Revisão necessária",
};

export const processNumber = (cnj: string): string =>
  /^\d{20}$/.test(cnj)
    ? `${cnj.slice(0, 7)}-${cnj.slice(7, 9)}.${cnj.slice(9, 13)}.${cnj.slice(13, 14)}.${cnj.slice(14, 16)}.${cnj.slice(16)}`
    : cnj;
