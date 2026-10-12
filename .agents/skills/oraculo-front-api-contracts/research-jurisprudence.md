# Pesquisa de jurisprudência e contratos

Pesquisa em 12/10/2026. Proposta, ainda sem implementação ou avaliação operacional.

Separar tipo da comunicação, tipo do ato próprio, representação disponível e referências citadas. O filtro de citações jurisprudenciais não identifica decisões próprias. A política de elegibilidade deve preservar ausência, ambiguidade, revisão e evidências Unicode da versão correta do texto.

Antes de transportar ementas, consumir a família selecionada do ETL, distinguindo atribuição própria/citada/incerta. Uma ementa citada não deve aparecer como ementa do resultado. Para ranking, comparar BM25, campos estruturados, embeddings por segmentos e fusão/reranking com consultas locais anotadas, sem pressupor ganho.

Fontes primárias:

- VICTOR, tipo documental: https://aclanthology.org/2020.lrec-1.181/
- JurisTCU, recuperação em português: https://arxiv.org/abs/2503.08379
- JUÁ, benchmark brasileiro: https://arxiv.org/abs/2604.06098
- LegalSeg, segmentação retórica: https://aclanthology.org/2025.findings-naacl.63/
- Implementação de busca CourtListener: https://github.com/freelawproject/courtlistener

Limites: páginas de autos, acórdãos completos e publicações de diário têm distribuições diferentes. NER e classificação temática não medem elegibilidade de documentos. Avaliar inclusão por classe, extração por trecho e ranking separadamente; separar processos, duplicatas, tribunais e períodos nos conjuntos de teste.
