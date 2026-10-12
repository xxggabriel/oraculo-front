# Oráculo — pesquisa de publicações

Aplicação Angular standalone em português para pesquisar publicações públicas e ativas e consultar distribuições por tribunal, tipo de documento e período. O backend é a única fonte de contratos e a autoridade da política de consulta; o frontend preserva nulabilidade, evidências e unidades.

## Executar

Node **24.8.0** (`nvm use`), Angular runtime **21.2.25**, CLI/build **21.2.26**, TypeScript **5.9.3** e RxJS **7.8.2** estão fixados. O Angular 21 suporta Node 24 e TypeScript 5.9; CLI/build e runtime recebem patches independentes. Vitest **4.0.8** atende o peer do builder. Dependências transitivas estão fixadas no lockfile.

```sh
nvm use
npm ci
npm run contracts:check
npm start
```

Acesse `http://127.0.0.1:4200`. Inicie `../oraculo-back` separadamente na porta 3000 conforme seu README. O proxy encaminha `/api` e `/health` à API. Este repositório não executa containers. Os containers isolados de integração são executados em `gabriel@192.168.100.27` pelo fluxo do backend. Endpoints e credenciais Elasticsearch ficam exclusivamente no backend.

A integração com o **Elasticsearch real do servidor `192.168.100.27`** está configurada no backend com HTTPS, certificado validado e chave somente de leitura. Antes de iniciar a API, execute `npm run es:tunnel -- up` em `../oraculo-back`. Com a API e o frontend ativos, `npm run smoke:live` no backend verifica o fluxo pela porta 4200, incluindo busca, paginação, detalhe, facetas e jurimetria. Veja [configuração e operação do acervo real](../oraculo-back/docs/live-integration.md). Os E2E abaixo exigem o perfil sintético separado e não devem ser executados contra o acervo real.

## Jurimetria por referências

Nova página em `/jurimetria`, com condição de referências jurisprudenciais/normativas (ou ambas), política de validação, lista paginada e plots por tribunal, tipo, mês, presença e referências mais frequentes. Os gráficos usam a população completa admitida e permitem refino por tribunal/tipo. A consulta cruza referências no backend e revalida revisão/seleção/acesso.

O recorte aceita mais de 1.000 candidatos com `PIT`/`search_after`, validação em lotes e destaques de texto apenas na página exibida. A paginação reutiliza o relatório por até dois minutos e revalida os documentos exibidos. Orçamentos de tempo/payload permanecem ativos, sem amostras silenciosas. O painel não estima êxito processual. [Medidas, componentes, semântica e operação](docs/jurimetry.md).

Órgãos judiciais são distribuídos dentro de cada tribunal, e relatores dentro do órgão selecionado. Classes processuais são agrupadas pelo código, exibindo o nome mais frequente e uma tabela dos nomes observados por código. As contagens usam a população completa do mesmo relatório; valores ausentes e relatores ambíguos permanecem explícitos.

## Contratos

`../oraculo-back/contracts/openapi.json` é a fonte de verdade. O frontend versiona uma cópia do contrato, tipos e validadores gerados pelo produtor, sem DTOs manuais de transporte. Após alterar o produtor, execute `npm run contracts:sync`. `npm run contracts:check` verifica SHA-256 e igualdade de cada artefato com o produtor. `ORACULO_CONTRACT_DIR` permite outra localização. Alterar somente o checksum não contorna a comparação dos artefatos.

As verificações de contrato são executadas pelos comandos acima. Este repositório ainda não inclui um workflow de CI; a compatibilidade é verificada contra os artefatos do produtor disponíveis localmente.

## Interface e Tailwind CSS

A apresentação usa **Tailwind CSS 4.3.3**, com `@tailwindcss/postcss` configurado em `.postcssrc.json`, importação e tokens de tema em `src/styles.css`. Layout, tipografia, cores, responsividade e estados ficam nas utilities dos templates Angular. O CSS global limita-se ao tema e a regras base de acessibilidade. Não há CDN, biblioteca de componentes ou fontes externas.

A [pesquisa pública do Jusbrasil](https://www.jusbrasil.com.br/jurisprudencia/) orientou a hierarquia: busca arredondada, ações verdes, navegação por visões, filtros laterais e resultados compactos sobre fundo branco. A identidade, a população e as capacidades são as do Oráculo. [Integração oficial Angular/Tailwind](https://tailwindcss.com/docs/installation/framework-guides/angular).

Filtros oferecem seleção múltipla pesquisável de tribunais e tipos, contagens do recorte atual, valores selecionados visíveis e etiquetas removíveis. O painel separa rascunho e filtros aplicados, com **Aplicar filtros**, **Cancelar alterações** e **Limpar filtros**; limpar preserva a pesquisa. Períodos prontos e personalizados substituem o preenchimento manual obrigatório das datas. No celular, o painel recolhível preserva o espaço dos resultados e permite descartar alterações com Escape.

As páginas foram separadas de estado e apresentação. Shell, filtros, resumos, distribuições, texto, referências, evidências, outputs e proveniência são componentes reutilizáveis, com inputs/outputs próprios. Veja a [estrutura e exemplos de composição](docs/components.md).

No detalhe, referências jurisprudenciais e normativas comprovadas recebem links no próprio texto. Clicar leva aos seus metadados e evidências; o retorno volta à ocorrência clicada. A associação usa os offsets Unicode da API e valida publicação, revisão, versão de texto e superfície. Sobreposições mantêm todos os destinos e não há execução de HTML. Como a API não entrega URLs oficiais resolvidas, o destino é a referência interna da publicação.

O bloco **Dados da publicação** apresenta relator, órgão judicial, classe processual, tipo de documento e grau de instância recebidos da fonte, indicando ausência ou ambiguidade. O filtro **Publicidade do processo** permite escolher públicos, privados/restritos ou ambos na pesquisa e jurimetria, preservando a seleção na URL e nos links. O acesso atual permite apenas publicações públicas: privados retorna vazio com explicação, e ambos consulta somente a população disponível. Não concede acesso a material em segredo de justiça.

A interna também apresenta até quatro [publicações relacionadas](docs/related-publications.md), com o motivo de cada sugestão e carregamento independente. Um caso de uso e uma porta específicos isolam a estratégia para evoluções futuras.

A interna apresenta a [linha do tempo das publicações do processo](docs/publication-timeline.md), ordenada por data de publicação crescente, com datas ausentes ao final, identificação da publicação atual e paginação independente.

## Experiência

A URL conserva texto, modo, tribunal, tipo, CNJ/relação, eixo temporal, datas, tratamento de ausentes, ordenação e tamanho de página. Cursores e IDs de sessão permanecem em memória. O histórico de cursores permite voltar reconsultando a API para revalidar o acesso, sem offsets. Voltar à primeira página reabre o recorte em uma nova sessão; novas condições também encerram a sessão anterior. A rota de detalhe carrega sob demanda e mantém o recorte no link de retorno.

Consultas são explícitas por envio do formulário. Requisições superadas são abortadas e identificadas por geração; respostas antigas não sobrescrevem o estado atual. Não há busca durante digitação, portanto não há debounce. Signals coordenam a apresentação e RxJS observa somente as mudanças de rota. A destruição do workspace cancela requisições e solicita o encerramento da sessão. Esse encerramento é best effort; o backend limita o tempo de vida e a quantidade de sessões quando a comunicação falha.

O HTML das publicações é parseado por um componente compartilhado: parágrafos, títulos, centralização, listas, tabelas e ênfase recebem formatação. Resultados e highlights usam a mesma árvore estruturada; nenhum `innerHTML` é usado. Intervalos de highlight e referências continuam medidos em pontos de código Unicode do conteúdo original. Veja [renderização de publicações](docs/publication-content.md). Gráficos de distribuição são tabelas semânticas com barras decorativas; valores ausentes e recortes sem população têm estados próprios. Propostas não validadas são identificadas no detalhe; não entram em indicadores decisórios.

## Verificar

```sh
npm run lint
npm run typecheck
npm test
npm run build
# API iniciada com fixtures isoladas:
npm run test:e2e
```

`npm run check` inclui contrato, fronteiras de dependência, lint, tipos, unidades e build. Testes Angular substituem `SEARCH_GATEWAY` via provider e exercitam cancelamento, histórico, expiração e encerramento. O adapter valida respostas em runtime. O Playwright consome a API real, sem interceptar chamadas ou substituir Elasticsearch. Instale o browser de teste quando necessário com `npx playwright install chromium`; capturas ficam em `/tmp/oraculo-*.png`.

## Limites

A unidade das distribuições é **publicação**, não processo ou julgamento. Resultados são revalidados na projeção e as contagens da busca se referem ao retrato PIT; distribuições consultam a projeção atual em operação separada. Não certificam completude judicial ou atualização imediata do ledger. O backend sinaliza truncamento, aproximação, ausentes e limitações. Datas civis são exibidas sem conversão de timezone; a data da fonte é um eixo de aquisição separado.

Métricas decisórias, contagem exata de processos e corpus congelado dependem de capacidades comprovadas. Recursos indisponíveis exibem o motivo retornado pela API. Citações e referências não provam existência, força vinculante, aplicabilidade ou vigência. Veja [arquitetura](docs/architecture.md).
