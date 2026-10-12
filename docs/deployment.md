# Deploy no servidor

Front-end: `http://192.168.100.27:4200`. API: `http://192.168.100.27:3000`; readiness em `/health/ready`. Essas portas escutam em todas as interfaces do servidor e são acessíveis diretamente pela rede local, sem túnel SSH.

A implantação usa `deploy/compose.yaml`, projeto Docker Compose `oraculo-search`. O Angular é compilado e servido pelo Nginx com fallback de rotas e proxy `/api/` e `/health/` para a API. Ambos os serviços usam rede do host e reiniciam automaticamente, enquanto o Docker estiver ativo. O backend acessa o Elasticsearch existente por HTTPS em loopback, com CA validada e chave somente de leitura. Este deploy não executa ETL nem seed.

A release inicial está em `/home/gabriel/apps/oraculo-search/releases/20261012-1300`, com snapshots dos dois projetos, incluindo mudanças locais ainda não commitadas. O link `/home/gabriel/apps/oraculo-search/current` identifica a release ativa. Os Dockerfiles fixam Node 24.8.0 e usam `npm ci` com os lockfiles dos projetos.

A configuração privada fica fora das releases, em `/home/gabriel/.config/oraculo-search/private/backend-deploy.env` (permissão 600), contendo `ES_API_KEY` e `CURSOR_SECRET`. A CA fica em `elasticsearch-ca.crt` no mesmo diretório. Nunca inclua esses arquivos no contexto de build nem no front-end.

Operação:

```sh
ssh gabriel@192.168.100.27
cd /home/gabriel/apps/oraculo-search/current/oraculo-front/deploy
docker compose ps
docker compose logs --tail=100 backend frontend
docker compose up -d --wait
```

Para uma nova release, copie os dois projetos para um novo diretório com a mesma estrutura de irmãos, excluindo `.git`, `.env*`, `node_modules`, `dist` e artefatos de testes. Execute as verificações dos projetos, `docker compose build` e `docker compose up -d --wait` a partir de `oraculo-front/deploy`. Atualize o link `current` somente após validar readiness, busca e navegação pelas portas externas. Preserve a release anterior para recuperação.

As portas HTTP publicadas permitem acesso pela rede que alcança o servidor; esta configuração não provisiona domínio, TLS HTTP nem encaminhamento no roteador para a Internet.
