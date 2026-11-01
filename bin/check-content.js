#!/usr/bin/env node
/**
 * bin/check-content.js — Validator for Hugo markdown content files.
 * Usage: node bin/check-content.js <md files…>
 * Exit 0 = all checks pass (warnings OK). Exit 1 = any failure.
 * Options: --strict  (turns warnings into errors)
 */

const fs = require('fs');
const path = require('path');

let strictMode = false;
const files = [];

for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === '--strict') {
    strictMode = true;
  } else {
    let p;
    if (path.isAbsolute(arg)) {
      p = arg;
    } else if (arg.endsWith('meetings') || arg.endsWith('jobs') || arg.endsWith('article')) {
      const dir = path.resolve(process.cwd(), arg);
      fs.readdirSync(dir).filter(f => f.endsWith('.md')).forEach(f => files.push(path.join(dir, f)));
    } else {
      p = path.resolve(process.cwd(), arg);
      files.push(p);
    }
  }
}

if (files.length === 0) {
  console.error('Usage: node bin/check-content.js <md files…>');
  process.exit(1);
}

let hasError = false;
const warnings = [];
const errors = [];

function warn(file, msg) { warnings.push(`${file}: WARN: ${msg}`); }
function err(file, msg) { errors.push(`${file}: ERR: ${msg}`); hasError = true; }

// ── Load all batch manifests for planned-target resolution ─────────

const batchManifests = {};
const batchesDir = path.resolve(process.cwd(), 'plan/batches');
if (fs.existsSync(batchesDir)) {
  fs.readdirSync(batchesDir).forEach(f => {
    if (!f.endsWith('.txt')) return;
    const lines = fs.readFileSync(path.join(batchesDir, f), 'utf8').trim().split('\n');
    const parts = f.replace('.txt', '').split('-');
    const prefix = parts[0];
    for (const line of lines) {
      if (!line.trim()) continue;
      const slug = line.trim().replace(/\.html$/, '');
      if (!batchManifests[prefix]) batchManifests[prefix] = new Set();
      batchManifests[prefix].add(slug);
    }
  });
}

// ── Process each file ─────────────────────────────────────────────

files.forEach(f => {
  const filePath = path.resolve(process.cwd(), f);
  if (!fs.existsSync(filePath)) {
    err(f, 'File not found');
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Parse front matter between --- delimiters
  let fmStart = -1, fmEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    if (fmStart === -1 && lines[i].trim() === '---') { fmStart = i + 1; continue; }
    if (fmStart > -1 && fmEnd === -1 && lines[i].trim() === '---') { fmEnd = i; break; }
  }
  const fmLines = fmStart >= 0 ? lines.slice(fmStart, fmEnd) : [];
  const fmBlock = fmLines.join('\n');

  // Extract specific front-matter keys via regex
  function fm(key) {
    // Direct key: value at top level
    let m = fmBlock.match(new RegExp('^\\s*' + key + '\\s*:\\s*(.+)$', 'm'));
    if (m) return m[1].trim();
    // Nested params.key (indented under params:)
    const lines2 = fmLines.filter(l => l.match(/^[ \t]/));
    for (const line of lines2) {
      const trimmed = line.trim();
      if (trimmed === 'params:') continue;
      m = trimmed.match(new RegExp('^' + key + '\\s*:\\s*(.+)$'));
      if (m) return m[1].trim();
    }
    return null;
  }

  const titleRaw = fm('title') || '';
  const dateVal = fm('date') || '';
  const draftVal = fm('draft');
  const expiryVal = fm('expiryDate') || '';
  const layoutVal = fm('layout') || '';

  // Extract params sub-keys from raw front matter
  let event_date = null, event_rsvp_url = null, event_map_url = null;
  let job_company = null;
  const bodyStartLine = fmEnd >= 0 ? fmEnd + 1 : lines.length;

  // Extract from raw front matter block (use \s* for leading whitespace)
  const evMatch = fmBlock.match(/event_date:\s*(\d{4}-\d{2}-\d{2})/);
  if (evMatch) event_date = evMatch[1];

  const rsvpMatch = fmBlock.match(/^\s*event_rsvp_url:\s*(.+)$/m);
  if (rsvpMatch) event_rsvp_url = rsvpMatch[1].trim();

  const mapMatch = fmBlock.match(/^\s*event_map_url:\s*(.+)$/m);
  if (mapMatch) event_map_url = mapMatch[1].trim();

  const jcMatch = fmBlock.match(/^\s*job_company:\s*(.+)$/m);
  if (jcMatch) job_company = jcMatch[1].trim();

  // ── Generic checks ─────────────────────────────────────────────
  if (!titleRaw) err(f, 'missing title');
  if (!dateVal) err(f, 'missing date');
  if (draftVal === 'true') err(f, 'draft must be false');

  // Get body text (everything after front matter)
  const bodyLines = lines.slice(bodyStartLine);
  const body = bodyLines.join('\n').trim();

  // First body line must not start with #, !, -, <
  const firstNonBlank = body.replace(/^\s+/, '').charAt(0);
  if (['#', '!', '-', '<'].includes(firstNonBlank)) {
    err(f, `body first line starts with '${firstNonBlank}' (must be prose)`);
  }

  // ── Bad content checks ─────────────────────────────────────────
  if (/<iframe[\s>]/i.test(content)) err(f, 'contains iframe');
  if (/\bstyle\s*=\s*["'][^"']*=[a-zA-Z]/.test(content)) err(f, 'contains inline style= assignment');
  if (/<font[\s>]/i.test(content)) err(f, 'contains <font>');
  if (/&nbsp;/.test(content)) err(f, 'contains &nbsp;');
  if (/\u200B/.test(content)) err(f, 'contains zero-width space (U+200B)');

  // Relative sites/sv-issa.org paths
  if (/>[\s\S]*?["'](\.\.)*\/sites\/sv-issa\.org\//i.test(content)) {
    err(f, 'contains relative sites/sv-issa.org path');
  }

  // UTM params in URLs
  const urlMatches = content.match(/https?:\/\/[^"'`\s]+/gi) || [];
  for (const url of urlMatches) {
    if (/utm_[a-z_]+/.test(url)) err(f, `URL contains utm_: ${url.substring(0, 80)}…`);
    if (/constantcontact\.com/.test(url) || /r20\.rs6\.net/.test(url)) {
      err(f, `Constant Contact link: ${url.substring(0, 80)}…`);
    }
    if (/\?destination=/.test(url)) err(f, `URL has ?destination=: ${url.substring(0, 80)}…`);
  }

  // Absolute https://sv-issa.org/sites/... (warning only)
  if (/https:\/\/sv-issa\.org\/sites\//i.test(content)) {
    warn(f, 'absolute sv-issa.org/sites/ link (PDFs may be missing from crawl)');
  }

  // ── Image reference checks ─────────────────────────────────────
  const imgRefs = content.match(/\/images\/[^\s"'\)\]]+/gi) || [];
  for (const ref of imgRefs) {
    // Resolve /images/... under static/images/
    let resolvedPath;
    if (ref.startsWith('/images/')) {
      resolvedPath = path.resolve(process.cwd(), 'static', ref.replace(/^\//, ''));
    } else {
      resolvedPath = path.resolve(process.cwd(), ref.substring(1));
    }
    if (!fs.existsSync(resolvedPath)) err(f, `image missing: ${ref} → ${resolvedPath}`);
    else if (fs.statSync(resolvedPath).size === 0) err(f, `image empty: ${ref}`);
  }

  // Front matter image refs (logo:, image:)
  const fmImgMatch = content.match(/(?:logo|image):\s*\/images\/([^\n]+)/g) || [];
  for (const match of fmImgMatch) {
    const parts2 = match.split('/');
    const lastPart = parts2[parts2.length - 1].replace(/["'\s]/g, '');
    const imgPath = path.resolve(process.cwd(), 'static/images', lastPart);
    if (!fs.existsSync(imgPath)) err(f, `image ref missing: ${match.trim()}`);
  }

  // ── Section-specific checks ────────────────────────────────────
  const isMeeting = layoutVal === 'meetings';
  const isJob = layoutVal === 'jobs';

  if (isMeeting) {
    if (!layoutVal) err(f, 'missing layout: meetings');
    if (!event_date) err(f, 'missing params.event_date');
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(event_date)) {
      err(f, `event_date not YYYY-MM-DD: ${event_date}`);
    }

    // RSVP before 2024 check
    if (event_rsvp_url && event_date) {
      const ed = new Date(event_date + 'T00:00:00');
      if (!isNaN(ed.getTime()) && ed < new Date('2024-01-01')) {
        err(f, `event_rsvp_url on pre-2024 event (date: ${event_date})`);
      }
    }

    // event_map_url must be Google Maps URL
    if (event_map_url) {
      const isMaps = /(?:goo\.gl\/maps|maps\.app\.goo\.gl|google\.com\/maps|maps\.google\.com)/i.test(event_map_url);
      if (!isMaps) err(f, `event_map_url is not Google Maps: ${event_map_url.substring(0, 80)}`);
    }

    // Warning: speaker name duplicates (simple check)
    const speakerNames = content.match(/name:\s*["']?([^"'\\n]+)/g) || [];
    if (speakerNames.length > 1) {
      const names = speakerNames.map(s => s.replace('name:', '').trim().replace(/["']/g, ''));
      const dupes = new Set(names.filter((v, i, a) => a.indexOf(v) !== i));
      if (dupes.size > 0) warn(f, `duplicated speaker names: ${[...dupes].join(', ')}`);
    }

    // Warning: body shorter than 40 chars
    if (body.length > 0 && body.length < 40) {
      warn(f, `body very short (${body.length} chars)`);
    }
  }

  if (isJob) {
    if (!layoutVal || layoutVal !== 'jobs') err(f, 'missing layout: jobs');
    if (!expiryVal) err(f, 'missing expiryDate');
    if (!job_company) err(f, 'missing params.job_company');
    if (expiryVal) {
      const expDate = new Date(expiryVal);
      if (!isNaN(expDate.getTime()) && expDate > new Date()) {
        warn(f, `expiryDate in the future: ${expiryVal}`);
      }
    }
  }

  // ── Internal link resolution ───────────────────────────────────
  const internalLinks = content.match(/(?:href|src)\s*=\s*["'](\/[^\s"']+\/?["'])/gi) || [];
  for (const m of internalLinks) {
    const hrefMatch = m.match(/["'](\/[^\s"']+\/?)["']/);
    if (!hrefMatch) continue;
    let target = hrefMatch[1];

    // Skip external URLs
    if (/^https?:\/\//i.test(target)) continue;

    // Convert to path under content/ or static/
    if (target.endsWith('.html')) {
      target = target.replace(/\.html$/, '').replace(/^\//, '');
    } else if (/^\/node\/\d+/.test(target)) {
      continue; // Skip dynamic node references
    }

    const cleanTarget = target + '.md';
    const contentPath = path.resolve(process.cwd(), 'content', cleanTarget);
    const staticPath = path.resolve(process.cwd(), target);

    if (!fs.existsSync(contentPath) && !fs.existsSync(staticPath)) {
      // Check if target is only planned (in batch manifests)
      const sectionFromTarget = Object.keys(batchManifests).find(s =>
        target.startsWith(`/${s}/`) || target.startsWith(`${s}/`)
      );
      if (sectionFromTarget && batchManifests[sectionFromTarget].has(target.replace(/^\//, ''))) {
        warn(f, `target only planned (in batches): ${target}`);
      } else {
        err(f, `internal link unresolved: ${target}`);
      }
    }
  }
});

// ── Report ─────────────────────────────────────────────────────────

if (warnings.length > 0) {
  console.log('WARNINGS:');
  warnings.forEach(w => console.log(`  ${w}`));
}

if (errors.length > 0) {
  console.log('\nERRORS:');
  errors.forEach(e => console.log(`  ${e}`));
}

console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length > 0 || strictMode && warnings.length > 0 ? 1 : 0);
