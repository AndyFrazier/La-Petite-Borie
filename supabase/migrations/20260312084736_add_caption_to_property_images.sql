/*
  # Add caption field to property images

  1. Changes
    - Add `caption` column to `property_images` table
      - Type: text
      - Nullable: true (captions are optional)
      - Default: empty string
  
  2. Notes
    - Allows admin to add descriptive captions to each image
    - Can be used for accessibility (alt text) and SEO
    - Existing images will have empty captions by default
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_images' AND column_name = 'caption'
  ) THEN
    ALTER TABLE property_images ADD COLUMN caption text DEFAULT '';
  END IF;
END $$;