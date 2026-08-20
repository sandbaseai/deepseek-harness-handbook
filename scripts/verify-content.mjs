import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(readFileSync(join(root, 'content-manifest.json'), 'utf8'));
const errors = [];
const warnings = [];
const externalLinks = new Set();
const checkExternalLinks = process.argv.includes('--external-links');
const allowedStatuses = new Set(['canonical', 'reviewed', 'draft']);
const pagesOrigin = 'https://sandbaseai.github.io/deepseek-harness-handbook/';
const repositoryBlobOrigin = 'https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/';
const siteDirectory = join(root, 'site');

function verifyCanonicalSiteTarget(sourcePath, target) {
  const localPath = target.slice(pagesOrigin.length).split('#')[0].split('?')[0] || 'index.html';
  const resolvedTarget = normalize(join(siteDirectory, localPath));
  if (!existsSync(resolvedTarget)) errors.push(`Broken canonical site link in ${sourcePath}: ${target}`);
}

function verifyCanonicalRepositoryTarget(sourcePath, target) {
  const localPath = decodeURIComponent(target.slice(repositoryBlobOrigin.length).split('#')[0].split('?')[0]);
  const resolvedTarget = normalize(join(root, localPath));
  if (!resolvedTarget.startsWith(`${root}/`) || !existsSync(resolvedTarget)) {
    errors.push(`Broken canonical repository link in ${sourcePath}: ${target}`);
  }
}

function read(relativePath) {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) {
    errors.push(`Missing file: ${relativePath}`);
    return '';
  }
  return readFileSync(absolutePath, 'utf8');
}

function verifyPublishedCounts() {
  const readme = read('README.md');
  const homepage = read('site/index.html');
  const canonicalCount = manifest.pages.length;
  const indexMatch = homepage.match(/<div class="path-index" data-guide-index>([\s\S]*?)<\/div>/);
  if (indexMatch === null) {
    errors.push('Missing homepage visual guide index');
    return;
  }
  const visualCount = (indexMatch[1].match(/<a\s/g) ?? []).length;
  if (!readme.includes(`| English | Canonical | ${canonicalCount} pages |`)) {
    errors.push(`README English coverage must match ${canonicalCount} canonical pages`);
  }
  if (!homepage.includes(`Explore ${canonicalCount} canonical guides`)) {
    errors.push(`Homepage hero count must match ${canonicalCount} canonical guides`);
  }
  if (!homepage.includes(`content="${canonicalCount} source-backed guides plus interactive tools`)) {
    errors.push(`Homepage social descriptions must match ${canonicalCount} canonical guides`);
  } else {
    const socialDescriptionCount = homepage.match(
      new RegExp(`content="${canonicalCount} source-backed guides plus interactive tools`, 'g'),
    )?.length ?? 0;
    if (socialDescriptionCount !== 2) {
      errors.push(`Homepage Open Graph and Twitter descriptions must both match ${canonicalCount} canonical guides`);
    }
  }
  if (!homepage.includes(`<strong>${canonicalCount}</strong><span>canonical English guides</span>`)) {
    errors.push(`Homepage evidence count must match ${canonicalCount} canonical guides`);
  }
  if (!homepage.includes(`>${visualCount} indexed paths</p>`)) {
    errors.push(`Homepage initial search count must match ${visualCount} visual paths`);
  }
}

function frontmatter(relativePath, text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    errors.push(`Missing frontmatter: ${relativePath}`);
    return {};
  }
  return Object.fromEntries(
    match[1].split('\n').map((line) => {
      const separator = line.indexOf(':');
      return separator === -1
        ? [line.trim(), '']
        : [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
    }),
  );
}

function markdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? markdownFiles(path) : extname(path) === '.md' ? [path] : [];
  });
}

verifyPublishedCounts();

for (const page of manifest.pages) {
  const sourceText = read(page.source);
  const sourceMeta = frontmatter(page.source, sourceText);
  if (sourceMeta.locale !== manifest.canonical_locale) errors.push(`Wrong canonical locale: ${page.source}`);
  if (sourceMeta.status !== 'canonical') errors.push(`Canonical page must use status canonical: ${page.source}`);
  if (Number(sourceMeta.content_revision) !== page.revision) errors.push(`Revision mismatch: ${page.source}`);
  if (!sourceMeta.verified_at) errors.push(`Missing verified_at: ${page.source}`);

  for (const [locale, translationPath] of Object.entries(page.translations)) {
    const translationText = read(translationPath);
    const meta = frontmatter(translationPath, translationText);
    if (meta.locale !== locale) errors.push(`Locale mismatch: ${translationPath}`);
    if (meta.source !== page.source) errors.push(`Source mismatch: ${translationPath}`);
    if (Number(meta.source_revision) !== page.revision) errors.push(`Stale translation: ${translationPath}`);
    if (!allowedStatuses.has(meta.status)) errors.push(`Invalid status: ${translationPath}`);
  }
}

const docsFiles = markdownFiles(join(root, 'docs'));
for (const absolutePath of docsFiles) {
  const relativePath = absolutePath.slice(root.length + 1);
  const text = readFileSync(absolutePath, 'utf8');
  const meta = frontmatter(relativePath, text);
  if (!meta.title || !meta.locale || !meta.status || !meta.verified_at) {
    errors.push(`Incomplete frontmatter: ${relativePath}`);
  }

  const secretPatterns = [/(?:^|[^A-Za-z0-9])sk-[A-Za-z0-9]{20,}/, /ghp_[A-Za-z0-9]{20,}/];
  if (secretPatterns.some((pattern) => pattern.test(text))) errors.push(`Possible secret: ${relativePath}`);
}

const allMarkdown = [join(root, 'README.md'), ...docsFiles];
for (const absolutePath of allMarkdown) {
  const text = readFileSync(absolutePath, 'utf8');
  const links = [...text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]);
  for (const target of links) {
    if (/^https?:/.test(target)) {
      if (target.startsWith(pagesOrigin)) {
        verifyCanonicalSiteTarget(absolutePath.slice(root.length + 1), target);
        continue;
      }
      if (target.startsWith(repositoryBlobOrigin)) {
        verifyCanonicalRepositoryTarget(absolutePath.slice(root.length + 1), target);
        continue;
      }
      externalLinks.add(target.split('#')[0]);
      continue;
    }
    if (/^(mailto:|#)/.test(target)) continue;
    const cleanTarget = target.split('#')[0].split('?')[0];
    if (!cleanTarget) continue;
    const resolvedTarget = normalize(join(dirname(absolutePath), cleanTarget));
    if (!existsSync(resolvedTarget)) errors.push(`Broken local link in ${absolutePath.slice(root.length + 1)}: ${target}`);
  }
}

if (existsSync(siteDirectory)) {
  const siteFiles = readdirSync(siteDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(siteDirectory, entry.name));

  for (const absolutePath of siteFiles.filter((path) => extname(path) === '.html')) {
    const text = readFileSync(absolutePath, 'utf8');
    const targets = [...text.matchAll(/(?:href|src)=["']([^"']+)["']/g)].map((match) => match[1]);
    for (const target of targets) {
      if (/^https?:/.test(target)) {
        if (target.startsWith(pagesOrigin)) {
          verifyCanonicalSiteTarget(absolutePath.slice(root.length + 1), target);
          continue;
        }
        if (target.startsWith(repositoryBlobOrigin)) {
          verifyCanonicalRepositoryTarget(absolutePath.slice(root.length + 1), target);
          continue;
        }
        externalLinks.add(target.split('#')[0]);
        continue;
      }
      if (/^(#|data:|mailto:|javascript:)/.test(target)) continue;
      const cleanTarget = target.split('#')[0].split('?')[0];
      if (!cleanTarget || cleanTarget === './') continue;
      const resolvedTarget = normalize(join(dirname(absolutePath), cleanTarget));
      if (!existsSync(resolvedTarget)) errors.push(`Broken site link in ${absolutePath.slice(root.length + 1)}: ${target}`);
    }
  }
}

async function verifyExternalLink(url) {
  let requestUrl = url;
  const headers = { 'user-agent': 'deepseek-harness-handbook-link-check' };
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parsed.hostname === 'github.com' && parts.length >= 2) {
      const [owner, repository, kind, ref, ...rest] = parts;
      const apiBase = `https://api.github.com/repos/${owner}/${repository}`;
      if (!kind) requestUrl = apiBase;
      else if ((kind === 'blob' || kind === 'tree') && ref && rest.length) {
        requestUrl = `${apiBase}/contents/${rest.join('/')}?ref=${encodeURIComponent(ref)}`;
      } else if (kind === 'commit' && ref) requestUrl = `${apiBase}/commits/${ref}`;
      else if (kind === 'pull' && ref) requestUrl = `${apiBase}/pulls/${ref}`;
      else if (kind === 'issues' && ref && /^\d+$/.test(ref)) requestUrl = `${apiBase}/issues/${ref}`;
    }
  } catch {
    // The original URL will surface any parse or protocol problem.
  }
  if (requestUrl.startsWith('https://api.github.com/')) {
    headers.accept = 'application/vnd.github+json';
    if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  try {
    const response = await fetch(requestUrl, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(4_000),
      headers,
    });
    if (response.status === 404 || response.status === 410) errors.push(`Dead external link (${response.status}): ${url}`);
    else if (response.status === 403 || response.status === 429 || response.status >= 500) warnings.push(`External link not fully verified (${response.status}): ${url}`);
  } catch (error) {
    warnings.push(`External link check unavailable: ${url} (${error.message})`);
  }
}

if (checkExternalLinks) {
  const queue = [...externalLinks];
  const workers = Array.from({ length: Math.min(16, queue.length) }, async () => {
    while (queue.length) await verifyExternalLink(queue.shift());
  });
  await Promise.all(workers);
}

if (errors.length) {
  console.error(`Content verification failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

for (const warning of warnings.slice(0, 12)) console.warn(`Warning: ${warning}`);
if (warnings.length > 12) console.warn(`Warning: ${warnings.length - 12} additional external links could not be fully verified.`);

console.log(`Verified ${manifest.pages.length} canonical pages and ${docsFiles.length} localized documents${checkExternalLinks ? `; checked ${externalLinks.size} external links` : ''}.`);
