import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { loadAppsScript } from './helpers/load-appsscript.mjs';

const APPROVED = ['Daily_Sales', 'Product_Period', 'Ads_Period', 'Traffic_Period', 'Creator_Period'];
const HEADERS = {
  Daily_Sales: ['record_key', 'batch_id', 'platform', 'sales_date', 'period_start', 'period_end', 'metric_scope', 'gross_gmv', 'confirmed_gmv', 'orders', 'units', 'visitors', 'refund_gmv', 'cancelled_gmv', 'source_file'],
  Product_Period: ['record_key', 'batch_id', 'platform', 'sku', 'product_name', 'period_start', 'period_end', 'sales_gmv', 'ordered_gmv', 'orders', 'units', 'buyers', 'views', 'clicks', 'ctr', 'conversion_rate', 'aov', 'source_file'],
  Ads_Period: ['record_key', 'batch_id', 'platform', 'campaign_name', 'period_start', 'period_end', 'spend', 'attributed_sales', 'roas', 'impressions', 'clicks', 'orders', 'source_file'],
  Traffic_Period: ['record_key', 'batch_id', 'platform', 'traffic_source', 'period_start', 'period_end', 'sales_gmv', 'visitors', 'clicks', 'views', 'source_file'],
  Creator_Period: ['record_key', 'batch_id', 'platform', 'creator_name', 'period_start', 'period_end', 'gmv', 'orders', 'units', 'refunds', 'commission', 'source_file'],
};

const ALLOWED_USER = {
  User_ID: 'user-1',
  Workspace_ID: 'workspace-allowed',
  Email: 'allowed@example.test',
  Role: 'EXECUTIVE',
  Is_Active: true,
};

function setup({
  users = [ALLOWED_USER],
  identity = 'allowed@example.test',
  expectedWorkspaceId = 'workspace-allowed',
  renderApp = () => 'APP_HTML',
  renderDenied = () => 'DENIED_HTML',
  readPhase1Sheet,
  historicalSnapshot,
} = {}) {
  const context = loadAppsScript();
  const repo = context.PPG_REPO_memory_({ Users: users });
  const reads = [];
  const reader = readPhase1Sheet || ((sheetName) => {
    reads.push(sheetName);
    return { headers: HEADERS[sheetName], rows: [] };
  });
  context.PPG_RPC_setDeps_({
    repo,
    identity: () => identity,
    expectedWorkspaceId,
    readPhase1Sheet: reader,
    renderApp,
    renderDenied,
    historicalSnapshot,
  });
  return { context, reads, repo };
}

function assertSafeDenied(response, code) {
  assert.equal(response.ok, false);
  assert.equal(response.error.code, code);
  assert.equal(response.data, null);
  assert.doesNotMatch(JSON.stringify(response), /confirmed_gmv|gross_gmv|workspace-allowed|Historical Snapshot|secret/i);
}

test('allowed active user must match the expected workspace before Phase 1 reads', () => {
  const { context, reads } = setup();
  const response = context.getPhase1Bootstrap({});

  assert.equal(response.ok, true);
  assert.equal(response.data.user.workspaceId, 'workspace-allowed');
  assert.deepEqual(JSON.parse(JSON.stringify(reads)), APPROVED);
});

test('deployed expected workspace comes from Script Properties and missing configuration denies', () => {
  const configured = setup();
  configured.context.PropertiesService = {
    getScriptProperties: () => ({
      getProperty: (name) => name === 'PPG_EXPECTED_WORKSPACE_ID' ? 'workspace-allowed' : null,
    }),
  };
  configured.context.PPG_RPC_setDeps_({ expectedWorkspaceId: undefined });
  assert.equal(configured.context.getPhase1Bootstrap({}).ok, true);

  const missing = setup();
  missing.context.PropertiesService = {
    getScriptProperties: () => ({ getProperty: () => null }),
  };
  missing.context.PPG_RPC_setDeps_({ expectedWorkspaceId: undefined });
  assertSafeDenied(missing.context.getPhase1Bootstrap({}), 'WORKSPACE_REQUIRED');
});

test('wrong-workspace users are denied before View Tabs or Historical Snapshot access', () => {
  let appRendered = false;
  let deniedRendered = false;
  const snapshot = {
    source: 'secret snapshot',
    snapshotDate: '2026-08-31',
    daily: [{ confirmed_gmv: 999 }],
  };
  const { context, reads } = setup({
    users: [{ ...ALLOWED_USER, Workspace_ID: 'workspace-other' }],
    historicalSnapshot: snapshot,
    renderApp: () => { appRendered = true; return 'PROTECTED_APP'; },
    renderDenied: () => { deniedRendered = true; return 'DENIED_HTML'; },
    readPhase1Sheet: () => { throw new Error('must not read protected source'); },
  });

  const response = context.getPhase1Bootstrap({});
  assertSafeDenied(response, 'WORKSPACE_MISMATCH');
  assert.equal(reads.length, 0);
  assert.equal(context.doGet(), 'DENIED_HTML');
  assert.equal(appRendered, false);
  assert.equal(deniedRendered, true);
  assert.doesNotMatch(JSON.stringify(context.getPhase1Bootstrap({})), /secret snapshot|999/);
});

test('missing user workspace fails closed with a stable safe error', () => {
  const { context, reads } = setup({ users: [{ ...ALLOWED_USER, Workspace_ID: '' }] });
  const response = context.getPhase1Data({ start: '2026-08-01', end: '2026-08-01' });

  assertSafeDenied(response, 'WORKSPACE_REQUIRED');
  assert.deepEqual(reads, []);
});

test('doGet renders only after authorization and local preview without workspace config is denied', () => {
  let appRendered = false;
  const allowed = setup({
    renderApp: (user) => {
      appRendered = true;
      assert.equal(user.workspaceId, 'workspace-allowed');
      return 'APP_HTML';
    },
  });
  assert.equal(allowed.context.doGet(), 'APP_HTML');
  assert.equal(appRendered, true);

  const denied = setup({ identity: 'unknown@example.test', renderApp: () => 'PROTECTED_APP' });
  assert.equal(denied.context.doGet(), 'DENIED_HTML');

  const localPreview = setup({ expectedWorkspaceId: null, renderApp: () => 'PROTECTED_APP' });
  assert.equal(localPreview.context.doGet(), 'DENIED_HTML');
  assert.equal(localPreview.context.PPG_RPC_renderApp_(), 'DENIED_HTML');
});

test('authorized Apps Script doGet keeps the dashboard file render seam deployable', () => {
  const deployed = setup();
  deployed.context.PPG_RPC_setDeps_({ renderApp: null });
  deployed.context.HtmlService = {
    createHtmlOutputFromFile: (name) => ({
      setTitle: (title) => ({ name, title }),
    }),
  };

  const output = deployed.context.doGet();
  assert.equal(output.name, 'dashboard');
  assert.equal(output.title, 'PPG Sales Dashboard');
});

test('request workspace, when supplied, cannot override the authorized workspace', () => {
  const { context } = setup();
  const response = context.getPhase1Bootstrap({ workspaceId: 'workspace-other' });

  assertSafeDenied(response, 'WORKSPACE_MISMATCH');
});

test('Phase 1 manifest requests only read-only Spreadsheet and identity scopes', () => {
  const configPath = new URL('../appsscript.json', import.meta.url);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  assert.equal(config.runtimeVersion, 'V8');
  assert.deepEqual(config.oauthScopes, [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
  ]);
  assert.equal('dependencies' in config, false);
  assert.doesNotMatch(JSON.stringify(config), /drive|file.?lifecycle|advanced.?service/i);
});

test('public write and administration facades remain blocked after workspace authorization', () => {
  const { context, repo } = setup();
  const before = JSON.stringify(repo.tables);
  for (const name of ['uploadFiles', 'createAction', 'updateAction', 'changeActionStatus', 'setUserRole', 'getSystemHealth']) {
    const response = context[name]({ title: 'must not write', actionId: 'missing', status: 'DONE', role: 'ADMIN' });
    assertSafeDenied({ ...response, error: response.error }, 'READ_ONLY');
  }
  assert.equal(JSON.stringify(repo.tables), before);
});
