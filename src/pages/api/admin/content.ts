import type { APIRoute } from 'astro';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';

export const prerender = false;

const projectRoot = resolve(import.meta.env.POC_REPO_ROOT ?? process.cwd());
const essaysDir = resolve(projectRoot, 'src/content/essays');
const siteCopyPath = resolve(projectRoot, 'src/lib/siteCopy.ts');

type DraftPayload = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  updatedAt?: string;
  status: 'draft' | 'published';
  pinned: boolean;
  readingTime: string;
  mood?: string;
  body: string;
};

type HomepagePayload = {
  eyebrow: string;
  headline: string;
  intro: string;
  cta: string;
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function assertText(value: unknown, label: string, maxLength: number) {
  if (typeof value !== 'string') throw new Error(`${label} is required.`);
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} is required.`);
  if (trimmed.length > maxLength) throw new Error(`${label} is too long.`);
  return trimmed;
}

function assertOptionalText(value: unknown, label: string, maxLength: number) {
  if (value === undefined || value === null || value === '') return '';
  return assertText(value, label, maxLength);
}

function assertDate(value: unknown, label: string) {
  const text = assertText(value, label, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(`${text}T00:00:00Z`))) {
    throw new Error(`${label} must be YYYY-MM-DD.`);
  }
  return text;
}

function parseDraft(value: Record<string, unknown>): DraftPayload {
  const slug = assertText(value.slug, 'slug', 72);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('slug must be lowercase letters, numbers, and hyphens.');
  }

  const status = value.status === 'published' || value.status === 'draft' ? value.status : null;
  if (!status) throw new Error('status must be draft or published.');

  if (typeof value.pinned !== 'boolean') throw new Error('pinned must be a boolean.');
  if (typeof value.body !== 'string') throw new Error('body is required.');
  if (value.body.length > 240_000) throw new Error('body is too long.');

  return {
    slug,
    title: assertText(value.title, 'title', 180),
    summary: assertText(value.summary, 'summary', 520),
    publishedAt: assertDate(value.publishedAt, 'publishedAt'),
    updatedAt: value.updatedAt ? assertDate(value.updatedAt, 'updatedAt') : '',
    status,
    pinned: value.pinned,
    readingTime: assertText(value.readingTime, 'readingTime', 48),
    mood: assertOptionalText(value.mood, 'mood', 80),
    body: value.body.trim()
  };
}

function parseHomepage(value: Record<string, unknown>): HomepagePayload {
  return {
    eyebrow: assertText(value.eyebrow, 'homepage eyebrow', 120),
    headline: assertText(value.headline, 'homepage headline', 180),
    intro: assertText(value.intro, 'homepage intro', 700),
    cta: assertText(value.cta, 'homepage cta', 80)
  };
}

function safeEssayPath(slug: string) {
  const filePath = resolve(essaysDir, `${slug}.md`);
  if (!filePath.startsWith(`${essaysDir}${sep}`)) {
    throw new Error('invalid essay path.');
  }
  return filePath;
}

function yamlString(value: string) {
  const normalized = value.replace(/\r\n?/g, '\n');
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(normalized)) {
    throw new Error('frontmatter text contains unsupported control characters.');
  }

  if (normalized.includes('\n')) {
    const indented = normalized
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n');
    return `|-\n${indented}`;
  }

  return JSON.stringify(normalized);
}

function buildMarkdown(draft: DraftPayload) {
  const lines = [
    '---',
    `title: ${yamlString(draft.title)}`,
    `summary: ${yamlString(draft.summary)}`,
    `publishedAt: ${draft.publishedAt}`,
    `status: ${draft.status}`,
    `pinned: ${draft.pinned}`,
    `readingTime: ${yamlString(draft.readingTime)}`
  ];

  if (draft.updatedAt) lines.push(`updatedAt: ${draft.updatedAt}`);
  if (draft.mood) lines.push(`mood: ${yamlString(draft.mood)}`);

  lines.push('---', '', draft.body, '');
  return lines.join('\n');
}

function tsString(value: string) {
  return JSON.stringify(value);
}

function buildHomepageModule(homepage: HomepagePayload) {
  return [
    'export const homepageCopy = {',
    `  eyebrow: ${tsString(homepage.eyebrow)},`,
    `  headline: ${tsString(homepage.headline)},`,
    `  intro: ${tsString(homepage.intro)},`,
    `  cta: ${tsString(homepage.cta)}`,
    '} as const;',
    ''
  ].join('\n');
}

async function writeAtomic(filePath: string, contents: string) {
  await mkdir(dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempPath, contents, { encoding: 'utf8', mode: 0o644 });
  await rename(tempPath, filePath);
}

export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get('x-poc-admin-action') !== 'save-content') {
    return jsonResponse({ ok: false, error: 'Missing admin action header.' }, 403);
  }

  if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    return jsonResponse({ ok: false, error: 'Expected application/json.' }, 415);
  }

  try {
    const payload = await request.json();
    if (!payload || typeof payload !== 'object') throw new Error('Invalid payload.');

    const action = payload.action === 'delete' ? 'delete' : 'save';
    const draft = parseDraft(payload.draft ?? {});
    const homepage = parseHomepage(payload.homepage ?? {});
    const essayPath = safeEssayPath(draft.slug);

    await writeAtomic(siteCopyPath, buildHomepageModule(homepage));

    if (action === 'delete') {
      await rm(essayPath, { force: true });
    } else {
      await writeAtomic(essayPath, buildMarkdown(draft));
    }

    return jsonResponse({
      ok: true,
      action,
      paths: {
        essay: essayPath,
        homepage: siteCopyPath
      }
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: error instanceof Error ? error.message : 'Save failed.' }, 400);
  }
};
