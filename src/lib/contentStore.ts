import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';

const projectRoot = resolve(import.meta.env.POC_REPO_ROOT ?? process.cwd());
const essaysDir = resolve(projectRoot, 'src/content/essays');
const siteCopyPath = resolve(projectRoot, 'src/lib/siteCopy.ts');

const githubToken = import.meta.env.POC_GITHUB_TOKEN ?? import.meta.env.GITHUB_TOKEN;
const githubRepo = import.meta.env.POC_GITHUB_REPO ?? 'Logarn/philosophies-of-a-cyborg';
const githubBranch = import.meta.env.POC_GITHUB_BRANCH ?? 'main';

type GithubRepo = {
  owner: string;
  repo: string;
};

export type ContentChange = {
  path: string;
  content?: string;
  delete?: boolean;
};

function parseRepo(value: string): GithubRepo | null {
  const match = /^([^/]+)\/([^/]+)$/u.exec(value.trim());
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

function githubConfig() {
  const repo = parseRepo(githubRepo);
  if (!githubToken || !repo) return null;
  return { ...repo, token: githubToken, branch: githubBranch };
}

export function usingGithubContentStore() {
  return Boolean(githubConfig());
}

export function publicContentPath(filePath: string) {
  return filePath.replace(`${projectRoot}${sep}`, '').split(sep).join('/');
}

export function safeEssayPath(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const filePath = resolve(essaysDir, `${slug}.md`);
  if (!filePath.startsWith(`${essaysDir}${sep}`)) return null;
  return filePath;
}

export function essayRepoPath(slug: string) {
  const filePath = safeEssayPath(slug);
  if (!filePath) return null;
  return publicContentPath(filePath);
}

export function siteCopyRepoPath() {
  return publicContentPath(siteCopyPath);
}

function toBase64(value: string) {
  return Buffer.from(value, 'utf8').toString('base64');
}

function fromBase64(value: string) {
  return Buffer.from(value.replace(/\n/g, ''), 'base64').toString('utf8');
}

async function githubRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const config = githubConfig();
  if (!config) throw new Error('GitHub content publishing is not configured.');

  const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...init.headers
    }
  });

  if (response.status === 404) throw new Error('GitHub content was not found.');

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data && typeof data.message === 'string' ? data.message : `GitHub request failed with ${response.status}.`;
    throw new Error(message);
  }

  return data as T;
}

async function readGithubFile(repoPath: string) {
  const config = githubConfig();
  if (!config) return null;

  type GithubFile = {
    type: 'file';
    content: string;
    encoding: string;
  };

  try {
    const file = await githubRequest<GithubFile>(`/contents/${repoPath}?ref=${encodeURIComponent(config.branch)}`, {
      method: 'GET'
    });

    if (file.type !== 'file' || file.encoding !== 'base64') return null;
    return fromBase64(file.content);
  } catch (error) {
    if (error instanceof Error && error.message === 'GitHub content was not found.') return null;
    throw error;
  }
}

async function listGithubEssayFiles() {
  const config = githubConfig();
  if (!config) return null;

  type GithubContentItem = {
    name: string;
    path: string;
    type: string;
  };

  try {
    const items = await githubRequest<GithubContentItem[]>(
      `/contents/src/content/essays?ref=${encodeURIComponent(config.branch)}`,
      { method: 'GET' }
    );

    return items
      .filter((item) => item.type === 'file' && /\.mdx?$/i.test(item.name))
      .map((item) => ({ fileName: item.name, repoPath: item.path }));
  } catch (error) {
    if (error instanceof Error && error.message === 'GitHub content was not found.') return [];
    throw error;
  }
}

async function writeLocalAtomic(filePath: string, contents: string) {
  await mkdir(dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempPath, contents, { encoding: 'utf8', mode: 0o644 });
  await rename(tempPath, filePath);
}

export async function listEssaySources() {
  const githubFiles = await listGithubEssayFiles();
  if (githubFiles) return githubFiles;

  const files = (await readdir(essaysDir)).filter((fileName) => /\.mdx?$/i.test(fileName));
  return files.map((fileName) => ({
    fileName,
    repoPath: publicContentPath(resolve(essaysDir, fileName))
  }));
}

export async function readContentFile(repoPath: string) {
  const githubContents = await readGithubFile(repoPath);
  if (githubContents !== null) return githubContents;

  const filePath = resolve(projectRoot, repoPath);
  if (!filePath.startsWith(`${projectRoot}${sep}`)) return null;
  return readFile(filePath, 'utf8');
}

export async function applyContentChanges(message: string, changes: ContentChange[]) {
  const config = githubConfig();
  if (!config) {
    const written: string[] = [];
    const deleted: string[] = [];

    for (const change of changes) {
      const filePath = resolve(projectRoot, change.path);
      if (!filePath.startsWith(`${projectRoot}${sep}`)) throw new Error('Invalid content path.');

      if (change.delete) {
        await rm(filePath, { force: true });
        deleted.push(change.path);
      } else {
        if (typeof change.content !== 'string') throw new Error('Content is required for write changes.');
        await writeLocalAtomic(filePath, change.content);
        written.push(change.path);
      }
    }

    return { backend: 'local', written, deleted, commit: null };
  }

  type RefResponse = { object: { sha: string } };
  type CommitResponse = { tree: { sha: string } };
  type BlobResponse = { sha: string };
  type TreeResponse = { sha: string };
  type NewCommitResponse = { sha: string; html_url: string };

  const ref = await githubRequest<RefResponse>(`/git/ref/heads/${encodeURIComponent(config.branch)}`, { method: 'GET' });
  const baseSha = ref.object.sha;
  const baseCommit = await githubRequest<CommitResponse>(`/git/commits/${baseSha}`, { method: 'GET' });

  const tree = [];
  for (const change of changes) {
    if (change.delete) {
      const existing = await readGithubFile(change.path);
      if (existing === null) continue;
      tree.push({ path: change.path, mode: '100644', type: 'blob', sha: null });
      continue;
    }

    if (typeof change.content !== 'string') throw new Error('Content is required for write changes.');
    const blob = await githubRequest<BlobResponse>('/git/blobs', {
      method: 'POST',
      body: JSON.stringify({ content: toBase64(change.content), encoding: 'base64' })
    });
    tree.push({ path: change.path, mode: '100644', type: 'blob', sha: blob.sha });
  }

  const newTree = await githubRequest<TreeResponse>('/git/trees', {
    method: 'POST',
    body: JSON.stringify({
      base_tree: baseCommit.tree.sha,
      tree
    })
  });

  const commit = await githubRequest<NewCommitResponse>('/git/commits', {
    method: 'POST',
    body: JSON.stringify({
      message,
      tree: newTree.sha,
      parents: [baseSha]
    })
  });

  await githubRequest(`/git/refs/heads/${encodeURIComponent(config.branch)}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha })
  });

  return {
    backend: 'github',
    written: changes.filter((change) => !change.delete).map((change) => change.path),
    deleted: changes.filter((change) => change.delete).map((change) => change.path),
    commit: {
      sha: commit.sha,
      url: commit.html_url
    }
  };
}
