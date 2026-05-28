import type { APIRoute } from 'astro';
import {
  applyContentChanges,
  essayRepoPath,
  siteCopyRepoPath,
  usingGithubContentStore,
  type ContentChange
} from '../../../lib/contentStore';

export const prerender = false;

const fallbackFooterText =
  "stop giving a fuck about what random normies think of u. That's like playing Oblivion and not jumping everywhere because u don't want the npcs to think you're weird!";

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
  hero: {
    eyebrow: string;
    headline: string;
    intro: string;
  };
  nav: {
    ctaLabel: string;
  };
  garden: {
    title: string;
    intro: string;
    hint: string;
    buttonLabel: string;
  };
  sections: {
    pinnedHeading: string;
    pinnedNote: string;
    allHeading: string;
    allNote: string;
  };
  footer: {
    text: string;
  };
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
    hero: {
      eyebrow: assertText((value.hero as Record<string, unknown> | undefined)?.eyebrow, 'homepage hero eyebrow', 120),
      headline: assertText((value.hero as Record<string, unknown> | undefined)?.headline, 'homepage hero headline', 180),
      intro: assertText((value.hero as Record<string, unknown> | undefined)?.intro, 'homepage hero intro', 700)
    },
    nav: {
      ctaLabel: assertText((value.nav as Record<string, unknown> | undefined)?.ctaLabel, 'homepage nav cta label', 80)
    },
    garden: {
      title: assertText((value.garden as Record<string, unknown> | undefined)?.title, 'homepage garden title', 120),
      intro: assertText((value.garden as Record<string, unknown> | undefined)?.intro, 'homepage garden intro', 220),
      hint: assertText((value.garden as Record<string, unknown> | undefined)?.hint, 'homepage garden hint', 140),
      buttonLabel: assertText((value.garden as Record<string, unknown> | undefined)?.buttonLabel, 'homepage garden button label', 40)
    },
    sections: {
      pinnedHeading: assertText((value.sections as Record<string, unknown> | undefined)?.pinnedHeading, 'homepage pinned heading', 80),
      pinnedNote: assertText((value.sections as Record<string, unknown> | undefined)?.pinnedNote, 'homepage pinned note', 220),
      allHeading: assertText((value.sections as Record<string, unknown> | undefined)?.allHeading, 'homepage all heading', 80),
      allNote: assertText((value.sections as Record<string, unknown> | undefined)?.allNote, 'homepage all note', 220)
    },
    footer: {
      text: assertOptionalText((value.footer as Record<string, unknown> | undefined)?.text, 'homepage footer text', 220) || fallbackFooterText
    }
  };
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

function buildHomepageModule(homepage: HomepagePayload) {
  return `export const homepageCopy = ${JSON.stringify(homepage, null, 2)} as const;\n`;
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

    const action =
      payload.action === 'delete' ? 'delete' : payload.action === 'save-homepage' ? 'save-homepage' : 'save';
    const homepage = parseHomepage(payload.homepage ?? {});

    const changes: ContentChange[] = [
      {
        path: siteCopyRepoPath(),
        content: buildHomepageModule(homepage)
      }
    ];

    let essayPath: string | null = null;
    if (action !== 'save-homepage') {
      const draft = parseDraft(payload.draft ?? {});
      essayPath = essayRepoPath(draft.slug);
      if (!essayPath) throw new Error('invalid essay path.');

      if (action === 'delete') {
        changes.push({ path: essayPath, delete: true });
      } else {
        changes.push({ path: essayPath, content: buildMarkdown(draft) });
      }
    }

    const result = await applyContentChanges(
      action === 'delete' ? `Delete essay from admin CMS` : `Publish content from admin CMS`,
      changes
    );

    return jsonResponse({
      ok: true,
      action,
      backend: result.backend,
      commit: result.commit,
      live: usingGithubContentStore(),
      paths: {
        essay: essayPath,
        homepage: siteCopyRepoPath()
      }
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: error instanceof Error ? error.message : 'Save failed.' }, 400);
  }
};
