import type { APIRoute } from 'astro';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: 'Philosophy of a Cyborg',
      short_name: 'Cyborg',
      description: 'Essays from Ositu Kengere on AI, agency, software, and becoming partially machine.',
      start_url: '/',
      display: 'standalone',
      background_color: '#f7f3ea',
      theme_color: '#f2bd22',
      icons: [
        { src: '/favicons/favicon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/favicons/favicon-512.png', sizes: '512x512', type: 'image/png' }
      ]
    }),
    {
      headers: {
        'Content-Type': 'application/manifest+json; charset=utf-8'
      }
    }
  );
