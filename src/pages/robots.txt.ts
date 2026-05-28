import type { APIRoute } from 'astro';

const site = 'https://www.ositukengere.xyz';

export const GET: APIRoute = () =>
  new Response(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /admin/',
      'Disallow: /api/admin',
      'Disallow: /api/admin/',
      '',
      `Sitemap: ${site}/sitemap.xml`,
      ''
    ].join('\n'),
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    }
  );
