---
name: oraculo-front-components
description: Implementar componentes, páginas e UX do Oráculo Angular/Tailwind, incluindo filtros, publicações, referências e gráficos de jurimetria.
---

# Componentes e UX do Oráculo

Leia o [AGENTS.md do projeto](../../../AGENTS.md) e o [catálogo de componentes](../../../docs/components.md). Localize a página, facade e componentes compartilhados envolvidos antes de editar.

## Implementar

- Componha páginas em `features`; mantenha estado/URL/cancelamento nas facades e apresentação em `shared/components`. Reutilize modelos de `core` e componentes existentes antes de criar novos.
- Use Tailwind e os tokens de `src/styles.css`. Preserve labels em português, foco visível, teclado e legibilidade nos filtros e gráficos.
- Filtros têm rascunho e aplicação explícita. Limpar filtros preserva o texto pesquisado; cursores não entram na URL. Confira os comportamentos existentes em `filter-state.ts` e `criteria-url.ts`.
- Para texto, resumo e evidências, reutilize o parser de `publication-content`; confira [renderização](../../../docs/publication-content.md). Preserve offsets Unicode, revisão, versão de texto e todos os destinos de referências sobrepostas.
- Hover cards devem funcionar por foco e ponteiro, com fechamento e posicionamento acessíveis. Destinos só podem usar informações comprovadas pela API.
- Relacionadas e timeline usam casos de uso e carga independentes. Preserve a ordenação por data de publicação e a identificação da publicação atual.
- Nos gráficos, respeite unidades, população, ausentes e limites da API; nomes de classe são apresentados sobre grupos por código, relatores dentro do órgão e órgãos dentro do tribunal.

## Verificar

Execute testes dos componentes/facades afetados e `npm run lint`, `npm run typecheck`, `npm run build`. Quando a interação mudar, use os E2E pertinentes com API/fixtures isoladas e confira teclado e larguras pequenas. Não afirme verificação visual apenas com base em build.

Se precisar de um novo campo ou semântica, use a [skill de contratos](../oraculo-front-api-contracts/SKILL.md). Relate mudanças, validações realmente executadas e limitações observadas.
