import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const baseHTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{TITLE}}</title>
    <meta name="description" content="{{DESCRIPTION}}" />

    <meta property="og:type" content="website" />
    <meta property="og:title" content="{{TITLE}}" />
    <meta property="og:description" content="{{DESCRIPTION}}" />
    <meta property="og:image" content="{{IMAGE}}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{{TITLE}}" />
    <meta name="twitter:description" content="{{DESCRIPTION}}" />
    <meta name="twitter:image" content="{{IMAGE}}" />
    <script type="module" crossorigin src="/assets/index-8sw4NFuY.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-DOxuvFi0.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

function isSocialMediaCrawler(userAgent: string): boolean {
  const crawlers = [
    'facebookexternalhit',
    'Facebot',
    'Twitterbot',
    'LinkedInBot',
    'Slackbot',
    'WhatsApp',
    'TelegramBot',
    'Discordbot',
    'SkypeUriPreview',
    'Pinterest',
    'Applebot',
    'Googlebot',
    'bingbot'
  ];

  return crawlers.some(crawler =>
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const userAgent = req.headers.get('user-agent') || '';

    // Only process for social media crawlers
    if (!isSocialMediaCrawler(userAgent)) {
      return new Response('Not a social media crawler', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch property data
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('is_published', true)
      .maybeSingle();

    if (propertyError || !property) {
      throw new Error('No published property found');
    }

    // Fetch first image
    const { data: images, error: imagesError } = await supabase
      .from('property_images')
      .select('image_url')
      .eq('property_id', property.id)
      .order('display_order')
      .limit(1);

    if (imagesError) throw imagesError;

    const imageUrl = images && images.length > 0
      ? images[0].image_url
      : 'https://bolt.new/static/og_default.png';

    const description = property.description.length > 155
      ? property.description.substring(0, 155) + '...'
      : property.description;

    // Generate HTML with dynamic meta tags
    const html = baseHTML
      .replace(/{{TITLE}}/g, property.title)
      .replace(/{{DESCRIPTION}}/g, description)
      .replace(/{{IMAGE}}/g, imageUrl);

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
