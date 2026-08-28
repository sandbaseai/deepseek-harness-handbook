import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const errors = [];
let index;
try {
  index = JSON.parse(read('site/awesome-deepseek-harness-resources.json'));
} catch (error) {
  errors.push(`Invalid resource index JSON: ${error.message}`);
}

if (index) {
  if (index.snapshot !== 'c2cc7c971f33340d0fed614341041be52e35f9dc') errors.push('Resource index snapshot is not the pinned Awesome catalog commit');
  if (!/^https:\/\//.test(index.consumer_guide ?? '')) errors.push('Resource index is missing an HTTPS consumer guide');
  if (!Array.isArray(index.resources) || index.resources.length < 1) errors.push('Resource index must contain resources');
  const names = new Set();
  const urls = new Set();
  for (const resource of index.resources ?? []) {
    for (const field of ['capability', 'name', 'url', 'why']) if (typeof resource[field] !== 'string' || resource[field].length === 0) errors.push(`Resource is missing ${field}`);
    if (names.has(resource.name)) errors.push(`Duplicate resource name: ${resource.name}`);
    if (urls.has(resource.url)) errors.push(`Duplicate resource URL: ${resource.url}`);
    names.add(resource.name);
    urls.add(resource.url);
  }
  const html = read('site/awesome-deepseek-harness-resources.html');
  if (!html.includes(`\"numberOfItems\":${index.resources.length}`)) errors.push('Static resource page ItemList count does not match JSON');
  const readme = read('README.md');
  if (!readme.includes(`${index.resources.length} curated Awesome resources`)) errors.push('English README resource count does not match JSON');
  const chineseReadme = read('docs/zh-CN/README.md');
  if (!chineseReadme.includes(`${index.resources.length} 个精选 Awesome 资源`)) errors.push('Chinese README resource count does not match JSON');
}

if (errors.length) {
  console.error(`Resource index verification failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Verified ${index.resources.length} Awesome resources against snapshot ${index.snapshot.slice(0, 8)}.`);
}
