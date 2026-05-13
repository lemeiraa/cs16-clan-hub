
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('reports', 'reports', true, 104857600, ARRAY['video/mp4','video/quicktime','video/x-msvideo','video/webm','video/x-matroska'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 104857600, allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Public read reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'reports');

CREATE POLICY "Anyone can upload reports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'reports');
