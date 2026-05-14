## Objetivo

Adicionar tradução do site em **Português (padrão)**, **Inglês** e **Espanhol**, com:
- Detecção automática do idioma pela localização do IP na primeira visita
- Seletor manual de idioma no header (🇧🇷 🇺🇸 🇪🇸)
- Conteúdo dinâmico (notícias, servidores, planos) permanece em português

## Stack

- `i18next` + `react-i18next` (padrão de mercado, leve, SSR-friendly)
- Detecção de país via header `cf-ipcountry` (Cloudflare Workers já disponibiliza) através de um `createServerFn`
- Persistência da escolha manual em `localStorage`

## Mapeamento país → idioma

- `pt` (padrão): BR, PT, AO, MZ, CV, GW, ST, TL → ou qualquer país não mapeado
- `es`: ES, MX, AR, CL, CO, PE, VE, UY, PY, BO, EC, CR, PA, DO, GT, HN, NI, SV, CU, PR
- `en`: US, GB, CA, AU, NZ, IE, ZA, IN, SG, e demais países anglófonos

## Arquivos novos

```
src/i18n/
  index.ts              # init do i18next
  locales/
    pt.json             # traduções PT (base)
    en.json             # traduções EN
    es.json             # traduções ES
src/lib/geo.functions.ts # createServerFn que lê cf-ipcountry e devolve idioma sugerido
src/components/language-switcher.tsx
```

## Arquivos modificados

- `src/router.tsx` ou `src/routes/__root.tsx`: importar `i18n` para inicializar; chamar `geo.functions` no `beforeLoad` da rota raiz para definir idioma inicial quando não há preferência salva
- `src/components/site-chrome.tsx`: integrar `LanguageSwitcher` no header (desktop + mobile) e trocar strings fixas (nav, footer) por `t('...')`
- Todas as rotas/páginas com texto hardcoded em PT — substituir por `t('chave')`:
  - `src/routes/index.tsx` (home)
  - `src/routes/servidores.index.tsx`, `servidores.$slug.tsx`, `servidores.tsx`
  - `src/routes/loja.tsx`
  - `src/routes/regras.tsx`
  - `src/routes/reportar.tsx`
  - `src/routes/auth.tsx`
  - `src/routes/conta.tsx`
  - `src/routes/admin.tsx`, `src/routes/admin.pedidos.tsx`
  - `src/components/server-card.tsx` e demais componentes com texto fixo

## Estrutura das traduções (chaves agrupadas por área)

```json
{
  "nav": { "home": "Início", "servers": "Servidores", "shop": "Loja", "rules": "Regras", "report": "Reportar", "account": "Conta", "login": "Entrar" },
  "footer": { "copyright": "...", "tagline": "..." },
  "home": { "heroTitle": "...", "heroSub": "...", "ctaPlay": "Jogar agora", ... },
  "servers": { ... },
  "shop": { ... },
  "rules": { ... },
  "report": { "title": "Reportar", "needLogin": "Login necessário", ... },
  "auth": { ... },
  "account": { ... },
  "common": { "loading": "Carregando...", "save": "Salvar", "cancel": "Cancelar", "delete": "Excluir", "back": "Voltar", ... }
}
```

## Fluxo de detecção

1. App carrega → `i18n.init` com idioma do `localStorage` se existir
2. Se não houver, `__root.tsx` chama `getSuggestedLocale()` (server fn) → lê `cf-ipcountry` → devolve `pt|en|es` → aplica via `i18n.changeLanguage()` e salva
3. Usuário clica no seletor → `i18n.changeLanguage()` + persist em `localStorage`

## Detalhes técnicos

- O `i18next` é importado uma única vez em `src/i18n/index.ts` que faz `i18n.use(initReactI18next).init({ resources: { pt, en, es }, lng: 'pt', fallbackLng: 'pt', interpolation: { escapeValue: false } })`
- A server fn lê `getRequestHeader('cf-ipcountry')` (Cloudflare Workers expõe automaticamente). Fallback `Accept-Language` se header ausente.
- Páginas do **admin** ficam só em PT (decisão pragmática — admin é só para a equipe), mas o seletor continua funcional. Posso traduzir também se quiser; só avise.

## Escopo de trabalho

Esta é uma tarefa **grande** — envolve:
1. Setup do i18n (~3 arquivos novos)
2. Server fn de geo + integração no root (~2 arquivos)
3. Language switcher (~1 arquivo + edição do site-chrome)
4. Substituir strings em **~15 arquivos** de rotas/componentes

Vai gastar muitas mensagens. Posso entregar tudo, mas confirme se quer que eu siga em frente com este escopo completo (incluindo as páginas de admin, ou apenas frontend público).
