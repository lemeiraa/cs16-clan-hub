// Catálogo central de servidores CS Nostalgia.
// Slug é a chave usada nas rotas e no scraping do GameTracker.

export type ServerInfo = {
  slug: string;
  name: string;
  short: string;
  ip: string;
  port: number;
  country: "BR" | "VE";
  flag: string;
  mode: string;
  description: string;
  comingSoon?: boolean;
  rules: string[];
  commands: { cmd: string; desc: string }[];
};

export const SERVERS: ServerInfo[] = [
  {
    slug: "4fun-brasil",
    name: "4Fun Brasil Clássico",
    short: "4Fun BR",
    ip: "131.196.196.196",
    port: 27550,
    country: "BR",
    flag: "🇧🇷",
    mode: "Classic + Zueira",
    description:
      "Servidor 4Fun no estilo clássico do Counter-Strike 1.6 com aquele toque de zueira da galera. Mapas variados, comunidade ativa.",
    rules: [
      "Proibido qualquer tipo de cheat, hack, bug ou wallhack.",
      "Respeite os outros jogadores — sem flood, racismo ou discurso de ódio.",
      "Sem propaganda de outros servidores no chat.",
      "Spawnkill repetitivo gera kick/ban do admin.",
      "Decisão dos administradores é final.",
    ],
    commands: [
      { cmd: "/menu", desc: "Abre o menu principal do servidor" },
      { cmd: "/vip", desc: "Mostra os benefícios e como adquirir VIP" },
      { cmd: "/admins", desc: "Lista admins online no momento" },
      { cmd: "/rules", desc: "Mostra as regras do servidor" },
    ],
  },
  {
    slug: "fypoolday-brasil",
    name: "Fy Pool Day Brasil",
    short: "Fy Pool Day BR",
    ip: "131.196.196.197",
    port: 27230,
    country: "BR",
    flag: "🇧🇷",
    mode: "Fun Map / 24h",
    description:
      "O clássico fy_pool_day rodando 24/7 em servidor brasileiro de baixo ping. Diversão garantida.",
    rules: [
      "Proibido cheats, hacks ou exploits.",
      "Mantenha o respeito no chat e mic.",
      "Sem campers excessivos atrás do mapa.",
      "Admins têm a palavra final.",
    ],
    commands: [
      { cmd: "/menu", desc: "Menu de funções do servidor" },
      { cmd: "/vip", desc: "Vantagens VIP" },
      { cmd: "/nominate", desc: "Sugerir próximo mapa" },
    ],
  },
  {
    slug: "zombie-plague-brasil",
    name: "Zombie Plague Brasil",
    short: "ZP BR",
    ip: "131.196.196.198",
    port: 27880,
    country: "BR",
    flag: "🇧🇷",
    mode: "Zombie Plague",
    description:
      "Sobrevivência humana contra zumbis no clássico Zombie Plague. Compre armas, classes especiais e use Ammo Packs para upar.",
    rules: [
      "Proibido cheats, exploits ou abuso de bugs.",
      "Sem combinação entre humano e zumbi (teamkill / freekill).",
      "Sem flood ou spam no chat.",
      "Não bloqueie passagens com armas/granadas para travar a rodada.",
      "Respeite admins e jogadores.",
    ],
    commands: [
      { cmd: "/menu", desc: "Menu principal" },
      { cmd: "/buyammo", desc: "Comprar itens com Ammo Packs" },
      { cmd: "/classmenu", desc: "Escolher classe humano/zumbi" },
      { cmd: "/extra", desc: "Itens extras" },
      { cmd: "/vip", desc: "Vantagens VIP" },
      { cmd: "/ammoshop", desc: "Loja online de Ammo Packs (no site)" },
    ],
  },
  {
    slug: "zombie-plague-venezuela",
    name: "Zombie Plague Venezuela",
    short: "ZP VE",
    ip: "161.129.183.128",
    port: 27016,
    country: "VE",
    flag: "🇻🇪",
    mode: "Zombie Plague",
    description:
      "Servidor ZP localizado na Venezuela para a comunidade hispanohablante. Sobreviva às hordas e suba de nível.",
    rules: [
      "Prohibido cheats, hacks o exploits.",
      "Respeta a los demás jugadores.",
      "No bloquear pasos con armas o granadas.",
      "Admins tienen la última palabra.",
    ],
    commands: [
      { cmd: "/menu", desc: "Menú principal" },
      { cmd: "/buyammo", desc: "Comprar con Ammo Packs" },
      { cmd: "/classmenu", desc: "Escoger clase" },
      { cmd: "/vip", desc: "Beneficios VIP" },
    ],
  },
  {
    slug: "pregame-venezuela",
    name: "Pregame Venezuela",
    short: "Pregame VE",
    ip: "161.129.183.128",
    port: 27015,
    country: "VE",
    flag: "🇻🇪",
    mode: "Public / Pregame",
    description:
      "Servidor público clássico CS 1.6 na Venezuela. Mapas oficiais, ritmo competitivo de pública.",
    rules: [
      "Sin cheats ni exploits.",
      "Respeto en el chat y mic.",
      "Sin spawnkill abusivo.",
      "Admins tienen la última palabra.",
    ],
    commands: [
      { cmd: "/menu", desc: "Menú principal" },
      { cmd: "/vip", desc: "Beneficios VIP" },
      { cmd: "/admins", desc: "Admins en línea" },
    ],
  },
  {
    slug: "zombie-escape",
    name: "Zombie Escape",
    short: "ZE",
    ip: "0.0.0.0",
    port: 0,
    country: "BR",
    flag: "🇧🇷",
    mode: "Zombie Escape",
    description:
      "Em breve: o clássico modo Zombie Escape com mapas longos, corridas insanas e trabalho em equipe. Aguarde!",
    comingSoon: true,
    rules: ["Em breve."],
    commands: [],
  },
  {
    slug: "crossfire",
    name: "Modo Crossfire",
    short: "Crossfire",
    ip: "0.0.0.0",
    port: 0,
    country: "BR",
    flag: "🇧🇷",
    mode: "Crossfire (CF) no CS 1.6",
    description:
      "Em breve: a experiência CrossFire dentro do Counter-Strike 1.6 com classes, armas e mapas customizados.",
    comingSoon: true,
    rules: ["Em breve."],
    commands: [],
  },
];

export const PLANS_PRICES = {
  vip: 15,
  admin: 30,
  master: 50,
  supremo: 90,
} as const;

export type PlanTier = keyof typeof PLANS_PRICES;

export const AMMO_PACK_PRICE_PER_1000 = 10; // R$ 10 / 1000 ammo packs
export const AMMO_PACK_MIN = 1000;
export const AMMO_PACK_MAX = 500_000;
export const AMMO_PACK_STEP = 1000;

export function getServerBySlug(slug: string): ServerInfo | undefined {
  return SERVERS.find((s) => s.slug === slug);
}

export function serverAddress(s: ServerInfo): string {
  return `${s.ip}:${s.port}`;
}

export function steamConnectUrl(s: ServerInfo): string {
  return `steam://connect/${serverAddress(s)}`;
}
