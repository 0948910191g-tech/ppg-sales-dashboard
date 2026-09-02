import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildPhase1Package } from '../scripts/build-phase1-appsscript.mjs';
import { loadAppsScript, PHASE1_SOURCE_FILES } from './helpers/load-appsscript.mjs';

const EXPECTED_SOURCE_FILES = ['Config.gs', 'ApiCore.gs', 'Auth.gs', 'Phase1Repository.gs', 'Phase1ReadModel.gs', 'Rpc.gs'];
const EXPECTED_PACKAGE_FILES = ['appsscript.json', 'dashboard.html', ...EXPECTED_SOURCE_FILES];
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const BUILDER_PATH = path.join(PROJECT_ROOT, 'backend', 'scripts', 'build-phase1-appsscript.mjs');

function fakeSheet(headers, rows) {
  return {
    getLastRow: () => rows.length + 1,
    getLastColumn: () => headers.length,
    getRange: (row, _column, _rowCount, _columnCount) => ({
      getValues: () => row === 1 ? [headers] : rows,
    }),
  };
}

function fakeSpreadsheet() {
  const sheets = {
    Users: fakeSheet(['User_ID', 'Workspace_ID', 'Email', 'Role', 'Is_Active'], [['u-1', 'w-1', 'viewer@example.test', 'EXECUTIVE', true]]),
  };
  return {
    getSheetByName: (name) => sheets[name] || null,
  };
}

test('Phase 1 package is deterministic, co-located, least-privilege, and read-only', () => {
  const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ppg-phase1-package-'));
  try {
    const result = buildPhase1Package(outputDirectory);
    assert.deepEqual(PHASE1_SOURCE_FILES, EXPECTED_SOURCE_FILES);
    assert.deepEqual(result.files, EXPECTED_PACKAGE_FILES);
    assert.deepEqual(fs.readdirSync(outputDirectory).sort(), EXPECTED_PACKAGE_FILES.slice().sort());
    assert.equal(fs.existsSync(path.join(outputDirectory, 'dashboard.html')), true);
    assert.equal(
      fs.readFileSync(path.join(outputDirectory, 'dashboard.html'), 'utf8'),
      fs.readFileSync(path.join(PROJECT_ROOT, 'dashboard.html'), 'utf8'),
    );

    const manifest = JSON.parse(fs.readFileSync(path.join(outputDirectory, 'appsscript.json'), 'utf8'));
    assert.deepEqual(manifest, {
      timeZone: 'Asia/Bangkok',
      runtimeVersion: 'V8',
      oauthScopes: [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
    });

    const packageSource = EXPECTED_SOURCE_FILES
      .map((fileName) => fs.readFileSync(path.join(outputDirectory, fileName), 'utf8'))
      .join('\n');
    assert.doesNotMatch(packageSource, /(?:^|[\\/])(ImportService|ActionService|SetupService|Repository)\.gs/);
    assert.doesNotMatch(packageSource, /(?:ImportService|ActionService|SetupService|DriveApp)\b/);
    assert.doesNotMatch(packageSource, /(?:^|\s)(?:append|update)\s*:/);
    assert.doesNotMatch(packageSource, /PPG_REPO_(?:memory|fromSpreadsheet)_/);
    assert.doesNotMatch(packageSource, /(?:sk-|api[_-]?key|client[_-]?secret|-----BEGIN .* PRIVATE KEY-----)/i);
    assert.equal(packageSource.includes('PPG_SPREADSHEET_ID'), true, 'runtime property name is allowed; no value is packaged');
    assert.doesNotMatch(packageSource, /PPG_SPREADSHEET_ID\s*[:=]\s*['"][A-Za-z0-9_-]{12,}['"]/);

    const context = loadAppsScript({ sourceDirectory: outputDirectory, sourceFiles: EXPECTED_SOURCE_FILES });
    for (const functionName of [
      'PPG_PHASE1_REPO_fromSpreadsheet_',
      'PPG_PHASE1_readModel_',
      'PPG_RPC_repo_',
      'getPhase1Bootstrap',
      'getPhase1Data',
      'doGet',
    ]) {
      assert.equal(typeof context[functionName], 'function', `${functionName} must resolve from the package`);
    }
    for (const absentFunction of [
      'PPG_REPO_memory_',
      'PPG_REPO_fromSpreadsheet_',
      'PPG_IMPORT_registerUpload_',
      'PPG_ACTION_create_',
      'PPG_SETUP_execute_',
    ]) {
      assert.equal(typeof context[absentFunction], 'undefined', `${absentFunction} must not be packaged`);
    }

    const renderedFiles = [];
    context.PPG_RPC_setDeps_({
      repo: {
        readTable: (name) => name === 'Users'
          ? { headers: null, rows: [{ User_ID: 'u-1', Workspace_ID: 'w-1', Email: 'viewer@example.test', Role: 'EXECUTIVE', Is_Active: true }] }
          : { headers: null, rows: [] },
      },
      identity: () => 'viewer@example.test',
      expectedWorkspaceId: 'w-1',
    });
    context.HtmlService = {
      createHtmlOutputFromFile: (name) => {
        renderedFiles.push(name);
        assert.equal(name, 'dashboard');
        assert.equal(fs.existsSync(path.join(outputDirectory, `${name}.html`)), true);
        return { setTitle: (title) => ({ name, title }) };
      },
    };
    assert.deepEqual(context.doGet(), { name: 'dashboard', title: 'PPG Sales Dashboard' });
    assert.deepEqual(renderedFiles, ['dashboard']);

    const productionContext = loadAppsScript({ sourceDirectory: outputDirectory, sourceFiles: EXPECTED_SOURCE_FILES });
    const spreadsheet = fakeSpreadsheet();
    let openedId = null;
    productionContext.PropertiesService = {
      getScriptProperties: () => ({ getProperty: (name) => name === 'PPG_SPREADSHEET_ID' ? 'test-only-source' : null }),
    };
    productionContext.SpreadsheetApp = {
      openById: (id) => { openedId = id; return spreadsheet; },
    };
    const repo = productionContext.PPG_RPC_repo_();
    assert.equal(openedId, 'test-only-source');
    assert.deepEqual(Object.keys(repo).sort(), ['read', 'readTable']);
    assert.deepEqual(JSON.parse(JSON.stringify(repo.readTable('Users').rows)), [['u-1', 'w-1', 'viewer@example.test', 'EXECUTIVE', true]].map((row) => ({
      User_ID: row[0], Workspace_ID: row[1], Email: row[2], Role: row[3], Is_Active: row[4],
    })));
    assert.throws(() => repo.readTable('Action_Tasks'), /SOURCE_TAB_NOT_APPROVED/);
  } finally {
    fs.rmSync(outputDirectory, { recursive: true, force: true });
  }
});

test('Phase 1 package builder requires a narrow explicit target and preserves existing directories', () => {
  const missingOutput = spawnSync(
    process.execPath,
    [BUILDER_PATH],
    { cwd: PROJECT_ROOT, encoding: 'utf8' },
  );
  assert.notEqual(missingOutput.status, 0);
  assert.match(`${missingOutput.stdout}${missingOutput.stderr}`, /explicit output directory|Usage/);

  const broadTarget = spawnSync(
    process.execPath,
    [BUILDER_PATH, os.tmpdir()],
    { cwd: PROJECT_ROOT, encoding: 'utf8' },
  );
  assert.notEqual(broadTarget.status, 0);
  assert.match(`${broadTarget.stdout}${broadTarget.stderr}`, /broad output target|dedicated directory/i);

  const occupiedDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ppg-phase1-occupied-'));
  try {
    fs.writeFileSync(path.join(occupiedDirectory, 'keep.txt'), 'keep');
    assert.throws(() => buildPhase1Package(occupiedDirectory), /must be empty/);
    assert.equal(fs.readFileSync(path.join(occupiedDirectory, 'keep.txt'), 'utf8'), 'keep');
  } finally {
    fs.rmSync(occupiedDirectory, { recursive: true, force: true });
  }
});
