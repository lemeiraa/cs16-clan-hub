# Plano — Site CS Nostalgia

## Visão geral
Site institucional + portal de servidores Counter-Strike 1.6 em tons de azul/branco (paleta do logo), com dados ao vivo via scraping do GameTracker, loja de cargos VIP e Ammo Packs com pagamento via PIX/Mercado Pago, e entrega manual pelo admin.

## Identidade visual
- Cores: azul profundo do logo (#13428C aprox.) como primário, branco como base, azul-claro de destaque, cinza-escuro para superfícies. Tokens em `src/styles.css` (oklch).
- Tipografia: display condensada/militar (ex.: Oswald/Bebas) para títulos, Inter para corpo.
- Logo enviado em `src/assets/logo-csnostalgia.jpg`, usado no header e favicon.
- Layout escuro opcional (dark default) com acentos em azul vibrante.

## Estrutura de rotas (TanStack Start)
```
src/routes/
  __root.tsx              header + footer compartilhados
  index.tsx               home: hero, grid dos 7 servidores com players/mapa ao vivo
  servidores.tsx          listagem completa
  servidores.$slug.tsx    página individual de cada servidor
  loja.tsx                planos VIP/ADMIN/MASTER/SUPREMO + Ammo Packs (ZP)
  loja.checkout.tsx       confirmação + geração do PIX
  loja.sucesso.tsx        instruções pós-pagamento
  regras.tsx              regras gerais
  api/public/
    gametracker.$slug.ts  scraping cacheado
    mp-webhook.ts         webhook Mercado Pago (assinatura validada)
```

Servidores (slug → ip:porta):
- `4fun-brasil` → 131.196.196.196:27550
- `fypoolday-brasil` → 131.196.196.197:27230
- `zombie-plague-brasil` → 131.196.196.198:27880
- `zombie-plague-venezuela` → 161.129.183.128:27016
- `pregame-venezuela` → 161.129.183.128:27015
- `zombie-escape` → "Em breve"
- `crossfire` → "Em breve"

## Página individual do servidor
- Header: nome, bandeira, IP com botão "copiar" e botão `steam://connect/IP:PORT`.
- Card ao vivo: players online (X/Y), mapa atual, uptime, ping (do GameTracker).
- Tabela de jogadores conectados (nome, score, tempo) extraída do GameTracker.
- Top ranking (top 50) via página `/top_players` do GameTracker.
- Aba "Comandos" e "Regras" (conteúdo estático específico por servidor; ZP terá seção de Ammo Packs).
- Embed/link para o GameTracker original como fallback.

## Dados ao vivo (scraping GameTracker)
- Server function `getServerStatus(slug)` em `src/lib/gametracker.functions.ts`:
  - faz fetch de `https://www.gametracker.com/server_info/IP:PORT/` e `/top_players/`
  - parseia HTML (regex/cheerio leve) para: status, mapa, players atuais/máx, lista de jogadores, top ranking
  - retorna DTO serializável; cacheia em memória 60s (`Cache-Control` na resposta)
  - tratamento de erro: retorna `{ online: false, error }` sem quebrar UI
- Frontend usa `@tanstack/react-query` com `refetchInterval: 30s` para refletir mudanças.
- Importante: scraping pode falhar se o GameTracker mudar HTML — código isolado e com fallback claro ("dados temporariamente indisponíveis").

## Loja
### Planos (mesma estrutura para todos os servidores aplicáveis)
Cards com VIP / ADMIN / MASTER / SUPREMO. Você define preços e benefícios depois (vou começar com placeholders editáveis no código). Botão "Comprar via PIX".

### Ammo Packs (Zombie Plague)
- Slider/input numérico: 1.000 a 500.000 ammo packs, passo 1.000.
- Cálculo: `R$ 10,00 por 1.000 ammo packs` → `preco = qtd/1000 * 10`.
- Resumo em tempo real e botão "Comprar via PIX".

### Fluxo de checkout
1. Usuário preenche: nick no jogo, SteamID (opcional), email/whatsapp para contato.
2. Server function cria preferência Mercado Pago (PIX) e retorna QR code + copia-e-cola.
3. Pedido salvo no Lovable Cloud com status `pending`.
4. Webhook `/api/public/mp-webhook` valida assinatura, marca pedido como `paid` e notifica admin (email via Resend ou apenas painel admin — vou usar painel + email se configurado).
5. Página `/loja/sucesso` exibe instruções: "Seu pedido foi recebido. Um admin aplicará em até X horas."

### Painel admin (mínimo)
- Rota `/admin/pedidos` protegida por role `admin` (tabela separada `user_roles`).
- Lista de pedidos pendentes/pagos com botão "Marcar como entregue".

## Backend (Lovable Cloud)
Tabelas:
- `orders` (id, user_email, nick, steamid, server_slug, plan_or_pack, qty, amount_brl, mp_preference_id, status, created_at, delivered_at)
- `profiles` (id, email, nick)
- `user_roles` (user_id, role) com função `has_role` (padrão de segurança Lovable)

RLS:
- `orders`: usuário vê apenas os próprios; admin vê tudo.
- `user_roles`: somente admin escreve.

## Pagamento — Mercado Pago (PIX)
- Requer secret runtime `MP_ACCESS_TOKEN` (vou pedir após aprovação do plano).
- Webhook secret `MP_WEBHOOK_SECRET` para validação HMAC.
- Server function `createPixPayment(orderId)` chama API `/v1/payments` do MP.
- Webhook em `/api/public/mp-webhook` valida assinatura `x-signature` antes de processar.

## Detalhes técnicos
- TanStack Start v1 + Vite, Tailwind v4 com tokens semânticos, shadcn/ui.
- React Query para todas as chamadas ao vivo.
- Server functions (`createServerFn`) para scraping e MP; rotas server (`/api/public/*`) só para webhook.
- Scraping com `fetch` + parser leve (sem deps Node-only); cache simples em memória do worker.
- Imagens geradas para o hero (cenário CS clássico em tons de azul).
- SEO: cada rota com `head()` próprio (title/description/og).

## O que precisarei depois da aprovação
1. Você confirma os preços de VIP/ADMIN/MASTER/SUPREMO (ou usamos placeholders e você edita).
2. Você cria sua aplicação no Mercado Pago e me passa via formulário de secret: `MP_ACCESS_TOKEN` e `MP_WEBHOOK_SECRET`.
3. Habilitar Lovable Cloud (faço na primeira etapa de implementação).
4. Você cria a primeira conta admin (te ajudo a promover via SQL após signup).

## Riscos / limitações
- Scraping do GameTracker pode quebrar se mudarem HTML — fallback exibido.
- GameTracker pode rate-limitar; cache de 60s mitiga.
- Entrega manual exige sua ação para aplicar VIP/AP nos servidores.
- "Em breve" para Zombie Escape e Crossfire — páginas existirão sem dados ao vivo.

Ao aprovar, começo habilitando Lovable Cloud e construindo a base visual + home com dados ao vivo, depois páginas individuais, e por último loja + checkout PIX.