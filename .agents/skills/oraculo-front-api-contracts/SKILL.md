---
name: oraculo-front-api-contracts
description: Sincronizar e adaptar o consumidor Angular aos contratos do back-end Oráculo, verificando semântica, validação runtime e impactos dos dados do ETL.
---

# Consumidor da API

Leia o [AGENTS.md](../../../AGENTS.md). O produtor fica em `../oraculo-back` e o produtor dos dados em `../oraculo-etl`, relativos à raiz do projeto.

1. Localize a operação em `../oraculo-back/contracts/openapi.json`, seu handler/caso de uso e os mapeamentos em `src/app/adapters/http-search.gateway.ts`.
2. Quando o campo depender de dados persistidos, confirme no ETL tipo, nulabilidade, origem, seleção e identidade. Um schema versionado não prova que o ambiente já disponibiliza o campo.
3. Mude o contrato no produtor quando necessário ao pedido, gere os artefatos com `npm run contracts:generate` no back-end e execute `npm run contracts:sync` no front-end. Não altere DTOs/validadores gerados manualmente nem apenas o checksum.
4. Converta transporte em modelos próprios de `core` no adapter. Preserve validação runtime, erros tipados, `AbortSignal`, revisão/seleção e restrições de acesso. O núcleo e componentes compartilhados não importam tipos de transporte.
5. Execute `npm run contracts:check` nos dois projetos e os testes dos adapters/consumidores alterados. Use `npm run check` no front-end para o conjunto completo.

O filtro de publicidade é uma condição sobre o acesso permitido: `restricted` e `both` não autorizam conteúdo privado. Ausência de dados deve continuar explícita, sem preencher metadados ou links por inferência.

Documente compatibilidade, eventual necessidade de implantação/migração do produtor e as verificações que faltam. Não confunda contratos locais compatíveis com integração operacional verificada.
