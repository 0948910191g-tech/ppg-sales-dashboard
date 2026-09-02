import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { loadAppsScript } from './helpers/load-appsscript.mjs';

const PPG_EXPECTED_SHEETS = [
  'Settings', 'Users', 'Lists', 'Schema_Versions', 'DB_Import_Batches',
  'DB_Import_Files', 'DB_Import_Errors', 'Product_Master', 'DB_Canonical_Daily',
  'DB_Product_Period', 'DB_Ads_Period', 'DB_Traffic_Period', 'DB_Creator_Period',
  'DB_Competitor_Brand_Period', 'DB_Competitor_SKU_Period', 'Action_Tasks',
  'Action_History', 'Dashboard_Snapshots',
];

const PPG_EXPECTED_MANIFEST = {
  Settings: ['Workspace_ID', 'Setting_Key', 'Setting_Value', 'Value_Type', 'Is_Active', 'Created_At', 'Updated_At'],
  Users: ['User_ID', 'Workspace_ID', 'Email', 'Display_Name', 'Role', 'Is_Active', 'Created_At', 'Updated_At'],
  Lists: ['List_ID', 'Workspace_ID', 'List_Type', 'List_Code', 'List_Name', 'Sort_Order', 'Is_Active', 'Created_At', 'Updated_At'],
  Schema_Versions: ['Schema_Version', 'Applied_At', 'Applied_By', 'Notes'],
  DB_Import_Batches: ['Workspace_ID', 'Batch_ID', 'Platform', 'Period_Start', 'Period_End', 'Imported_At', 'Batch_Status', 'Final_Status', 'Created_At', 'Updated_At'],
  DB_Import_Files: ['Workspace_ID', 'Batch_ID', 'Source_File_ID', 'Source_File_Name', 'Source_File_Hash', 'Source_File_Modified_At', 'Source_File_Imported_At', 'Created_At'],
  DB_Import_Errors: ['Workspace_ID', 'Batch_ID', 'Source_File_ID', 'Row_Number', 'Error_Code', 'Error_Message', 'Raw_Record', 'Created_At'],
  Product_Master: ['Workspace_ID', 'Product_ID', 'Platform_Product_ID', 'SKU_ID', 'Product_Name', 'Brand', 'Category', 'Is_Active', 'Created_At', 'Updated_At'],
  DB_Canonical_Daily: ['Workspace_ID', 'Batch_ID', 'Source_File_ID', 'Platform', 'Source_System', 'Metric_Date', 'Metric_Scope', 'Period_Start', 'Period_End', 'Provenance_Captured_At', 'Imported_At', 'Canonical_Eligible', 'GMV', 'Orders', 'Units', 'Buyers', 'Visitors', 'Refund_Value', 'AOV', 'Conversion_Rate', 'Currency', 'Created_At', 'Updated_At'],
  DB_Product_Period: ['Workspace_ID', 'Batch_ID', 'Source_File_ID', 'Platform', 'Source_System', 'Period_Start', 'Period_End', 'Provenance_Captured_At', 'Imported_At', 'Product_ID', 'GMV', 'Orders', 'Units', 'Buyers', 'Refund_Value', 'Created_At', 'Updated_At'],
  DB_Ads_Period: ['Workspace_ID', 'Batch_ID', 'Source_File_ID', 'Platform', 'Source_System', 'Period_Start', 'Period_End', 'Provenance_Captured_At', 'Imported_At', 'Campaign_ID', 'Campaign_Name', 'Spend', 'GMV', 'Orders', 'Impressions', 'Clicks', 'Created_At', 'Updated_At'],
  DB_Traffic_Period: ['Workspace_ID', 'Batch_ID', 'Source_File_ID', 'Platform', 'Source_System', 'Period_Start', 'Period_End', 'Provenance_Captured_At', 'Imported_At', 'Visitors', 'Page_Views', 'Add_To_Cart', 'Conversion_Rate', 'Created_At', 'Updated_At'],
  DB_Creator_Period: ['Workspace_ID', 'Batch_ID', 'Source_File_ID', 'Platform', 'Source_System', 'Period_Start', 'Period_End', 'Provenance_Captured_At', 'Imported_At', 'Creator_ID', 'Creator_Name', 'GMV', 'Orders', 'Units', 'Commission_Value', 'Created_At', 'Updated_At'],
  DB_Competitor_Brand_Period: ['Workspace_ID', 'Batch_ID', 'Source_File_ID', 'Platform', 'Source_System', 'Period_Start', 'Period_End', 'Provenance_Captured_At', 'Imported_At', 'Competitor_Brand', 'GMV', 'Orders', 'Units', 'Rank', 'Created_At', 'Updated_At'],
  DB_Competitor_SKU_Period: ['Workspace_ID', 'Batch_ID', 'Source_File_ID', 'Platform', 'Source_System', 'Period_Start', 'Period_End', 'Provenance_Captured_At', 'Imported_At', 'Competitor_Brand', 'Competitor_SKU', 'GMV', 'Orders', 'Units', 'Rank', 'Created_At', 'Updated_At'],
  Action_Tasks: ['Workspace_ID', 'Action_ID', 'Title', 'Description', 'Owner_User_ID', 'Status', 'Priority', 'Due_Date', 'Created_At', 'Updated_At'],
  Action_History: ['Workspace_ID', 'Action_History_ID', 'Action_ID', 'Event_Type', 'Previous_Value', 'New_Value', 'Actor_User_ID', 'Created_At'],
  Dashboard_Snapshots: ['Workspace_ID', 'Snapshot_ID', 'Period_Start', 'Period_End', 'Data_Through', 'Accepted_Batch_IDs', 'Snapshot_JSON', 'Created_At'],
};

function PPG_context() {
  return loadAppsScript();
}

function PPG_plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test('configuration exposes stable local schema defaults without environment identifiers', () => {
  const context = PPG_context();

  assert.ok(context.PPG_CONFIG, 'PPG_CONFIG must be defined');
  assert.equal(context.PPG_CONFIG.schemaVersion, 1);
  assert.equal(context.PPG_CONFIG.timezone, 'Asia/Bangkok');
  assert.equal(context.PPG_CONFIG.currency, 'THB');
  assert.deepEqual([...context.PPG_CONFIG.roles], ['EXECUTIVE', 'ANALYST', 'OPERATOR', 'ADMIN']);
  assert.deepEqual([...context.PPG_CONFIG.acceptedBatchStatuses], ['ACCEPTED']);
  assert.deepEqual([...context.PPG_CONFIG.batchLifecycleStatuses], ['PENDING', 'VALIDATED', 'ACCEPTED', 'REJECTED', 'FINALIZED', 'SUPERSEDED']);
  assert.equal(context.PPG_CONFIG.acceptedBatchStatuses.includes('PENDING'), false);
  assert.equal(context.PPG_CONFIG.acceptedBatchStatuses.includes('REJECTED'), false);
  assert.deepEqual([...context.PPG_CONFIG.finalBatchStatuses], ['FINALIZED', 'SUPERSEDED']);
  assert.equal('spreadsheetId' in context.PPG_CONFIG, false);
  assert.equal('folderId' in context.PPG_CONFIG, false);
});

test('schema manifest defines complete ordered headers for every approved sheet', () => {
  const context = PPG_context();
  assert.equal(typeof context.PPG_SCHEMA_manifest_, 'function', 'PPG_SCHEMA_manifest_ must be defined');
  const manifest = context.PPG_SCHEMA_manifest_();

  assert.deepEqual(Object.keys(manifest), PPG_EXPECTED_SHEETS);
  assert.deepEqual(PPG_plain(manifest), PPG_EXPECTED_MANIFEST);
  assert.deepEqual(PPG_plain(manifest.DB_Canonical_Daily.slice(9, 12)), [
    'Provenance_Captured_At', 'Imported_At', 'Canonical_Eligible',
  ]);
});

test('schema plan classifies missing, exact and mismatched sheets without mutating supplied headers', () => {
  const context = PPG_context();
  assert.equal(typeof context.PPG_SCHEMA_manifest_, 'function', 'PPG_SCHEMA_manifest_ must be defined');
  assert.equal(typeof context.PPG_SCHEMA_plan_, 'function', 'PPG_SCHEMA_plan_ must be defined');
  const manifest = context.PPG_SCHEMA_manifest_();
  const existing = {
    Users: [...manifest.Users],
    Settings: ['Workspace_ID', 'Wrong_Column'],
  };
  const before = JSON.stringify(existing);
  const plan = context.PPG_SCHEMA_plan_(existing);

  assert.deepEqual([...plan.create], PPG_EXPECTED_SHEETS.filter((name) => !['Users', 'Settings'].includes(name)));
  assert.deepEqual([...plan.reuse], ['Users']);
  assert.deepEqual(PPG_plain(plan.blocked), [{
    sheetName: 'Settings',
    expected: PPG_plain(manifest.Settings),
    actual: ['Workspace_ID', 'Wrong_Column'],
  }]);
  assert.equal(JSON.stringify(existing), before);
});

test('API envelopes always provide all public keys and complete safe metadata', () => {
  const context = PPG_context();
  assert.equal(typeof context.PPG_API_ok_, 'function', 'PPG_API_ok_ must be defined');
  assert.equal(typeof context.PPG_API_error_, 'function', 'PPG_API_error_ must be defined');
  const ok = context.PPG_API_ok_({ total: 3 });
  const failure = context.PPG_API_error_('FORBIDDEN', 'Access denied', { permission: 'users.read' });

  assert.deepEqual(Object.keys(ok), ['ok', 'data', 'meta', 'error']);
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.data, { total: 3 });
  assert.equal(ok.error, null);
  assert.deepEqual(Object.keys(failure), ['ok', 'data', 'meta', 'error']);
  assert.equal(failure.ok, false);
  assert.equal(failure.data, null);
  assert.deepEqual(PPG_plain(failure.error), {
    code: 'FORBIDDEN', message: 'Access denied', details: { permission: 'users.read' },
  });
  for (const envelope of [ok, failure]) {
    assert.equal(typeof envelope.meta.requestId, 'string');
    assert.equal(envelope.meta.workspaceId, null);
    assert.equal(envelope.meta.dataThrough, null);
    assert.deepEqual([...envelope.meta.acceptedBatchIds], []);
    assert.deepEqual([...envelope.meta.warnings], []);
    assert.match(envelope.meta.generatedAt, /^\d{4}-\d{2}-\d{2}T/);
  }
});

test('platform and ISO period validators normalize accepted input and reject invalid dates', () => {
  const context = PPG_context();

  assert.equal(typeof context.PPG_CORE_normalizePlatform_, 'function', 'PPG_CORE_normalizePlatform_ must be defined');
  assert.equal(typeof context.PPG_CORE_validateIsoDate_, 'function', 'PPG_CORE_validateIsoDate_ must be defined');
  assert.equal(typeof context.PPG_CORE_validatePeriod_, 'function', 'PPG_CORE_validatePeriod_ must be defined');
  assert.equal(context.PPG_CORE_normalizePlatform_(' Shopee Thailand '), 'SHOPEE');
  assert.equal(context.PPG_CORE_normalizePlatform_('Tik Tok Shop'), 'TIKTOK');
  assert.equal(context.PPG_CORE_normalizePlatform_('Lazada'), null);
  assert.equal(context.PPG_CORE_validateIsoDate_('2026-02-28'), true);
  assert.equal(context.PPG_CORE_validateIsoDate_('2026-02-29'), false);
  assert.equal(context.PPG_CORE_validateIsoDate_('2026-2-28'), false);
  assert.equal(context.PPG_CORE_validatePeriod_('2026-08-01', '2026-08-31'), true);
  assert.equal(context.PPG_CORE_validatePeriod_('2026-08-31', '2026-08-01'), false);
});

test('role permissions are cumulative and unknown roles receive none', () => {
  const context = PPG_context();

  assert.equal(typeof context.PPG_AUTH_permissionsForRole_, 'function', 'PPG_AUTH_permissionsForRole_ must be defined');
  assert.equal(context.PPG_AUTH_permissionsForRole_('EXECUTIVE').includes('dashboard.read'), true);
  assert.equal(context.PPG_AUTH_permissionsForRole_('EXECUTIVE').includes('actions.create'), false);
  assert.equal(context.PPG_AUTH_permissionsForRole_('ANALYST').includes('exports.create'), true);
  assert.equal(context.PPG_AUTH_permissionsForRole_('OPERATOR').includes('imports.manage'), true);
  assert.equal(context.PPG_AUTH_permissionsForRole_('ADMIN').includes('users.manage'), true);
  assert.equal(context.PPG_AUTH_permissionsForRole_('ADMIN').includes('settings.manage'), true);
  assert.deepEqual([...context.PPG_AUTH_permissionsForRole_('GUEST')], []);
});

test('authorization returns a normalized authorized user and stable rejection codes', () => {
  const context = PPG_context();
  assert.equal(typeof context.PPG_AUTH_authorize_, 'function', 'PPG_AUTH_authorize_ must be defined');
  const authorized = context.PPG_AUTH_authorize_({
    userId: 'u-1', workspaceId: 'workspace-1', email: 'boss@example.test', role: ' analyst ', isActive: true,
  }, 'actions.update');

  assert.deepEqual(PPG_plain(authorized), {
    ok: true,
    user: {
      userId: 'u-1', workspaceId: 'workspace-1', email: 'boss@example.test', role: 'ANALYST', isActive: true,
    },
  });
  assert.deepEqual(PPG_plain(context.PPG_AUTH_authorize_(null, 'dashboard.read')), { ok: false, code: 'AUTH_REQUIRED' });
  assert.deepEqual(PPG_plain(context.PPG_AUTH_authorize_({ isActive: false }, 'dashboard.read')), {
    ok: false, code: 'AUTH_REQUIRED',
  });
  assert.deepEqual(PPG_plain(context.PPG_AUTH_authorize_({ userId: 'u-inactive', role: 'ADMIN', isActive: false }, 'users.manage')), {
    ok: false, code: 'USER_INACTIVE',
  });
  assert.deepEqual(PPG_plain(context.PPG_AUTH_authorize_({ userId: 'u-2', role: 'EXECUTIVE', isActive: true }, 'users.manage')), {
    ok: false, code: 'FORBIDDEN',
  });
  assert.deepEqual(PPG_plain(context.PPG_AUTH_authorize_({
    userId: 'u-3', role: 'ADMIN', isActive: false, Is_Active: true,
  }, 'users.manage')), { ok: false, code: 'AUTH_FIELD_CONFLICT' });
  assert.deepEqual(PPG_plain(context.PPG_AUTH_authorize_({
    User_ID: 'u-4', Role: ' executive ', Is_Active: true,
  }, 'dashboard.read')), {
    ok: true,
    user: { userId: 'u-4', workspaceId: null, email: null, role: 'EXECUTIVE', isActive: true },
  });
});

test('Apps Script project configuration is V8, Bangkok-scoped and least-privilege for Phase 1', () => {
  const configPath = `${process.cwd()}/backend/appsscript.json`;
  assert.equal(fs.existsSync(configPath), true, 'backend/appsscript.json must exist');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  assert.equal(config.runtimeVersion, 'V8');
  assert.equal(config.timeZone, 'Asia/Bangkok');
  assert.deepEqual(config.oauthScopes, [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
  ]);
  assert.equal('dependencies' in config, false);
});

test('loader fails clearly when a required Apps Script source file is absent', () => {
  assert.throws(
    () => loadAppsScript({ sourceDirectory: `${process.cwd()}/backend/does-not-exist` }),
    /Missing Apps Script source file: Config\.gs/,
  );
});

test('production sources contain no Node globals, environment identifiers, or non-PPG symbols', () => {
  const sourceDirectory = `${process.cwd()}/backend/src`;
  const sourceFiles = ['Config.gs', 'Schema.gs', 'ApiCore.gs', 'Auth.gs'];
  const source = sourceFiles.map((fileName) => fs.readFileSync(`${sourceDirectory}/${fileName}`, 'utf8')).join('\n');
  const symbols = [...source.matchAll(/(?:^|\n)\s*(?:function|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g)].map((match) => match[1]);

  assert.equal(symbols.every((symbol) => symbol.startsWith('PPG_')), true);
  assert.doesNotMatch(source, /(?:^|\n)\s*(?:(?:var|let|const)\s+)?(?:require|module|exports|process|__dirname|__filename)\s*[.(=]/m);
  assert.doesNotMatch(source, /(?:SpreadsheetApp\.openById|DriveApp\.getFolderById|spreadsheetId\s*[:=]|folderId\s*[:=]|deploymentId\s*[:=])/i);
});
