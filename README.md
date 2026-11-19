# Smart Farming Platform — Frontend

Interface web da plataforma de agricultura de precisão (Next.js 16, React 19, TypeScript e Tailwind 4). Consome a
API REST do backend: [Smart-Farming-Platform](https://github.com/MLBarbato/Smart-Farming-Platform).

Todas as telas estão integradas à API: login, cadastro, sessão, Dashboard, Fazendas, Talhões (com mapa e desenho
de polígonos), Plantios, Sensores, Monitoramento, Clima, Irrigação, Alertas, Relatórios (exportação em CSV) e
Configurações.

## Requisitos

- Node.js 22 ou superior
- [pnpm](https://pnpm.io/) (versão declarada em `packageManager`)
- Backend em execução (padrão: `http://localhost:8080`), de preferência com os dados de demonstração

## Executar

```bash
pnpm install
cp .env.example .env.local      # ajuste API_ORIGIN se o backend não estiver em http://localhost:8080
pnpm dev                        # http://localhost:3000
```

Outros comandos: `pnpm build` (build de produção), `pnpm start` (servir o build), `pnpm test` (testes),
`pnpm lint`, `pnpm typecheck` e `pnpm gen:api` (regera os tipos da API).

Com os dados de demonstração do backend (`DEMO_DADOS_ENABLED=true`), entre com `ana.demo@example.com` e a senha
definida em `DEMO_SENHA`. Se o backend ficar atrás deste servidor, suba-o com `FORWARD_HEADERS_STRATEGY=native`
para o limite de tentativas de login contar por usuário real e não pelo IP do Next.

## Como o frontend fala com a API

O navegador **nunca** chama o backend diretamente: ele fala só com este servidor Next, que funciona como
intermediário (BFF, *backend for frontend*).

- **Login** (`/api/auth/login`): o servidor chama `POST /auth/login` e guarda o access token e o refresh token
  em **cookies `httpOnly`** (o JavaScript do navegador não consegue lê-los). O navegador recebe só o usuário.
- **Chamadas** (`/api/backend/api/v1/...`): o proxy `app/api/backend/[...path]` anexa o access token, renova a
  sessão sozinho quando ele vence (o refresh token do backend é rotativo; renovações simultâneas são
  compartilhadas) e repassa a resposta. Só encaminha rotas `api/v1/...` e **recusa** `auth/login`, `auth/refresh`
  e `auth/logout`, para os tokens nunca chegarem ao navegador.
- **Sessão** (`/api/auth/session`) devolve o usuário logado; `/api/auth/logout` revoga o refresh token e apaga os
  cookies. `proxy.ts` leva ao login quem abre o painel sem sessão, e `SessionGuard` valida a sessão no cliente.
- Sem CORS: a chamada ao backend é de servidor para servidor (`API_ORIGIN`, só no servidor).

## Mapas

Leaflet com tiles do OpenStreetMap (atribuição exibida no mapa, como a licença exige) e Leaflet-Geoman para
desenhar os talhões. Os mapas só carregam no navegador (`components/mapa`). As coordenadas seguem o GeoJSON do
backend (`[longitude, latitude]`) e a área de um contorno desenhado é calculada no navegador (`lib/geo.ts`).

## Contrato da API

O contrato OpenAPI do backend fica em `http://localhost:8080/v3/api-docs` (Swagger UI em
`http://localhost:8080/swagger-ui.html`). Os tipos em `lib/api/schema.d.ts` são **gerados** dele (`pnpm gen:api`,
com o backend no ar, ou `API_DOCS_URL=<arquivo ou URL> pnpm gen:api`): regere quando o contrato mudar. As chamadas
usam o cliente tipado:

```ts
import { api, dados } from '@/lib/api/client'
const alertas = await dados(api.GET('/api/v1/alertas', { params: { query: { status: ['ABERTO'] } } }))
```

`dados()` devolve os dados ou lança `ApiError` (status, `codigo`, `detalhes` por campo), pronto para o React Query.

## Telas

Login, cadastro, dashboard, fazendas, talhões, plantios, sensores, monitoramento, clima, irrigação, alertas,
relatórios e configurações (rotas em `app/`, componentes em `components/`).
