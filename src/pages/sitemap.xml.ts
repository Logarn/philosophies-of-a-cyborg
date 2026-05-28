import type { APIRoute } from 'astro';
import { essaySlug, getPublishedEssays } from '../lib/essays';

const site = 'https://philosophiesofacyborg.com';
const staticPages = ['/', '/essays/', '/archive/', '/projects/', '/values/', '/handbook/', '/store/'];

function urlEntry(path: string, lastmod?: Date) {
  const mod = lastmod ? `<lastmod>${lastmod.toISOString()}</lastmod>` : '';
  return `<url><loc>${site}${path}</loc>${mod}</url>`;
}

export const GET: APIRoute = async () => {
  const essays = await getPublishedEssays();
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticPages.map((path) => urlEntry(path)),
    ...essays.map((essay) => urlEntry(`/essays/${essaySlug(essay)}/`, essay.data.updatedAt ?? essay.data.publishedAt)),
    '</urlset>'
  ].join('');

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
};
