import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const releaseDoc = fs.readFileSync(new URL('docs/tickets/release/phase-1-secured-readonly-release-gate.md', root), 'utf8');
const contextDoc = fs.readFileSync(new URL('CONTEXT.md', root), 'utf8');
const adrDoc = fs.readFileSync(new URL('docs/adr/0001-secured-read-model-before-operations.md', root), 'utf8');

test('release gate artifact names every Phase 1 automated coverage area', () => {
  for (const term of [
    'Identity', 'Allowlist', 'Read-only', 'Validation', 'Null safety', 'Periods',
    'Comparison', 'Period scope', 'Source failure', 'Fallback', 'Auth boundary',
    'Benchmark', 'Review',
  ]) {
    assert.match(releaseDoc, new RegExp(`\\| ${term} \\|`), `release matrix is missing ${term}`);
  }
});

test('release gate artifact includes browser, reconciliation, approval, and rollback evidence', () => {
  for (const heading of [
    '## Browser QA checklist',
    '## Source reconciliation record',
    '## Deployment approval gate',
    '## Rollback gate',
  ]) {
    assert.match(releaseDoc, new RegExp(heading.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')));
  }
  assert.match(releaseDoc, /อย่างน้อย 1 เดือน ครอบคลุม Shopee และ TikTok/);
  assert.match(releaseDoc, /PENDING_APPROVAL/);
});

test('release gate explicitly prohibits unapproved production mutation and deployment', () => {
  assert.match(releaseDoc, /ห้าม deploy/);
  assert.match(releaseDoc, /clasp push/);
  assert.match(releaseDoc, /แก้ production Sheet/);
  assert.match(releaseDoc, /human approval/);
});

test('domain docs preserve the secured read-model decision and shared vocabulary', () => {
  for (const term of ['Confirmed GMV', 'Coverage', 'Data Through', 'Historical Snapshot', 'Attention Queue', 'Read-only Phase']) {
    assert.match(contextDoc, new RegExp(`\\*\\*${term}\\*\\*`));
  }
  assert.match(adrDoc, /Status: accepted/);
  assert.match(adrDoc, /secured read model/i);
  assert.match(adrDoc, /persistent Actions/);
});
