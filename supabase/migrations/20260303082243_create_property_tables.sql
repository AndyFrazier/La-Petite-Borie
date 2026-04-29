/*
  # Create Property Listing Tables

  1. New Tables
    - `properties`
      - `id` (uuid, primary key)
      - `title` (text) - Property title
      - `description` (text) - Full property description
      - `price` (numeric) - Listing price in euros
      - `location` (text) - Location/region in France
      - `bedrooms` (integer) - Number of bedrooms
      - `bathrooms` (integer) - Number of bathrooms
      - `area_sqm` (numeric) - Property area in square meters
      - `land_area_sqm` (numeric) - Land area in square meters
      - `year_built` (integer) - Year the property was built
      - `features` (text[]) - Array of property features
      - `contact_email` (text) - Contact email for inquiries
      - `contact_phone` (text) - Contact phone number
      - `is_published` (boolean) - Whether the listing is published
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `property_images`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key to properties)
      - `image_url` (text) - URL to the image in Supabase Storage
      - `caption` (text) - Optional image caption
      - `display_order` (integer) - Order for displaying images
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Public read access for published properties
    - Authenticated admin access for all operations
*/

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  location text NOT NULL DEFAULT '',
  bedrooms integer NOT NULL DEFAULT 0,
  bathrooms integer NOT NULL DEFAULT 0,
  area_sqm numeric NOT NULL DEFAULT 0,
  land_area_sqm numeric NOT NULL DEFAULT 0,
  year_built integer,
  features text[] DEFAULT '{}',
  contact_email text DEFAULT '',
  contact_phone text DEFAULT '',
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create property_images table
CREATE TABLE IF NOT EXISTS property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

-- Policies for properties table
CREATE POLICY "Anyone can view published properties"
  ON properties FOR SELECT
  USING (is_published = true);

CREATE POLICY "Authenticated users can view all properties"
  ON properties FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete properties"
  ON properties FOR DELETE
  TO authenticated
  USING (true);

-- Policies for property_images table
CREATE POLICY "Anyone can view images of published properties"
  ON property_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_images.property_id
      AND properties.is_published = true
    )
  );

CREATE POLICY "Authenticated users can view all images"
  ON property_images FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert images"
  ON property_images FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update images"
  ON property_images FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete images"
  ON property_images FOR DELETE
  TO authenticated
  USING (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_order ON property_images(property_id, display_order);