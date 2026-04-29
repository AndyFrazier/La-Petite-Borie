/*
  # Change price field to text

  1. Changes
    - Alter `properties` table to change `price` column from numeric to text
    - This allows for flexible pricing like "TBA", "Price on request", or numeric values
    
  2. Notes
    - Existing numeric values will be converted to text automatically
    - The euro sign will be handled in the UI display
*/

ALTER TABLE properties 
ALTER COLUMN price TYPE text USING price::text;
