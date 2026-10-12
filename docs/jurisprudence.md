# Pesquisa de jurisprudência

A página `/jurisprudencia` pesquisa ementas próprias e o texto das publicações pela API. A fonte do contrato permanece `../oraculo-back/contracts/openapi.json`. O navegador não recebe credenciais nem executa DSL Elasticsearch.

## Interface e unidades

A página reutiliza `SearchFacade` para cancelamento por geração, cursores em memória, revalidação e fechamento de sessões. Critérios aplicados ficam na URL; os filtros conservam rascunho separado. O link do detalhe recebe `returnTo=jurisprudencia`, reconhecido por uma lista explícita de destinos internos.

A interface usa uma coluna de resultados e mantém a busca como ação principal. “Opções de busca” revela os modos de palavras, frase exata e CNJ. “Filtros” abre um diálogo nativo com rascunho, aplicação explícita, fechamento por Escape/área externa e retorno do foco ao botão. O painel prende o foco e bloqueia a rolagem do fundo; fechar descarta alterações não aplicadas. Filtros aplicados permanecem visíveis e removíveis na listagem.

A ordenação é um único controle: **Mais relevantes** usa reranking, **Relevância (todos)** usa BM25 e **Mais recentes** usa data com BM25. O seletor de quantidade fica junto da paginação. A explicação da estratégia e capacidades fica em **Sobre os resultados**, enquanto a limitação de candidatos continua visível quando há truncamento.

`JurisprudenceResultComponent` recebe somente modelos próprios de `core`. Exibe a prévia de `ementa_text` quando disponível, ou o texto da publicação. Não promove ementas citadas/incertas a ementa própria. O produtor entrega proveniência e estado de revisão do recorte; revisão da extração não certifica validade jurídica.

A prévia começa no início do texto, preservando a leitura da ementa. Correspondências fora da prévia da ementa aparecem em um bloco identificado. Quando a correspondência está apenas no corpo, a ementa permanece visível e o trecho da publicação é apresentado separadamente. Trechos já contidos na prévia não são repetidos. Highlights usam partes estruturadas e o parser compartilhado de publicações, sem `innerHTML`. Prévia limitada tem aviso e acesso ao texto completo; expandir exibe somente o conteúdo recebido, sem ocultar a limitação do produtor.

Resultados e totais têm unidade **publicação**, sem deduplicação jurídica por processo. A seleção de jurisprudência é determinada pelo produtor, por ementa própria ou tipos decisórios reconhecidos. Datas são de publicação/disponibilização, não datas de julgamento inferidas. Veja a política e as limitações no módulo de jurisprudência e documentação do back-end.

## Consulta e relevância

O contrato adiciona `collection=jurisprudence` e `ranking=rerank|bm25` aos critérios existentes. A nova página usa `rerank` por padrão. Consulta lexical prioriza a ementa e também consulta o corpo. Frase exata e CNJ têm semânticas próprias; operadores booleanos, curingas e comandos DSL não são interpretados nesta versão.

A relevância refinada reordena uma janela de candidatos em uma segunda etapa lexical de proximidade. A ordem fica estável na sessão, com revalidação de acesso/revisão na entrega de cada página. A API informa modo, versão, janela, número de candidatos e truncamento. A página oferece **Consultar todo o recorte** quando a lista refinada é limitada; BM25 e ordenação por data consultam o recorte completo. Facetas também consultam o recorte completo, em operação separada. Não há afirmação de ranking semântico/neural nem de melhoria medida de relevância.

## Referências de projeto

As fontes abaixo orientaram padrões funcionais, não uma reprodução visual dos serviços:

- [STJ — SOS Pesquisa 2025](https://www.stj.jus.br/sites/portalp/SiteAssets/documentos/2025_folder_sos_pesquisa.pdf): entrada simples e filtros avançados progressivos, ementa e inteiro teor.
- [STF — dicas de pesquisa](https://portal.stf.jus.br/textos/verTexto.asp?pagina=Dicas_de_pesquisa&servico=jurisprudenciaPesquisaGeralNovoPortal) e [apresentação da pesquisa](https://noticias.stf.jus.br/postsnoticias/conheca-a-nova-pagina-de-pesquisa-de-jurisprudencia-do-stf/): ajuda de consulta e ordenação visível. O escopo do Oráculo inclui corpo e ementa e é explicitado na página.
- [Jusbrasil — suporte oficial](https://suporte.jusbrasil.com.br/hc/pt-br/articles/360041544752-Como-fazer-busca-de-Jurisprud%C3%AAncia-no-Jusbrasil): seção própria e percurso da ementa ao documento completo.
- [Find Case Law — guia](https://caselaw.nationalarchives.gov.uk/how-to-search-find-case-law) e [busca avançada](https://caselaw.nationalarchives.gov.uk/search/advanced): filtros incrementais, identificação e escopo claro.
- [CourtListener — técnicas de pesquisa](https://wiki.free.law/c/courtlistener/help/search/advanced-search-and-query-techniques): composição de critérios e ajuda para consultas complexas; operadores deste serviço não são adotados implicitamente no Oráculo.

A implementação considera documentação compatível com Elasticsearch 8.19: [multi-match](https://www.elastic.co/guide/en/elasticsearch/reference/8.19/query-dsl-multi-match-query.html), [highlighting](https://www.elastic.co/guide/en/elasticsearch/reference/8.19/highlighting.html), [rescore e suas restrições](https://www.elastic.co/guide/en/elasticsearch/reference/8.19/filter-search-results.html) e [PIT/search_after](https://www.elastic.co/guide/en/elasticsearch/reference/8.19/paginate-search-results.html). Rescore nativo não é encaixado indiscriminadamente na paginação com múltiplas chaves de ordenação. Consulta, ranking e sessão são responsabilidades do produtor.

## Evolução

Novos filtros por órgão/relator/classe devem começar por critérios tipados no produtor e capacidades verificadas, para evitar confundir autoria com mera menção no texto. Expressões booleanas/proximidade precisam de gramática validada e limites; não enviar consultas arbitrárias do navegador. Um reranker neural futuro deve substituir a estratégia do servidor, conservar os metadados de cobertura e passar por avaliação de relevância e latência em conjunto anotado. Não há serviço de inferência contratado por esta implementação.

Mapeamentos, reprojeção e enriquecimento pertencem ao ETL. Documentos sem ementa continuam pesquisáveis pelo corpo; a atualização do código local não comprova implantação dos campos nem disponibilidade de ementas no acervo operacional.
