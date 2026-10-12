# Jurimetria por referências

Página: `/jurimetria`. A navegação principal oferece Pesquisa e Jurimetria. A página começa na preparação de filtros, sem executar um cruzamento de todo o acervo. Consultar, pesquisar ou aplicar filtros grava as condições na URL e solicita a análise.

## Perguntas e medidas

O painel permite comparar onde estão as publicações citantes, quais tipos oficiais predominam, em quais meses se concentra o volume e quais referências aparecem em mais publicações. Tribunal e tipo podem ser selecionados nas barras para refinar o recorte. A lista oferece a leitura dos documentos que sustentam a comparação, com retorno ao mesmo recorte após abrir o detalhe.

| Visual                               | Medida e denominador                                                                   |
| ------------------------------------ | -------------------------------------------------------------------------------------- |
| Publicações no resultado             | Documentos públicos/ativos admitidos após a condição de referências                    |
| Antes da condição de referências     | Todos os candidatos admissíveis para tema, tribunal, tipo, processo e datas            |
| Parcela do recorte original          | Resultado / candidatos; sem denominador, exibe “—”                                     |
| Tribunal, tipo e mês                 | Publicações do resultado; ausentes e valores omitidos ficam explícitos                 |
| Presença de referências              | Grupos exclusivos: só jurisprudenciais, só normativas, ambas ou nenhuma admissível     |
| Referências mais frequentes          | Até 20 chaves por publicações distintas que as mencionam; as barras não são exclusivas |
| Publicações e menções por referência | Documentos únicos e ocorrências distintas da mesma chave; não são a mesma medida       |

Percentuais dos gráficos gerais usam a população completa do resultado, mesmo quando o gráfico recolhe valores. Órgãos e relatores usam o grupo pai completo, conforme descrito abaixo. Expandir revela todos os valores recebidos, e não recupera categorias omitidas pela consulta. O ranking não inventa contagens de outros ou não informado, pois a API não fornece esses resíduos. Colunas temporais representam meses informados; não preenchem períodos ausentes nem estimam tendência.

Esses indicadores ajudam a selecionar e comparar documentos para leitura. Não estimam êxito processual, força vinculante ou vigência de normas. Publicação, processo e julgamento são unidades distintas.

O ranking e a tabela de frequência exibem somente o nome visível da menção, com prefixo **Jurisprudência:** ou **Normativa:**. HTML e entidades são convertidos antes do limite de caracteres. Sem nome legível, mostram **Nome não informado**. A chave interna continua identificando o grupo na API e no tracking, sem aparecer nos rótulos nem alterar as contagens.

## Órgãos, relatores e classes

O bloco **Órgãos judiciais e relatores** explora a hierarquia tribunal → órgão judicial → relator, com seletores locais ao relatório. O mesmo nome de órgão em tribunais diferentes e o mesmo relator em órgãos diferentes permanecem em grupos separados. Selecionar esses pais modifica apenas a apresentação do relatório já recebido; não refaz o recorte ou suas contagens. As barras de órgãos usam as publicações do tribunal escolhido como denominador; as barras de relatores usam as publicações do órgão escolhido, incluindo aquelas sem relator informado ou com atribuição ambígua. Esses dois resíduos são apresentados separadamente, sem atribuir um nome incerto.

**Classes processuais por código** usa `extensions.codigoClasse` como identidade do grupo e apresenta o nome mais frequente de `extensions.nomeClasse` junto ao código. A tabela **Ver nomes por código** conserva as variantes observadas e suas frequências. Nomes iguais com códigos diferentes permanecem distintos; nomes diferentes com o mesmo código não dividem a classe. Publicações sem código não são agrupadas apenas pelo nome. Os percentuais usam todas as publicações do resultado; ausências de código e nome são informadas, e nenhum nome é inferido a partir de um catálogo externo.

O backend agrega os oito campos de `extensions` durante o mesmo scan/PIT integral, depois da condição de referências e antes da paginação, sem consultas adicionais por publicação. `judicialDistribution` integra o mesmo relatório e cache dos demais gráficos. O adapter verifica as partições: órgãos somam o tribunal; relatores confirmados, ausentes e ambíguos somam o órgão; tribunais somam a população; classes mais códigos ausentes somam a população; variantes de nome e ausências somam cada classe. Partições incoerentes são recusadas antes de exibir indicadores. A propriedade é opcional para compatibilidade com respostas antigas; nesses casos o bloco indica indisponibilidade.

## Filtros e política

Os critérios gerais reutilizam o painel de filtros da pesquisa: texto/modo, tribunal, tipo oficial, processo e relação CNJ, eixo temporal, datas inclusivas e política para datas ausentes. A condição de referências aceita qualquer documento, jurisprudenciais, normativas, uma ou outra família e ambas.

“Incluir menções não validadas” vem marcado explicitamente. Inclui referências selecionadas não rejeitadas; desmarcado admite apenas `validated`. Aplicar uma nova consulta atualiza lista e gráficos juntos e remove resultados anteriores durante a carga ou diante de erro. Paginar preserva os mesmos critérios e reutiliza o relatório observado por até dois minutos; cada página revalida acesso e seleção dos documentos exibidos. Consultar novamente recalcula o relatório. Uma URL com página fora do intervalo retorna à primeira página válida.

Família jurisprudencial conta somente ocorrências cujo papel é `jurisprudential_citation`. O número do próprio processo, referências a outros processos e papéis indeterminados não são contados como precedentes. Atribuição ou identificação desconhecida permanece desconhecida; a frequência não resolve a ambiguidade.

## Integração e limites

Operação: `POST /api/v1/jurimetry/references/query`, com contrato gerado no backend e validado pelo adapter HTTP. `ReferenceJurimetry` delega ao port do núcleo; `JurimetryFacade` cancela consultas superadas e mantém um único relatório para lista e gráficos. Os plots recebem somente dados de leitura, sem acesso à API.

Na construção do relatório, o backend cruza publicações, manifestos selecionados e referências; verifica revisão, versão do texto, hashes, seleção de atos e evidências, deduplica ocorrências e revalida os heads percorridos no cruzamento. Nos filtros que exigem referências, a contagem original vem do PIT completo e documentos sem enriquecimentos selecionados são descartados antes do cruzamento. Nenhum índice ou dado de produção é criado ou alterado por essa operação. A fonte é a projeção Elasticsearch do servidor configurado; o ledger continua sendo a autoridade.

Não há teto de mil candidatos. O backend percorre o recorte com `PIT` e `search_after`, valida as referências em lotes e calcula os gráficos sobre todos os documentos admitidos. Destaques de texto são solicitados apenas para a página exibida. Permanecem os orçamentos de oito segundos por operação e de quatro MB por resposta Elasticsearch. Recortes muito amplos, textos grandes ou muitas referências ainda podem exigir filtros adicionais; não se retorna uma amostra como população. A análise requer as duas famílias disponíveis, pois compara ambas e mantém uma categoria de presença coerente.

Registros selecionados ausentes/duplicados ou mudança dos heads geram erro, sem gráficos parciais. Manifestos incompatíveis são excluídos com aviso; nenhuma referência admissível não comprova ausência de menção no texto. Erros conservam os filtros para refino/repetição. Lista e gráficos pertencem ao relatório observado. A paginação reutiliza contagens e ordem do relatório enquanto disponível; `observedAt` identifica quando a análise foi feita. Após expiração ou descarte do cache, a consulta recalcula o recorte. A projeção não oferece transação global com o ledger.

## Componentes e validação

- `features/jurimetry/pages`: coordenação da rota, controles de referências e montagem do painel.
- `features/jurimetry/state`: geração, cancelamento e estado do relatório.
- `core/jurimetry.ts` e `application/reference-jurimetry.ts`: modelos próprios e caso de consulta.
- `shared/components/charts`: plots reutilizáveis, escala, percentuais, expansão e tabelas acessíveis.
- `shared/components/publication-results`, `search-query`, `search-error`, `search-capabilities` e `filters`: usados por ambas as páginas.

`npm run check` executa contratos, fronteiras, lint, tipos, testes e build. Os E2E em frontend isolado de fixtures exercitam famílias, revisão, gráficos, refino, paginação, retorno do documento e layout mobile. Use `FRONT_URL=http://127.0.0.1:4201 npm run test:e2e -- --workers=1` com proxy para a API sintética; testes que esperam `pub-001` não devem usar o acervo real.

Semântica e execução do backend: [reference-jurimetry.md](../../oraculo-back/docs/reference-jurimetry.md).
