import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateMetaTags() {
  try {
    // Fetch property data
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('is_published', true)
      .maybeSingle();

    if (propertyError || !property) {
      console.log('No published property found, using defaults');
      return;
    }

    // Fetch first image
    const { data: images } = await supabase
      .from('property_images')
      .select('image_url')
      .eq('property_id', property.id)
      .order('display_order')
      .limit(1);

    const imageUrl = images && images.length > 0
      ? images[0].image_url
      : '/27d1256c6b758d6e40641bb8789b5c73.jpg';

    const description = property.description.length > 155
      ? property.description.substring(0, 155) + '...'
      : property.description;

    // Read the index.html file
    const indexPath = join(__dirname, '../index.html');
    let html = readFileSync(indexPath, 'utf-8');

    // Replace meta tags
    html = html.replace(
      /<title>.*?<\/title>/,
      `<title>${escapeHtml(property.title)}</title>`
    );

    html = html.replace(
      /<meta name="description" content=".*?" \/>/,
      `<meta name="description" content="${escapeHtml(description)}" />`
    );

    html = html.replace(
      /<meta property="og:title" content=".*?" \/>/,
      `<meta property="og:title" content="${escapeHtml(property.title)}" />`
    );

    html = html.replace(
      /<meta property="og:description" content=".*?" \/>/,
      `<meta property="og:description" content="${escapeHtml(description)}" />`
    );

    html = html.replace(
      /<meta property="og:image" content=".*?" \/>/,
      `<meta property="og:image" content="${escapeHtml(imageUrl)}" />`
    );

    html = html.replace(
      /<meta name="twitter:title" content=".*?" \/>/,
      `<meta name="twitter:title" content="${escapeHtml(property.title)}" />`
    );

    html = html.replace(
      /<meta name="twitter:description" content=".*?" \/>/,
      `<meta name="twitter:description" content="${escapeHtml(description)}" />`
    );

    html = html.replace(
      /<meta name="twitter:image" content=".*?" \/>/,
      `<meta name="twitter:image" content="${escapeHtml(imageUrl)}" />`
    );

    // Write back to index.html
    writeFileSync(indexPath, html);

    console.log('✓ Meta tags updated successfully');
    console.log(`  Title: ${property.title}`);
    console.log(`  Image: ${imageUrl}`);

  } catch (error) {
    console.error('Error generating meta tags:', error);
    process.exit(1);
  }
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

generateMetaTags();
