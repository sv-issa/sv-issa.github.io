#!/usr/bin/env node
/**
 * bin/oldpage.js — View-only parser for old Drupal HTML pages.
 * Usage: node bin/oldpage.js <path under oldsite/sv-issa.org/>
 * Prints: title, dates, meeting date + RSVP href, cleaned <article> body.
 * No dependencies, plain Node.
 */

const fs = require('fs');
const path = require('path');

const usage = 'Usage: node bin/oldpage.js <path under oldsite/sv-issa.org/>';

if (process.argv.length < 3) {
  console.error(usage);
  process.exit(1);
}

// Resolve the file path (relative to /workspace by convention)
let filePath;
const arg = process.argv[2];
if (path.isAbsolute(arg)) {
  filePath = arg;
} else {
  // Accept relative paths like "meetings/foo.html" — resolve under oldsite/
  if (arg.startsWith('oldsite/') || arg.startsWith('oldsite\\')) {
    filePath = path.resolve(process.cwd(), arg);
  } else {
    filePath = path.resolve(process.cwd(), 'oldsite/sv-issa.org', arg);
  }
}

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const html = fs.readFileSync(filePath, 'utf8');

// ── Extract metadata ──────────────────────────────────────────────

function extractMeta(name) {
  const re = new RegExp(`<meta[^>]+property=["'][^"'']*${name}[^"'']*["'][^>]+content=["']([^"']+)["']`, 'i');
  const m = html.match(re);
  return m ? m[1] : null;
}

function extractMetaAlt(name) {
  const re = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
  const m = html.match(re);
  return m ? m[1] : null;
}

const titleRaw = extractMeta('og:title') || extractMetaAlt('title') || '';
const publishedTime = extractMeta('article:published_time') || '';
const modifiedTime = extractMeta('article:modified_time') || '';

// dc:date from the meeting date field
const dcDateMatch = html.match(/property=["']dc:date["'][^>]*content=["']([^"']+)["']/i);
const dcDateVal = dcDateMatch ? dcDateMatch[1] : null;

// RSVP link
let rsvpUrl = null;
const rsvpRe = /<a[^>]+href=["'](.*?)["'][^>]*>RSVP Link<\/a>/gi;
const m = rsvpRe.exec(html);
if (m) {
  rsvpUrl = m[1];
}

// ── Print metadata header ────────────────────────────────────────

console.log(`title: ${titleRaw}`);
console.log(`published: ${publishedTime || '(none)'}`);
console.log(`modified: ${modifiedTime || '(none)'}`);
if (dcDateVal) {
  console.log(`meeting_date: ${dcDateVal}`);
}
if (rsvpUrl) {
  const host = (() => { try { return new URL(rsvpUrl).host; } catch { return 'parse-fail'; } })();
  console.log(`rsvp: ${rsvpUrl}  [host=${host}]`);
}

// ── Extract and clean <article> body ─────────────────────────────

const articleRe = /<article[^>]*>([\s\S]*?)<\/article>/i;
const am = html.match(articleRe);
if (!am) {
  console.error('No <article> found in HTML');
  process.exit(1);
}

let body = am[1];

// Remove rdf-meta spans
body = body.replace(/<span[^>]*class=["'][^"\']*rdf-meta[^"\']*["'][^>]*>[\s\S]*?<\/span>/gi, '[rdf-meta]');

// Remove comments/links <ul> block (typically at the end of the article)
// This is a <ul class="links inline"> or similar with comment links
body = body.replace(/<ul\s+class=["'][^"\']*links[^"\']*inline[^"\']*["'][^>]*>[\s\S]*?<\/ul>/gi, '[comments/links removed]');

// Replace field-label divs with markers
const labels = {
  'Topic': 'Topic',
  'Speaker': 'Speaker',
  'Location': 'Location',
};
for (const [key] of Object.entries(labels)) {
  const re = new RegExp(`<div class=["'][^"\']*field-label[^"\']*["']>[^<]*${key}<[^<]*:[\\&nbsp;]*</div>`, 'gi');
  body = body.replace(re, `[${labels[key]}]`);
}

// Replace iframes with marker
body = body.replace(/<iframe[\s\S]*?<\/iframe>/gi, '[iframe map]');

console.log('');
console.log(body.trim());
