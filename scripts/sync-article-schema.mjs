import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const site = join(root, 'site');

function capture(html, pattern, file, field) {
  const value = html.match(pattern)?.[1];
  if (value === undefined) throw new Error(`${file}: missing ${field}`);
  return value.replaceAll('&amp;', '&').replaceAll('&quot;', '"');
}

let changed = 0;
for (const file of readdirSync(site).filter((name) => name.endsWith('.html')).sort()) {
  const path = join(site, file);
  const html = readFileSync(path, 'utf8');
  if (!html.includes('property="og:type" content="article"') || html.includes('application/ld+json')) continue;

  const headline = capture(html, /<title>([^<]+)<\/title>/, file, 'title');
  const description = capture(html, /<meta name="description" content="([^"]+)"/, file, 'description');
  const url = capture(html, /<link rel="canonical" href="([^"]+)"/, file, 'canonical URL');
  const dateModified = html.match(/Verified (\d{4}-\d{2}-\d{2})/)?.[1] ?? '2026-08-20';
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline,
    description,
    dateModified,
    url,
    mainEntityOfPage: url,
    author: { '@type': 'Organization', name: 'SandBase', url: 'https://sandbase.ai/' },
    publisher: { '@type': 'Organization', name: 'SandBase', url: 'https://sandbase.ai/' },
    inLanguage: 'en',
    isAccessibleForFree: true,
  });
  const insertion = `<script type="application/ld+json">${schema}</script>`;
  writeFileSync(path, html.replace('</head>', `${insertion}</head>`));
  changed += 1;
}

console.log(`Added TechArticle JSON-LD to ${changed} page${changed === 1 ? '' : 's'}.`);
