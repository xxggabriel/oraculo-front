# Linha do tempo de publicações

A interna contém **Publicações do mesmo processo**, com acesso pela navegação **Linha do tempo**. A lista vai da publicação mais antiga à mais recente, usando exclusivamente `publicationDate`, com desempate por ID. Publicações sem data ficam ao final em um grupo explícito; aquisição e disponibilização nunca substituem a data de publicação. O item aberto recebe **Você está nesta publicação**.

O backend resolve o processo da origem, sem usar os CNJs indiscriminados do resumo ou extrair números no navegador. Quando há vários processos vinculados, a seção oferece seleção. A consulta não herda os filtros da pesquisa: eles permanecem na URL dos links para o retorno ao recorte. Somente publicações acessíveis no acervo entram na lista; não é apresentado como andamento judicial oficial completo.

`ReadPublicationTimeline` é o caso de uso do frontend sobre `PublicationTimelineGateway`. `PublicationTimelineFacade` tem escopo da página, controla cancelamento, identidade/geração, processo selecionado e paginação. A carga e os erros são independentes do documento e das recomendações. Falha ao carregar mais preserva os itens anteriores e permite repetir só a página pendente; troca de origem/processo cancela requests antigos. Respostas agregadas são deduplicadas e ordenadas, inclusive entre cargas que observam mudanças na projeção.

`PublicationTimelineComponent` recebe relatório, publicações, publicação atual, processo escolhido, carga, erro e query params; emite `selectProcess`, `loadMore` e `retry`. `idPrefix` permite múltiplas instâncias. A timeline não renderiza o texto da publicação. Exibe `sourceDocumentType`, proveniente de `extensions.tipoDocumento` da fonte, com ausência explícita; esse campo é distinto do tipo de comunicação. Carregar mais move o foco ao primeiro item novo depois da renderização, mantendo os guards de origem/processo. A auditoria da consistência permanece em detalhes recolhidos.

`POST /api/v1/publications/{id}/timeline/query` recebe `{cnj: string | null, page: number, pageSize: 20}`. Há vinte itens por página e janela máxima de 10.000 candidatos, sinalizada como lista parcial quando ultrapassada. O relatório descreve contagens da projeção e revalidação de acesso; não há PIT persistido nem garantia de corpus congelado entre páginas. Sem vínculo elegível, mostra um estado explícito, em vez de promover processos incidentais.

A política `comunica_v2_legacy_metadata` permite ler, sem gravar ou reclassificar registros, o processo oficial de um formato legado específico: Comunica 2.0.0/schema 1, único vínculo válido com número original compatível e proveniência conhecida. Os detalhes explicam essa compatibilidade; outros processos referenciados não são promovidos. O total da API conta candidatas antes da validação, por isso o cabeçalho informa apenas o número efetivamente exibido.

O producer define contrato, política de vínculos, estados e revalidação em `oraculo-back/docs/publication-timeline.md`. O adapter HTTP valida o schema e checa origem, página, processo escolhido, IDs únicos, pertencimento ao processo e ordem por data antes de aceitar a resposta.

## Validação no navegador

O fluxo é interna → Linha do tempo → carregar mais → foco no primeiro item novo → abrir publicação com contexto preservado. Os E2E usam a API de fixtures isoladas, com um worker e lotes menores para respeitar os limites reais de concorrência e requisições da API. Cada lote deve começar com a API temporária de fixtures recém-iniciada; a API do acervo real na porta 3000 permanece intacta. Não aumente os limites de produção para acomodar a suíte.

```sh
FRONT_URL=http://127.0.0.1:4201 npm run test:e2e -- --workers=1 tests/e2e/research.spec.ts tests/e2e/timeline.spec.ts
# Após reiniciar somente a API temporária de fixtures em 3001:
FRONT_URL=http://127.0.0.1:4201 npm run test:e2e -- --workers=1 tests/e2e/jurimetry.spec.ts tests/e2e/reference-cards.spec.ts tests/e2e/related.spec.ts
```

Cada `TimelineItem` inclui `recipients` (nome e polo literal) e `attorneys` (nome, número e UF de OAB literais), lidos de `publications.destinatarios` e `publications.destinatarioadvogados[].advogado`, já projetados pelo ETL. Ausência é `null`; lista vazia permanece `[]`. Os campos são opcionais no transporte para permitir respostas anteriores, mas o produtor atualizado sempre os devolve. Não altera `Summary` nem aumenta o payload da busca.

A interface apresenta partes destinatárias e advogados destinatários, com polos A/P como ativo/passivo e outros valores preservados. Esses registros não comprovam a lista completa de partes nem associam cada advogado a uma parte. OAB ausente é explícita; número e UF não são inferidos. Não requer mudança de schema/mapping do ETL; registros antigos sem os metadados continuam com ausência explícita.

A interface exibe inicialmente 5 publicações. “Mostrar mais 10 publicações” revela até 10 adicionais: utiliza primeiro os itens já carregados e consulta a próxima página HTTP de 20 apenas quando necessário. O buffer conserva ordenação/deduplicação, cancelamento e revalidação. Trocar publicação ou processo reinicia o limite em 5. Skeletons substituem a lista durante a carga inicial e acompanham a carga de páginas adicionais.
