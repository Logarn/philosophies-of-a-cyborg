import { getCollection } from 'astro:content';

export function essaySlug(essay: { id: string }) {
  return essay.id.replace(/\.(md|mdx)$/i, '');
}

export async function getPublishedEssays() {
  const essays = await getCollection('essays', ({ data }) => data.status === 'published');
  return essays.sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
}

export function splitPinned<T extends { data: { pinned: boolean } }>(essays: T[]) {
  return {
    pinned: essays.filter((essay) => essay.data.pinned),
    rest: essays.filter((essay) => !essay.data.pinned)
  };
}
