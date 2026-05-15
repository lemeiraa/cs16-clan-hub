-- Announcements table for the home banner
CREATE TABLE public.announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  tag text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT 'accent',
  effect text NOT NULL DEFAULT 'pulse',
  active boolean NOT NULL DEFAULT true,
  dismissible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT announcements_color_check CHECK (color IN ('accent','primary','success','warning','destructive','info')),
  CONSTRAINT announcements_effect_check CHECK (effect IN ('none','pulse','glow','marquee','blink'))
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Announcements public read"
ON public.announcements
FOR SELECT
USING (
  active = true
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at IS NULL OR ends_at >= now())
);

CREATE POLICY "Admins read all announcements"
ON public.announcements
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage announcements"
ON public.announcements
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER announcements_touch_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_announcements_active_sort ON public.announcements (active, sort_order);

-- Seed with the existing Zombie Plague banner so the home page keeps showing it
INSERT INTO public.announcements (title, message, tag, color, effect, sort_order, dismissible)
VALUES (
  'Servidor Zombie Plague',
  'Inauguração no próximo sábado às 11h30. Não perca!',
  'Inauguração',
  'accent',
  'pulse',
  0,
  true
);