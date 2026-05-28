import { essayRepoPath, listEssaySources, readContentFile } from './contentStore';

export type EssayData = {
  title: string;
  summary: string;
  publishedAt: Date;
  updatedAt?: Date;
  status: 'draft' | 'published';
  pinned: boolean;
  readingTime: string;
  mood?: string;
};

export type EssayEntry = {
  id: string;
  slug: string;
  body: string;
  data: EssayData;
};

export function essaySlug(essay: { id?: string; slug?: string }) {
  return essay.slug ?? essay.id?.replace(/\.(md|mdx)$/i, '') ?? '';
}

function parseScalar(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }

  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  return trimmed;
}

function parseFrontmatter(source: string) {
  const normalized = source.replace(/\r\n?/g, '\n');
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/u.exec(normalized);
  if (!match) throw new Error('Essay is missing frontmatter.');

  const data: Record<string, unknown> = {};
  const lines = match[1].split('\n');

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;

    const scalarMatch = /^(\w+):\s*(.*)$/u.exec(line);
    if (!scalarMatch) continue;

    const [, key, rawValue] = scalarMatch;
    if (rawValue === '|-' || rawValue === '|') {
      const block: string[] = [];
      while (index + 1 < lines.length && /^\s/.test(lines[index + 1])) {
        index += 1;
        block.push(lines[index].replace(/^ {2}/, ''));
      }
      data[key] = block.join('\n');
    } else {
      data[key] = parseScalar(rawValue);
    }
  }

  return { data, body: match[2].trim() };
}

function parseDate(value: unknown, fallback?: Date) {
  if (value instanceof Date) return value;
  if (typeof value !== 'string') return fallback;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) ? fallback : date;
}

function parseEssayFile(id: string, contents: string): EssayEntry {
  const { data, body } = parseFrontmatter(contents);
  const publishedAt = parseDate(data.publishedAt);
  if (!publishedAt) throw new Error(`${id} has an invalid publishedAt date.`);

  return {
    id,
    slug: id.replace(/\.(md|mdx)$/i, ''),
    body,
    data: {
      title: String(data.title ?? ''),
      summary: String(data.summary ?? ''),
      publishedAt,
      updatedAt: parseDate(data.updatedAt),
      status: data.status === 'published' ? 'published' : 'draft',
      pinned: data.pinned === true,
      readingTime: String(data.readingTime ?? ''),
      mood: typeof data.mood === 'string' ? data.mood : undefined
    }
  };
}

async function readEssayFile(fileName: string, repoPath: string) {
  const contents = await readContentFile(repoPath);
  if (!contents) return null;
  return parseEssayFile(fileName, contents);
}

export async function getAllEssays() {
  const files = await listEssaySources();
  const essays = await Promise.all(files.map((file) => readEssayFile(file.fileName, file.repoPath)));

  return essays
    .filter((essay): essay is EssayEntry => Boolean(essay))
    .sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
}

export async function getPublishedEssays() {
  const essays = await getAllEssays();
  return essays.filter((essay) => essay.data.status === 'published');
}

export async function getPublishedEssayBySlug(slug: string) {
  const repoPath = essayRepoPath(slug);
  if (!repoPath) return null;

  try {
    const essay = await readEssayFile(`${slug}.md`, repoPath);
    return essay?.data.status === 'published' ? essay : null;
  } catch {
    return null;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function inlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+|#[^\s)]+|\/[^\s)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/g, '<u>$1</u>')
    .replace(
      /&lt;span style=&quot;color: (#[0-9a-fA-F]{6})&quot;&gt;([\s\S]*?)&lt;\/span&gt;/g,
      '<span style="color: $1">$2</span>'
    );
}

export function renderMarkdown(markdown: string) {
  const blocks: string[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  markdown.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      return;
    }
    if (trimmed.startsWith('### ')) {
      flushParagraph();
      blocks.push(`<h3>${inlineMarkdown(trimmed.slice(4))}</h3>`);
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushParagraph();
      blocks.push(`<h2>${inlineMarkdown(trimmed.slice(3))}</h2>`);
      return;
    }
    if (trimmed.startsWith('# ')) {
      flushParagraph();
      blocks.push(`<h1>${inlineMarkdown(trimmed.slice(2))}</h1>`);
      return;
    }
    paragraph.push(trimmed);
  });

  flushParagraph();
  return blocks.join('');
}

export function splitPinned<T extends { data: { pinned: boolean } }>(essays: T[]) {
  return {
    pinned: essays.filter((essay) => essay.data.pinned),
    rest: essays.filter((essay) => !essay.data.pinned)
  };
}
