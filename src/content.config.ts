import { defineCollection, z } from 'astro:content';

const essays = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    status: z.enum(['draft', 'published']).default('draft'),
    pinned: z.boolean().default(false),
    readingTime: z.string(),
    mood: z.string().optional()
  })
});

export const collections = { essays };
