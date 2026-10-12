# Oráculo — front-end

## Contexto e projetos relacionados

Aplicação Angular standalone, TypeScript e Tailwind CSS para busca de publicações, detalhe e jurimetria. Use Node definido em `.nvmrc` e versões de `package.json`/`package-lock.json`.

- [Back-end](../oraculo-back/AGENTS.md): produtor da API e autoridade dos critérios, acesso, seleção e indicadores.
- [ETL](../oraculo-etl/AGENTS.md): produtor dos registros, revisões, textos, metadados e enriquecimentos consumidos pelo back-end.
- Fluxo: ETL → projeção Elasticsearch → back-end → front-end. O ledger PostgreSQL do ETL é a autoridade de persistência; a API consulta a projeção.

Antes de alterar campos, filtros, referências ou unidades dos gráficos, verifique o contrato do back-end e o significado dos dados no ETL. Mudanças apenas visuais não exigem editar os outros projetos. Registre os impactos identificados e faça mudanças relacionadas quando necessárias ao pedido.

## Arquitetura

- `src/app/core/`: modelos e portas próprios, sem Angular, transporte, contratos gerados ou Elasticsearch.
- `src/app/application/`: casos de uso independentes de framework.
- `src/app/adapters/http-search.gateway.ts`: valida transporte em runtime e converte DTOs para modelos do núcleo.
- `src/app/composition/`: rotas e providers com `InjectionToken`/factories.
- `src/app/features/`: páginas e estado por funcionalidade; facades coordenam URL, cancelamento e sessões.
- `src/app/shared/components/`: apresentação reutilizável com inputs/outputs; não consulta API nem importa páginas.
- Tailwind nos templates; tokens e regras base em `src/styles.css`. Preserve a hierarquia de leitura inspirada no Jusbrasil e a identidade do Oráculo.

## Contratos e apresentação

`../oraculo-back/contracts/openapi.json` é a fonte do contrato HTTP. Não edite manualmente `contracts/generated/`; use os scripts de sincronização. Credenciais e detalhes Elasticsearch ficam no back-end.

Preserve ausência, ambiguidade, proveniência e limitações retornadas pela API. Publicações, processos e unidades decisórias têm grãos diferentes. Não derive chance de êxito de frequência de referências. Exiba nomes interpretáveis e o tipo jurisprudencial/normativo, sem apresentar chaves internas como rótulos.

Renderize HTML pelo componente/parser compartilhado, sem `innerHTML` ou bypass do sanitizador. Os offsets de evidências são intervalos `[start,end)` em pontos de código Unicode do texto original; entidades HTML e decoração não podem deslocar as referências. Não invente URLs oficiais.

Filtros distinguem rascunho e critérios aplicados; URL preserva critérios e sessões/cursores ficam em memória. Requisições superadas não devem atualizar a página. Preserve navegação por teclado, foco, hover cards, estados vazio/erro/carregamento e usabilidade em telas pequenas.

## Comandos e verificação

```sh
nvm use
npm ci
npm run contracts:check
npm start
npm run check
```

Após mudar a API no produtor, execute `npm run contracts:sync` aqui. `npm run check` cobre contrato, fronteiras, lint, tipos, unidades e build. `npm run test:e2e` usa a API real com fixtures isoladas do back-end; não execute contra o acervo operacional. Consulte `playwright.config.ts` e o README antes de iniciar servidores adicionais.

O desenvolvimento usa front-end em `127.0.0.1:4200` e proxy para API na porta 3000. Containers de integração executam em `gabriel@192.168.100.27`, pelo fluxo do back-end. Não coloque acesso ao cluster no navegador.

## Skills e perfis de agentes

- [Componentes e UX](.agents/skills/oraculo-front-components/SKILL.md): composição de páginas e apresentação de publicações.
- [Contrato da API](.agents/skills/oraculo-front-api-contracts/SKILL.md): mudanças de transporte e compatibilidade.
- [Implementador de interface](.agents/agents/frontend-implementer.md).
- [Revisor de contratos e UX](.agents/agents/frontend-reviewer.md).

Os perfis são instruções de referência para atribuir trabalho; não registram agentes executáveis nem autorizam ações externas por si próprios. Leia apenas a skill/perfil pertinente à tarefa. Mais contexto em [arquitetura](docs/architecture.md), [componentes](docs/components.md) e [jurimetria](docs/jurimetry.md). Atualize estas orientações quando os fluxos mudarem.
