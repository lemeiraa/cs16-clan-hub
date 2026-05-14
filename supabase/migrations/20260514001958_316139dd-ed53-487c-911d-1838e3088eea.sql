
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  reporter_name TEXT NOT NULL,
  reporter_nick TEXT NOT NULL,
  reported_nick TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  notes TEXT,
  video_url TEXT,
  video_path TEXT,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can create reports"
ON public.reports FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND char_length(reporter_name) BETWEEN 1 AND 120
  AND char_length(reporter_nick) BETWEEN 1 AND 64
  AND char_length(reported_nick) BETWEEN 1 AND 64
  AND char_length(occurred_at) BETWEEN 1 AND 120
  AND (notes IS NULL OR char_length(notes) <= 2000)
);

CREATE POLICY "Users can view their own reports"
ON public.reports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reports"
ON public.reports FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update reports"
ON public.reports FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete reports"
ON public.reports FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_reports_created_at ON public.reports (created_at DESC);

-- Allow admins to delete files from the reports storage bucket
CREATE POLICY "Admins can delete report files"
ON storage.objects FOR DELETE
USING (bucket_id = 'reports' AND has_role(auth.uid(), 'admin'::app_role));
