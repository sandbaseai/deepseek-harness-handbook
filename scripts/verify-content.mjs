import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(readFileSync(join(root, 'content-manifest.json'), 'utf8'));
const errors = [];
const allowedStatuses = new Set(['canonical', 'reviewed', 'draft']);

function read(relativePath) {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) {
    errors.push(`Missing file: ${relativePath}`);
    return '';
  }
  return readFileSync(absolutePath, 'utf8');
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
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const cleanTarget = target.split('#')[0].split('?')[0];
    if (!cleanTarget) continue;
    const resolvedTarget = normalize(join(dirname(absolutePath), cleanTarget));
    if (!existsSync(resolvedTarget)) errors.push(`Broken local link in ${absolutePath.slice(root.length + 1)}: ${target}`);
  }
}

if (errors.length) {
  console.error(`Content verification failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Verified ${manifest.pages.length} canonical pages and ${docsFiles.length} localized documents.`);
