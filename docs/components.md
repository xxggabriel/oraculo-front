# Componentes e novas páginas

As páginas coordenam rota, estado e casos de consulta. Os componentes compartilhados recebem modelos de leitura por inputs e comunicam ações por outputs; não conhecem HTTP, Elasticsearch, contratos gerados ou páginas específicas.

```text
src/app/
  core/                         critérios, modelos e porta de consulta
  application/                  casos de consulta
  adapters/                     transporte HTTP e validação do contrato
  composition/                  providers e rotas lazy
  features/
    search/
      pages/                    SearchPageComponent: URL e coordenação
      state/                    SearchFacade: consultas, cancelamento e cursores
      components/               análise específica da busca
    publications/
      pages/                    PublicationDetailPage: carga e navegação
    jurimetry/
      pages/                    filtros de referências, plots e lista
      state/                    cancelamento e relatório único do recorte
  shared/
    layout/                     shell, cabeçalho e rodapé
    components/
      filters/                  painel, seleção pesquisável, chips e estado puro
      publication-summary/      resumo e snippets de uma publicação
      related-publications/     sugestões, motivos, carga e repetição independentes
      publication-timeline/     cronologia do processo, atual, ausentes e paginação
      distributions/            tabela semântica de distribuição
      charts/                   barras, colunas temporais e tabela acessível
      judicial-distributions/   tribunal → órgão → relator e classes por código
      publication-results/      lista, ordenação e paginação compartilhadas
      search-query/             texto e modo de pesquisa
      search-error/             erros e repetição da consulta
      search-capabilities/      capacidades do acervo
      publication-text/         texto com links nas menções comprovadas
      publication-content/      parsing, formatação e offsets do HTML original
      publication-metadata/     dados da fonte, ausência e ambiguidade explícitas
      hover-card/               abertura, foco, posição e fechamento de prévias
      reference-preview/        link de referência e conteúdo resumido do card
      references/               referências, evidências e retorno ao trecho
      evidence/                 apresentação de evidências
      selected-outputs/         atos e classificações selecionados
      provenance/               origem, revisão e ressalvas
    format.ts                   formatação e rótulos comuns
```

## Adicionar uma página

Crie o componente de rota em `features/<funcionalidade>/pages/` e registre um `loadComponent` em `composition/app.config.ts`. O shell já fornece marca, conteúdo principal, salto de acessibilidade e rodapé. Use os componentes compartilhados diretamente e injete `Research` somente no coordenador ou estado da funcionalidade quando houver consulta. Preserve a validação do adapter e os modelos do núcleo; não copie DTOs de transporte para os componentes.

Extraia para `shared/components` quando o componente tiver um contrato útil em outras páginas. Um componente específico da funcionalidade fica em `features/<funcionalidade>/components`. Evite componentes que recebam a página/facade inteira: passe os dados e eventos necessários. A verificação de fronteiras impede dependências de páginas, aplicação, adapters, composição e contratos nos componentes compartilhados.

## Reutilizar filtros

`FilterPanelComponent` recebe `criteria`, `facets`, `capabilities` e `loading`; emite `apply` com `FilterSelection` e `clear`. O pai executa a consulta e atualiza os critérios aplicados. O painel mantém o rascunho, indica alterações pendentes e permite cancelar. Use um `idPrefix` distinto quando houver vários painéis na mesma página. `FilterChipsComponent` apresenta os critérios aplicados e emite a remoção solicitada.

`FacetSelectComponent` oferece busca local, seleção múltipla e mais opções sem exigir digitação por vírgulas. Mantém os valores observados no mesmo contexto, inclusive seleções fora das facetas atuais. Somente o recorte atual fornece contagens: ausente na faceta significa **sem contagem neste recorte**, não zero. Mudança de texto, modo, processo ou período reinicia o catálogo observado. Facetas truncadas não são apresentadas como catálogo completo do acervo.

Os intervalos prontos usam datas civis locais e limites inclusivos. O período personalizado exige início e fim válidos na operação; o painel verifica preenchimento dos dois limites, sua ordem e o limite de 3.660 dias. A política “Somente sem data” exige “Todo o período”. O backend continua validando a política completa. Eixo temporal e datas ausentes continuam explícitos. **Limpar filtros** preserva texto, modo, ordenação e tamanho da página. No celular, cancelar ou pressionar Escape descarta o rascunho e devolve o foco ao botão de filtros; aplicar fecha o painel e direciona o foco aos resultados.

Os filtros avançados incluem nome das partes, nome do advogado e número da OAB, com UF opcional. Os nomes procuram todos os termos; o número da OAB é comparado após normalização de separadores e maiúsculas, preservando zeros e sufixos. Nome, número e UF do advogado referem-se à mesma pessoa. Os critérios participam do rascunho, chips, URL, limpeza e contexto das facetas, e são usados nas consultas e análises. As capacidades `partyNameFilter`, `attorneyNameFilter` e `oabFilter` determinam a disponibilidade dessas entradas; acervos sem os campos tipados precisam de reprojeção pelo produtor e exibem uma mensagem simples de indisponibilidade por filtro. A publicidade continua compatível com URLs anteriores e com a API, mas não tem controle no painel.

O resumo apresenta o tipo de documento fornecido pela API e a data de publicação quando existente. Se houver somente data de disponibilização, identifica-a como **Disponibilizado em** e informa a ausência da data de publicação; não promove uma data a outra.

## Reutilizar metadados da publicação

`PublicationMetadataComponent` recebe `metadata: JudicialMetadata | null | undefined` e apresenta relator, órgão judicial, classe processual, tipo de documento e grau de instância em uma lista de definição responsiva. O coordenador passa `detail.metadata`; o adapter consome `DetailResponse.metadata` e aceita sua ausência em respostas legadas. `rapporteurStatus` e `instanceDegreeStatus` distinguem `available`, `absent` e `ambiguous`: ausências aparecem como **Não informado**, e ambiguidades como **Informação ambígua na fonte**, sem promover um valor incerto. Tipo de documento em `metadata` e no resumo corresponde a `extensions.tipoDocumento`, com fallback para o tipo da comunicação legado definido pelo back-end. O backend lê somente os sete campos de `extensions` necessários ao detalhe, sem inferir metadados no navegador ou modificar texto e offsets.

## Reutilizar distribuições judiciais

`JudicialDistributionsComponent` recebe `distribution: JudicialDistribution | null`, `population` e `idPrefix`. As seleções de tribunal e órgão são locais ao relatório recebido e não executam consultas ou alteram os filtros globais. A troca de tribunal reinicia o órgão; a identidade da seleção do órgão inclui seu tribunal, preservando homônimos em pais distintos. `idPrefix` separa IDs de múltiplas instâncias. O componente reutiliza `DistributionPlotComponent` e renderiza a tabela de variantes de nome da classe somente após sua abertura. Grupos ausentes e relatores ambíguos não recebem atribuições inventadas. Veja [unidades, denominadores e contrato](jurimetry.md#órgãos-relatores-e-classes).

## Reutilizar texto e referências

Importe `PublicationTextComponent` e `PublicationReferencesComponent` e passe o mesmo texto, identidade, referências e `anchorNamespace` para ambos:

```html
<app-publication-text
  [text]="detail.text"
  [identity]="detail.publication"
  [references]="detail.references"
  [baseHref]="baseHref()"
  anchorNamespace="preview"
  (anchorActivated)="navigateTo($event)"
/>
<app-publication-references
  [text]="detail.text"
  [identity]="detail.publication"
  [references]="detail.references"
  [baseHref]="baseHref()"
  anchorNamespace="preview"
  [activeReference]="activeReference()"
  [sourceAnchor]="sourceAnchor()"
  (anchorActivated)="navigateTo($event)"
/>
```

O namespace isola IDs quando uma página tem várias publicações. `baseHref` deve ser a URL da página com seus query params, antes do fragmento. O output do texto entrega `ReferenceNavigation` com o destino e a ocorrência de origem; o da lista solicita a âncora de retorno. O coordenador pode preservar os query params com o Router, atualizar o fragmento e focar o elemento identificado, como faz `PublicationDetailPage`. Cliques modificados preservam o comportamento nativo de abrir/copiar links. Uma URL copiada também permite focar a referência depois da carga da publicação.

Somente menções com evidência da mesma publicação, revisão e versão de texto e com superfície exata recebem links. Os intervalos são pontos de código Unicode, preservando emoji e caracteres compostos sem deslocar a associação. Evidências auxiliares de contexto não viram links da menção. Sobreposições mantêm todos os destinos, com links numerados para referências adicionais. Duplicatas da mesma ocorrência são unificadas. Uma varredura dos eventos de início/fim evita examinar todos os intervalos para cada trecho.

`PublicationContentComponent` parseia o HTML original e renderiza somente os elementos e atributos passivos permitidos, por templates Angular e interpolação, sem `innerHTML`. A árvore preserva os intervalos do texto original, incluindo tags e entidades, para manter highlights e evidências. Não há identificação de normas por expressão regular no navegador. Veja [contrato de renderização](publication-content.md). A API ainda não fornece URLs canônicas resolvidas: os links levam aos metadados e evidências internos. A interface preserva atribuição desconhecida, revisão pendente e ambiguidade, sem inferir qual tribunal ou norma teria sido citado.

### Cards de referências em linguagem simples

O título do card usa a menção literal (por exemplo, “Súmula 7” ou “Art. 5”), limitado sem dividir caracteres Unicode; o texto completo e a chave canônica ficam em **Detalhes da identificação e evidências**, recolhido mesmo quando o card está ativo. Categorias e tipos recebem rótulos e explicações curtas. Processo da publicação e outro processo mencionado permanecem distintos de citação jurisprudencial. A descrição de súmula se baseia na [explicação do STJ](https://www.stj.jus.br/sites/portalp/Paginas/Comunicacao/Noticias-antigas/2018/2018-03-05_10-14_Tres-novos-enunciados-na-pagina-de-Sumulas-Anotadas.aspx).

A revisão da extração, a atribuição da origem e a correspondência no acervo são estados separados: **Extração revisada** não afirma validade jurídica, e **A conferir** conserva a explicação da revisão pendente. Origens desconhecidas ou ambíguas e vigência não verificada são explícitas. IDs de entidades com estrutura técnica permanecem nos detalhes; não há inferência de qual lei teria sido citada só pelo número de artigo. Códigos novos usam rótulos de indisponibilidade e continuam acessíveis na auditoria.

O contexto é um trecho visível, limitado, do mesmo texto usado pelos links, com a menção destacada. Só aparece se a ocorrência é compatível com a identidade, revisão, versão de texto e superfície. Ao abrir uma menção repetida, contexto e retorno usam essa ocorrência, inclusive o fragmento clicado quando a menção atravessa tags. A ação **Ver no texto da publicação** conserva query params e foco; os detalhes nativos abrem por teclado. Menções presentes apenas em atributos ou subárvores removidas não recebem âncoras de retorno. O texto citado completo e as evidências usam o renderer compartilhado; título e contexto usam texto visível.

### Prévias no hover

`ReferenceLinkComponent` compõe `HoverCardComponent` e `ReferencePreviewComponent`. Recebe referência, texto do link, URL, destino, ocorrência e contexto; preserva cliques modificados e emite a mesma `ReferenceNavigation` usada pela página. Os IDs das prévias combinam namespace, ocorrência e referência, inclusive para links sobrepostos.

O card abre ao passar o mouse ou focar o link pelo teclado. Um pequeno atraso permite cruzar o espaço entre link e card sem fechá-lo. Escape, clique fora e navegação fecham a prévia; o foco continua no link ao usar Escape. Um coordenador mantém apenas uma prévia aberta. A posição prefere abaixo do link e respeita as bordas da tela; quando falta espaço inferior, usa o espaço acima. Navegadores com Popover API apresentam o card na camada superior; os demais usam o overlay fixo.

`ReferencePreviewComponent` apresenta a superfície mencionada, entidade atribuída quando disponível, contexto limitado da ocorrência e estado de revisão/identificação. O contexto é um trecho visível da **publicação**, não uma síntese do inteiro teor da norma ou precedente: esse conteúdo não existe no contrato atual. A prévia não faz consultas adicionais nem gera conteúdo jurídico. Contextos brutos passam pela extração de texto visível; `contextIsPlain` evita parsear novamente um contexto já convertido pelo renderer.

Para usar o comportamento genérico em outra página, projete um link ou botão com `hoverCardTrigger` e o conteúdo sem controles interativos com `hoverCardContent` em `app-hover-card`; forneça `cardId` único e `label`. Relacione o gatilho à prévia usando `aria-describedby` enquanto `open()` for verdadeiro, como faz `ReferenceLinkComponent`.

## Reutilizar sugestões relacionadas

`RelatedPublicationsComponent` recebe `items`, `loading`, `error`, `queryParams` e `idPrefix`; emite `retry`. A página injeta o caso de uso `RecommendRelatedPublications` e controla a carga independente. Os links preservam filtros e destino de retorno, enquanto o componente apresenta os motivos fornecidos pela API. Veja [estratégia e contrato de evolução](related-publications.md).

## Reutilizar linha do tempo

`PublicationTimelineComponent` apresenta publicações já ordenadas e recebe o estado de consulta pelo coordenador, sem consultar HTTP. Processo, paginação, publicação atual e ações têm contratos próprios. Veja [semântica, composição e cancelamento](publication-timeline.md).

## Validar

`npm run check` verifica contratos, fronteiras, lint, tipos, testes e build. Os testes de componentes exercitam rascunho/cancelamento, facetas, presets civis, Unicode, sobreposição, evidências incompatíveis, texto seguro e destinos dos links. Os E2E com fixtures verificam pesquisa/paginação, filtros desktop/mobile, aplicação e cancelamento, período personalizado e texto → referência → trecho, inclusive após recarregar a URL.

Para usar um frontend de fixtures já ativo em outra porta, execute `FRONT_URL=http://127.0.0.1:4201 npm run test:e2e`. Esse frontend precisa ter seu próprio proxy para a API sintética. Não execute os testes que esperam `pub-001` contra o backend do acervo real. A sessão real na porta 4200 mantém seu proxy para a API 3000 e o Elasticsearch remoto.

## Carga e expansão das seções da publicação

`LoadingSkeletonComponent` recebe `label` e `count` (5 por padrão). As linhas são decorativas, com status acessível e animação somente quando a preferência de movimento permite. O detalhe apresenta skeletons de timeline, referências e atos enquanto aguarda a API; a timeline mantém sua própria carga.

Referências e atos/classificações mostram 5 itens inicialmente e revelam até 10 adicionais por clique, até o fim da lista recebida no detalhe. Não fazem requests pelos componentes compartilhados. A paginação reinicia ao trocar os dados/publicação. Uma referência ativa fora do limite revela o bloco correspondente para preservar navegação e foco. A timeline usa buffer/páginas da facade e exibe o tipo de documento da fonte, sem trecho de texto.

### Fixture de filtros de pessoas

O fluxo E2E de pessoas/OAB usa somente o cluster sintético: no back-end, execute `npm run test:seed:participants` conforme `docs/test-environment.md`, e inicie a API isolada. Com o front-end isolado e seu proxy apontando para essa API, execute `PARTICIPANT_FIXTURE=true FRONT_URL=http://127.0.0.1:4201 npm run test:e2e -- -g 'filtros avançados'`. O teste é opt-in porque o seed canônico não inclui os participantes dessa fixture especial. Restaure o seed com `npm run test:seed` no back-end ao terminar.

A UF da OAB usa um select com os 26 estados, Distrito Federal e “Todos os estados”. Esta última opção envia `oabState: null`, removendo somente a restrição de UF e preservando nome/número da OAB. A seleção continua no rascunho até Aplicar filtros.
