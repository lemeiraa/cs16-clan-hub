
-- Servers catalog
CREATE TABLE public.servers (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short TEXT NOT NULL,
  ip TEXT NOT NULL DEFAULT '0.0.0.0',
  port INTEGER NOT NULL DEFAULT 0,
  country TEXT NOT NULL DEFAULT 'BR',
  flag TEXT NOT NULL DEFAULT '🇧🇷',
  mode TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  coming_soon BOOLEAN NOT NULL DEFAULT false,
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  commands JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Servers public read" ON public.servers FOR SELECT USING (true);
CREATE POLICY "Admins manage servers" ON public.servers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Plans (cargos)
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  price_brl NUMERIC(10,2) NOT NULL CHECK (price_brl >= 0),
  perks JSONB NOT NULL DEFAULT '[]'::jsonb,
  highlight BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans public read" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Admins manage plans" ON public.plans FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Ammo settings (single row)
CREATE TABLE public.ammo_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  price_per_1000 NUMERIC(10,2) NOT NULL DEFAULT 10,
  min_qty INTEGER NOT NULL DEFAULT 1000,
  max_qty INTEGER NOT NULL DEFAULT 500000,
  step_qty INTEGER NOT NULL DEFAULT 1000,
  forced_server_slug TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ammo_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ammo public read" ON public.ammo_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage ammo" ON public.ammo_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Payment methods toggle
CREATE TABLE public.payment_methods (
  id TEXT PRIMARY KEY,           -- 'pix' or 'whatsapp'
  label TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Payment methods public read" ON public.payment_methods FOR SELECT USING (true);
CREATE POLICY "Admins manage payment methods" ON public.payment_methods FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- WhatsApp admins
CREATE TABLE public.whatsapp_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,           -- digits only, e.g. 5521968612190
  display TEXT NOT NULL,         -- formatted, e.g. +55 21 96861-2190
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Whatsapp admins public read" ON public.whatsapp_admins FOR SELECT USING (true);
CREATE POLICY "Admins manage whatsapp admins" ON public.whatsapp_admins FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Banned flag on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned BOOLEAN NOT NULL DEFAULT false;

-- Updated_at trigger function (reuse existing if any)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_servers_updated BEFORE UPDATE ON public.servers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_ammo_updated BEFORE UPDATE ON public.ammo_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_payment_methods_updated BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed initial data
INSERT INTO public.ammo_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

INSERT INTO public.payment_methods (id, label, enabled, description) VALUES
  ('pix', 'PIX automático', true, 'Pagamento via Mercado Pago, confirmação automática.'),
  ('whatsapp', 'WhatsApp', true, 'Combine o pagamento com um admin pelo WhatsApp.')
ON CONFLICT DO NOTHING;

INSERT INTO public.whatsapp_admins (name, phone, display, sort_order) VALUES
  ('Jonathan (zgd.dll)', '5521968612190', '+55 21 96861-2190', 0),
  ('Alexander (Aleeck)', '5519992440346', '+55 19 99244-0346', 1)
ON CONFLICT DO NOTHING;

INSERT INTO public.plans (tier, label, price_brl, perks, highlight, sort_order) VALUES
  ('vip', 'VIP', 15, '["Tag [VIP] no nome","Reserva de slot","+15% HP inicial","Acesso a armas exclusivas"]'::jsonb, false, 0),
  ('admin', 'ADMIN', 30, '["Tudo do VIP","Slay/Slap em troll","Kick básico","Tag [ADMIN] dourada"]'::jsonb, false, 1),
  ('master', 'MASTER', 50, '["Tudo do ADMIN","Ban temporário","Mute/Gag","Comandos avançados"]'::jsonb, true, 2),
  ('supremo', 'SUPREMO', 90, '["Tudo do MASTER","Ban permanente","Acesso ao changelevel","Tag personalizada","Prioridade de suporte"]'::jsonb, false, 3)
ON CONFLICT (tier) DO NOTHING;

INSERT INTO public.servers (slug, name, short, ip, port, country, flag, mode, description, coming_soon, rules, commands, sort_order) VALUES
  ('4fun-brasil','4Fun Brasil Clássico','4Fun BR','131.196.196.196',27550,'BR','🇧🇷','Classic + Zueira','Servidor 4Fun no estilo clássico do Counter-Strike 1.6 com aquele toque de zueira da galera. Mapas variados, comunidade ativa.',false,
    '["Proibido qualquer tipo de cheat, hack, bug ou wallhack.","Respeite os outros jogadores — sem flood, racismo ou discurso de ódio.","Sem propaganda de outros servidores no chat.","Spawnkill repetitivo gera kick/ban do admin.","Decisão dos administradores é final."]'::jsonb,
    '[{"cmd":"/menu","desc":"Abre o menu principal do servidor"},{"cmd":"/vip","desc":"Mostra os benefícios e como adquirir VIP"},{"cmd":"/admins","desc":"Lista admins online no momento"},{"cmd":"/rules","desc":"Mostra as regras do servidor"}]'::jsonb, 0),
  ('fypoolday-brasil','Fy Pool Day Brasil','Fy Pool Day BR','131.196.196.197',27230,'BR','🇧🇷','Fun Map / 24h','O clássico fy_pool_day rodando 24/7 em servidor brasileiro de baixo ping. Diversão garantida.',false,
    '["Proibido cheats, hacks ou exploits.","Mantenha o respeito no chat e mic.","Sem campers excessivos atrás do mapa.","Admins têm a palavra final."]'::jsonb,
    '[{"cmd":"/menu","desc":"Menu de funções do servidor"},{"cmd":"/vip","desc":"Vantagens VIP"},{"cmd":"/nominate","desc":"Sugerir próximo mapa"}]'::jsonb, 1),
  ('zombie-plague-brasil','Zombie Plague Brasil','ZP BR','131.196.196.198',27880,'BR','🇧🇷','Zombie Plague','Sobrevivência humana contra zumbis no clássico Zombie Plague. Compre armas, classes especiais e use Ammo Packs para upar.',false,
    '["Proibido cheats, exploits ou abuso de bugs.","Sem combinação entre humano e zumbi (teamkill / freekill).","Sem flood ou spam no chat.","Não bloqueie passagens com armas/granadas para travar a rodada.","Respeite admins e jogadores."]'::jsonb,
    '[{"cmd":"/menu","desc":"Menu principal"},{"cmd":"/buyammo","desc":"Comprar itens com Ammo Packs"},{"cmd":"/classmenu","desc":"Escolher classe humano/zumbi"},{"cmd":"/extra","desc":"Itens extras"},{"cmd":"/vip","desc":"Vantagens VIP"},{"cmd":"/ammoshop","desc":"Loja online de Ammo Packs (no site)"}]'::jsonb, 2),
  ('zombie-plague-venezuela','Zombie Plague Venezuela','ZP VE','161.129.183.128',27016,'VE','🇻🇪','Zombie Plague','Servidor ZP localizado na Venezuela para a comunidade hispanohablante. Sobreviva às hordas e suba de nível.',false,
    '["Prohibido cheats, hacks o exploits.","Respeta a los demás jugadores.","No bloquear pasos con armas o granadas.","Admins tienen la última palabra."]'::jsonb,
    '[{"cmd":"/menu","desc":"Menú principal"},{"cmd":"/buyammo","desc":"Comprar con Ammo Packs"},{"cmd":"/classmenu","desc":"Escoger clase"},{"cmd":"/vip","desc":"Beneficios VIP"}]'::jsonb, 3),
  ('pregame-venezuela','Pregame Venezuela','Pregame VE','161.129.183.128',27015,'VE','🇻🇪','Public / Pregame','Servidor público clássico CS 1.6 na Venezuela. Mapas oficiais, ritmo competitivo de pública.',false,
    '["Sin cheats ni exploits.","Respeto en el chat y mic.","Sin spawnkill abusivo.","Admins tienen la última palabra."]'::jsonb,
    '[{"cmd":"/menu","desc":"Menú principal"},{"cmd":"/vip","desc":"Beneficios VIP"},{"cmd":"/admins","desc":"Admins en línea"}]'::jsonb, 4),
  ('zombie-escape','Zombie Escape','ZE','0.0.0.0',0,'BR','🇧🇷','Zombie Escape','Em breve: o clássico modo Zombie Escape com mapas longos, corridas insanas e trabalho em equipe. Aguarde!',true,
    '["Em breve."]'::jsonb,'[]'::jsonb, 5),
  ('crossfire','Modo Crossfire','Crossfire','0.0.0.0',0,'BR','🇧🇷','Crossfire (CF) no CS 1.6','Em breve: a experiência CrossFire dentro do Counter-Strike 1.6 com classes, armas e mapas customizados.',true,
    '["Em breve."]'::jsonb,'[]'::jsonb, 6)
ON CONFLICT (slug) DO NOTHING;
