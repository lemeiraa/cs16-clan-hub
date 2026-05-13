CREATE TABLE public.news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Atualização',
  image_url TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "News public read"
  ON public.news FOR SELECT
  USING (published = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage news"
  ON public.news FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER news_touch_updated_at
  BEFORE UPDATE ON public.news
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_news_published_created ON public.news (published, pinned DESC, created_at DESC);

INSERT INTO public.news (title, excerpt, content, category, pinned) VALUES
  ('Bem-vindo à CS Nostalgia!', 'Nova plataforma da comunidade no ar — confira novidades, servidores e loja VIP.', 'Estamos felizes em apresentar o novo site oficial da CS Nostalgia. Aqui você acompanha o status dos servidores em tempo real, compra VIP/Ammo Packs e fica por dentro de tudo que rola na comunidade.', 'Anúncio', true);
