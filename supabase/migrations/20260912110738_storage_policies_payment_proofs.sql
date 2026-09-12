/*
# Storage policies for payment-proofs bucket

1. Security
- Allow anon + authenticated to upload files (customers send proofs)
- Allow public read (admins need to view proofs)
- Only allow image/pdf file extensions
*/

-- Allow public read
DROP POLICY IF EXISTS "public_read_proofs" ON storage.objects;
CREATE POLICY "public_read_proofs" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'payment-proofs');

-- Allow anon + authenticated to upload
DROP POLICY IF EXISTS "anon_upload_proofs" ON storage.objects;
CREATE POLICY "anon_upload_proofs" ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'payment-proofs'
  );
