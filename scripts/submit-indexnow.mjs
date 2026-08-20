import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const SITE_ROOT = 'https://sandbaseai.github.io/deepseek-harness-handbook/'
const SITEMAP_PATH = 'site/sitemap.xml'
const KEY_FILE = 'c5bbaff28841a399eada758c84565009.txt'
const KEY_PATH = `site/${KEY_FILE}`
const ENDPOINT = 'https://api.indexnow.org/indexnow'

function requireKey() {
  const key = process.env.INDEXNOW_KEY?.trim()
  if (key === undefined || !/^[A-Za-z0-9-]{8,128}$/.test(key)) {
    throw new Error('INDEXNOW_KEY must contain 8–128 letters, numbers, or dashes')
  }
  return key
}

function sitemapUrls() {
  const xml = readFileSync(SITEMAP_PATH, 'utf8')
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1])
}

function pageUrl(path) {
  if (path === 'site/index.html') return SITE_ROOT
  if (!path.startsWith('site/') || !path.endsWith('.html')) return undefined
  return new URL(path.slice('site/'.length), SITE_ROOT).href
}

function changedPaths(before, after) {
  const output = execFileSync('git', ['diff', '--name-status', before, after, '--', 'site'], { encoding: 'utf8' })
  return output.trim().split('\n').filter(Boolean).flatMap(line => line.split('\t').slice(1))
}

function mustSubmitAll(before, after, forceAll) {
  if (forceAll || !before || !after || /^0+$/.test(before)) return true
  return changedPaths(before, after).includes(KEY_PATH)
}

function validateUrls(urls) {
  if (urls.length > 10_000) throw new Error(`IndexNow accepts at most 10,000 URLs per request; received ${urls.length}`)
  const root = new URL(SITE_ROOT)
  for (const value of urls) {
    const url = new URL(value)
    if (url.origin !== root.origin || !url.pathname.startsWith(root.pathname)) {
      throw new Error(`URL is outside the verified key path: ${value}`)
    }
  }
}

const args = new Set(process.argv.slice(2))
const before = process.env.INDEXNOW_BEFORE
const after = process.env.INDEXNOW_AFTER
const all = mustSubmitAll(before, after, args.has('--all'))
const urls = [...new Set(all
  ? sitemapUrls()
  : changedPaths(before, after).map(pageUrl).filter(value => value !== undefined))]

if (urls.length === 0) {
  console.log('IndexNow: no changed HTML URLs to submit')
  process.exit(0)
}

validateUrls(urls)
const key = requireKey()
const payload = {
  host: new URL(SITE_ROOT).host,
  key,
  keyLocation: new URL(KEY_FILE, SITE_ROOT).href,
  urlList: urls,
}

if (args.has('--dry-run')) {
  console.log(JSON.stringify({ ...payload, key: '[public verification key]', count: urls.length }, undefined, 2))
  process.exit(0)
}

const response = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload),
})
const responseText = await response.text()
if (response.status !== 200 && response.status !== 202) {
  throw new Error(`IndexNow returned HTTP ${response.status}: ${responseText.slice(0, 500)}`)
}
console.log(`IndexNow accepted ${urls.length} URL(s) with HTTP ${response.status}`)
