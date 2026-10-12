# Fronteiras e composição

Decisão: usar Tailwind CSS 4.3.3 por PostCSS, com utilities diretamente nos templates e tokens de tema no CSS global. A interface pública de [pesquisa do Jusbrasil](https://www.jusbrasil.com.br/jurisprudencia/) serviu de referência para busca arredondada, superfícies brancas, tipografia sans, metadados compactos, filtros laterais e ações verdes. Identidade e semântica continuam próprias do Oráculo.

O composition root resolve rotas e providers; o shell compartilhado apresenta a marca e a estrutura da página. A busca mantém visões de publicações/jurimetria, seleção múltipla pesquisável, rascunho de filtros e etiquetas removíveis para critérios aplicados. O envio aplica as condições; cancelar descarta o rascunho e limpar preserva a pesquisa. Em mobile, filtros recolhíveis preservam espaço e foco nos resultados. O detalhe mantém uma coluna de leitura, links nas menções comprovadas e proveniência lateral. Não há CSS de componentes paralelo às utilities; regras base definem foco acessível e os tokens. Transições de cor são breves; animação de carregamento usa `motion-safe`.

- `core/search.ts`: critérios imutáveis, modelos de leitura próprios, erros e `SearchGateway`.
- `application/research.ts`: casos de consulta delegam às responsabilidades explícitas do gateway. Não importam framework, transporte ou schema gerado.
- `adapters/http-search.gateway.ts`: único consumidor dos tipos/validadores derivados do OpenAPI. Valida requests/responses e mapeia para modelos de leitura do núcleo. `fetch` recebe `AbortSignal` e mantém credenciais do cluster fora do navegador.
- `composition/search.providers.ts`: `InjectionToken<SearchGateway>` resolve a implementação. `Research` recebe o gateway por construtor. Interface TypeScript não é usada como token.
- `features/search/pages`: rota e coordenação de URL/eventos; `state`: facade de Signals, geração/cancelamento, histórico de cursores e encerramento de sessão; `components`: análise específica da busca. Os controles de pesquisa, capacidades, erros e resultados ficam em `shared/components`, usados também pela página de jurimetria.
- `features/jurimetry/pages` e `state`: nova rota `/jurimetria`, filtros de presença de referências, relatório único e plots; caso `ReferenceJurimetry` sobre port próprio. [Semântica e limites](jurimetry.md).
- `features/publications/pages`: rota lazy, carga do detalhe e navegação entre texto e referência. Recomendações carregam independentemente pelo caso `RecommendRelatedPublications`, sobre `core/related-publications.ts`; o componente compartilhado apenas apresenta os itens. [Estratégia e evolução](related-publications.md).
- `shared/layout`: shell, cabeçalho e rodapé.
- `shared/components`: apresentação reutilizável de filtros, resumos, distribuições, texto com referências, evidências, outputs e proveniência. Recebe modelos do núcleo e emite ações, sem consultar a API ou importar páginas. Catálogo e exemplos: [components.md](components.md).

A verificação automatizada bloqueia imports de Angular, adapters, composição, contratos e Elasticsearch no núcleo/aplicação, além de dependências de páginas e transporte nos componentes compartilhados. Os testes substituem o provider de gateway, sem alterar os consumidores.

## Semântica e estados

O frontend não decide acesso, revisão, seleção ou denominadores. A API aplica políticas e fornece o resultado e suas ressalvas. Publicação, processo, ato e unidade decisória mantêm identidade distinta. Campo ausente é exibido como não informado, nunca convertido a negativa ou zero.

CNJ tem campo de relação explícito e modo automático preserva a estratégia definida pelo backend. Palavras/Automático ignoram stopwords comuns em português na API, com proteção de negações e identificadores; frase exata e CNJ preservam o texto. A URL mantém a pesquisa digitada, e consultas somente com stopwords geram zero resultados. Texto vazio consulta o recorte. Filtros compartilham URL; cursores nunca entram na URL. Voltar reconsulta cursores em memória. A primeira página reabre o recorte com nova sessão, pois a API não publica um cursor inicial. Ao abrir detalhe a sessão é encerrada; voltar executa novamente o recorte. Erros de expiração conservam os filtros e permitem reinício.

A busca revalida acesso na projeção, com contagens de um retrato PIT. Facetas e distribuições são consultas separadas da projeção atual e podem observar mudanças ocorridas entre operações; essa diferença é explicada na interface. Não há promessa de acesso imediato do ledger nem corpus congelado.

## Catálogo de fluxos

| Fluxo                   | Entrada                                              | Operação                                        |
| ----------------------- | ---------------------------------------------------- | ----------------------------------------------- |
| Busca lexical/frase/CNJ | Texto, modo e critérios                              | `POST /api/v1/publications/search`              |
| Página seguinte         | Mesmo recorte, cursor em memória                     | mesma operação                                  |
| Página anterior         | Histórico de cursores; primeira página reabre sessão | consulta com revalidação, sem offset remoto     |
| Facetas                 | Mesmo recorte                                        | `POST /api/v1/search/facets`                    |
| Distribuições           | Mesmo recorte, publications, proposals=false         | `POST /api/v1/jurimetry/query`                  |
| Referências citadas     | Mesmo recorte + presença + política de validação     | `POST /api/v1/jurimetry/references/query`       |
| Detalhe                 | ID estável                                           | `GET /api/v1/publications/{id}`                 |
| Relacionadas            | ID da publicação aberta                              | `GET /api/v1/publications/{id}/related`         |
| Timeline do processo    | ID + processo vinculado + página                     | `POST /api/v1/publications/{id}/timeline/query` |
| Capacidades             | sem parâmetros físicos                               | `GET /api/v1/search/capabilities`               |
| Encerrar sessão         | ID opaco em memória                                  | `POST /api/v1/search/sessions/close`            |

Transportes invalidam respostas fora do schema antes da apresentação. Erros tipados preservam `requestId`, sem publicar dados internos de cluster. O frontend não aceita DSL, nomes físicos ou scripts.

Os validadores standalone gerados reutilizam somente os runtimes `ucs2length` do AJV e formatos do `ajv-formats`, ambos CommonJS. Essas duas dependências estão explicitamente admitidas no builder; o núcleo não importa o AJV. Interop é gerado no produtor e testado no consumidor.
