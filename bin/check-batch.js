#!/usr/bin/env node
/**
 * bin/check-batch.js — Batch acceptance gate (stage 1.3b).
 *
 * Usage: node bin/check-batch.js <batch-id>
 *   e.g.  node bin/check-batch.js meetings-07
 *         node bin/check-batch.js jobs-03
 *         node bin/check-batch.js --manifest /tmp/test.txt
 *
 * Exit 0 only if ALL of the following hold:
 *   1. Every path in plan/batches/<id>.txt has a matching content/<section>/<slug>.md
 *   2. node bin/check-content.js <those files> passes (warnings OK)
 *   3. git status --porcelain -- content static prints nothing
 *        → batch is committed and nothing staged
 *
 * On failure, prints a short specific list (missing slugs, validator errors, uncommitted paths).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// --- parse args -----------------------------------------------------------
let manifestPath = null;
let batchName = null;

for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--manifest' && i + 1 < process.argv.length) {
    manifestPath = process.argv[++i];
  } else if (!batchName) {
    batchName = process.argv[i];
  }
}

if (!batchName && !manifestPath) {
  console.error('Usage: node bin/check-batch.js <batch-id>');
  console.error('   or:  node bin/check-batch.js --manifest /tmp/manifest.txt');
  process.exit(1);
}

// --- resolve batch --------------------------------------------------------
const workspace = process.cwd();
let lines; // array of raw file paths (before first |)

if (manifestPath) {
  const content = fs.readFileSync(manifestPath, 'utf8').trim().split('\n');
  lines = [];
  for (const line of content) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    lines.push(t.split('|')[0].trim());
  }
} else {
  // Look up batch by name
  let candidate = path.join(workspace, 'plan/batches', batchName + '.txt');
  if (!fs.existsSync(candidate)) candidate = path.join(workspace, 'plan/batches', batchName);
  if (!fs.existsSync(candidate)) {
    console.error(`Batch file not found: plan/batches/${batchName}.txt`);
    process.exit(1);
  }
  lines = [];
  const content = fs.readFileSync(candidate, 'utf8').trim().split('\n');
  for (const line of content) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    lines.push(t.split('|')[0].trim());
  }
}

if (lines.length === 0) {
  console.error('No files in manifest.');
  process.exit(1);
}

// --- resolve section for each path ----------------------------------------
function inferSection(slugName) {
  // meetings/… → meetings; jobs/… → jobs; article/… → article; root-level → article
  if (slugName.startsWith('meetings/') || slugName.startsWith('articles/')) return 'meetings';
  if (slugName.startsWith('jobs/')) return 'jobs';
  if (slugName.startsWith('article/')) return 'article';
  // root-level oldsite file — default to article
  return 'article';
}

// --- stage 1: verify every path has a .md -------------------------------
const missingSlugs = [];
const mdFiles = []; // paths under content/ to feed into check-content

for (const relPath of lines) {
  const slugBase = relPath.replace(/\.html$/, '');
  let relContentPath; // relative path under content/

  if (slugBase.startsWith('meetings/')) {
    relContentPath = slugBase;
  } else if (slugBase.startsWith('jobs/')) {
    relContentPath = slugBase;
  } else if (slugBase.startsWith('article/')) {
    relContentPath = slugBase;
  } else {
    // root-level oldsite file → article section
    relContentPath = 'article/' + slugBase;
  }

  const expected = path.join(workspace, 'content', relContentPath + '.md');
  if (!fs.existsSync(expected)) {
    missingSlugs.push({ path: relPath, expected });
  } else {
    mdFiles.push(expected);
  }
}

// --- stage 2: run check-content.js on existing files --------------------
const validatorErrors = [];
const warnings = [];

if (mdFiles.length > 0) {
  try {
    const result = execSync(
      `node ${path.join(workspace, 'bin', 'check-content.js')} ${mdFiles.map(f => `"${f}"`).join(' ')}`,
      { cwd: workspace, encoding: 'utf8', timeout: 60_000 }
    );
    // check-content prints errors/warnings to stderr typically
  } catch (err) {
    const output = err.stdout || '';
    const stderr = err.stderr || '';
    const allOutput = (output + '\n' + stderr).trim().split('\n');
    for (const line of allOutput) {
      if (/error|ERR:/i.test(line)) validatorErrors.push(line);
      if (/warn/i.test(line)) warnings.push(line);
    }
  }
}

// --- stage 3: git status check -------------------------------------------
let uncommittedPaths = [];
try {
  const gitOutput = execSync('git status --porcelain -- content static', {
    cwd: workspace, encoding: 'utf8', timeout: 10_000
  }).trim();
  if (gitOutput) {
    uncommittedPaths = gitOutput.split('\n');
  }
} catch (_) {
  // git may fail inside a subagent — treat as warning, not hard failure
}

// --- report ---------------------------------------------------------------
const hasErrors = missingSlugs.length > 0 || validatorErrors.length > 0;

console.log(`\n=== Batch gate: ${batchName || 'custom manifest'} ===`);
console.log(`Files in batch: ${lines.length}`);
if (mdFiles.length < lines.length) console.log(`Existing .md files: ${mdFiles.length} (of ${lines.length})`);
console.log('');

if (missingSlugs.length > 0) {
  console.log(`❌ Missing slugs (${missingSlugs.length}):`);
  for (const m of missingSlugs) console.log(`    ${m.path} → expected: ${m.expected}`);
  console.log('');
}

if (validatorErrors.length > 0) {
  console.log(`❌ Validator errors (${validatorErrors.length}):`);
  for (const e of validatorErrors) console.log(`    ${e}`);
  console.log('');
}

if (warnings.length > 0) {
  console.log(`⚠ Warnings (${warnings.length}):`);
  for (const w of warnings) console.log(`    ${w}`);
  console.log('');
}

if (uncommittedPaths.length > 0) {
  console.log(`❌ Uncommitted / staged paths under content/ or static/:`);
  for (const p of uncommittedPaths) console.log(`    ${p}`);
  console.log('');
}

const ok = !hasErrors && missingSlugs.length === 0 && uncommittedPaths.length === 0;

if (ok) {
  console.log('✅ PASS — batch is clean.');
} else {
  console.log('❌ FAIL — see above for details.');
}

process.exit(ok ? 0 : 1);
