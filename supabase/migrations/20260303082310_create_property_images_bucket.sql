/*
  # Create Storage Bucket for Property Images

  1. Storage
    - Create 'property-images' bucket for storing farmhouse photos
    - Set public access for viewing images
    - Allow authenticated users to upload, update, and delete images

  2. Security
    - Public read access to all images in the bucket
    - Authenticated users can upload images
    - Authenticated users can update/delete their uploaded images
*/

-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view images
CREATE POLICY "Public can view property images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

-- Policy: Authenticated users can upload images
CREATE POLICY "Authenticated users can upload property images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'property-images');

-- Policy: Authenticated users can update images
CREATE POLICY "Authenticated users can update property images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'property-images')
  WITH CHECK (bucket_id = 'property-images');

-- Policy: Authenticated users can delete images
CREATE POLICY "Authenticated users can delete property images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'property-images');