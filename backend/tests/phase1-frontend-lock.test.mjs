import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildPhase1Package } from '../scripts/build-phase1-appsscript.mjs';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LATEST_FRONTEND = path.join(PROJECT_ROOT, 'dashboard-reference-prototype.html');

test('Phase 1 deployment packages the latest approved dashboard UI as dashboard.html', () => {
  const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ppg-phase1-frontend-lock-'));
  try {
    buildPhase1Package(outputDirectory);
    assert.equal(
      fs.readFileSync(path.join(outputDirectory, 'dashboard.html'), 'utf8'),
      fs.readFileSync(LATEST_FRONTEND, 'utf8'),
    );
  } finally {
    fs.rmSync(outputDirectory, { recursive: true, force: true });
  }
});
