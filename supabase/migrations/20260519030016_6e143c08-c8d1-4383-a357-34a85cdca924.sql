
CREATE OR REPLACE FUNCTION public.set_updated_at_now()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.skins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  server_slug text NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'player',
  price_brl numeric NOT NULL,
  image_url text,
  description text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_skins_server ON public.skins(server_slug) WHERE active;

ALTER TABLE public.skins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skins public read" ON public.skins FOR SELECT USING (true);
CREATE POLICY "Admins manage skins" ON public.skins FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_skins_updated_at
BEFORE UPDATE ON public.skins
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();

INSERT INTO public.skins (server_slug, name, category, price_brl, description, sort_order)
SELECT s.slug, x.name, 'player', x.price, x.descr, x.ord
FROM public.servers s
CROSS JOIN (VALUES
  ('Operativo Sombra', 19.90, 'Skin de CT exclusiva com detalhes táticos.', 1),
  ('Lobo Urbano', 24.90, 'Skin de TR com camuflagem urbana.', 2),
  ('Fênix Dourada', 39.90, 'Skin premium com efeito dourado.', 3)
) AS x(name, price, descr, ord)
WHERE s.coming_soon = false;
