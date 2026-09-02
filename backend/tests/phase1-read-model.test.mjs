import assert from 'node:assert/strict';
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

const USERS = [{ User_ID: 'u1', Workspace_ID: 'w1', Email: 'viewer@example.com', Role: 'EXECUTIVE', Is_Active: 'TRUE' }];

function tableRows() {
  return {
    Daily_Sales: [
      { record_key: 'd1', batch_id: 'b1', platform: 'Shopee', sales_date: '2026-08-01', period_start: '2026-08-01', period_end: '2026-08-01', metric_scope: 'DAILY', gross_gmv: 110, confirmed_gmv: 100, orders: 2, units: 3, visitors: 10, refund_gmv: null, cancelled_gmv: null, source_file: 'daily.csv' },
      { record_key: 'd2', batch_id: 'b1', platform: 'TIKTOK', sales_date: '2026-08-02', period_start: '2026-08-02', period_end: '2026-08-02', metric_scope: 'DAILY', gross_gmv: 220, confirmed_gmv: '', orders: '4', units: 5, visitors: 20, refund_gmv: 0, cancelled_gmv: 0, source_file: 'daily.csv' },
      { record_key: 'd3', batch_id: 'b1', platform: 'Shopee', sales_date: '2026-07-31', period_start: '2026-07-31', period_end: '2026-07-31', metric_scope: 'DAILY', gross_gmv: 90, confirmed_gmv: 80, orders: 1, units: 1, visitors: 8, refund_gmv: 0, cancelled_gmv: 0, source_file: 'daily.csv' },
    ],
    Product_Period: [{ record_key: 'p1', batch_id: 'b1', platform: 'Shopee', sku: 'SKU-1', product_name: 'HOYA', period_start: '2026-08-01', period_end: '2026-08-01', sales_gmv: '1,000', ordered_gmv: 1000, orders: 2, units: 3, buyers: 2, views: 20, clicks: 5, ctr: 0.25, conversion_rate: 0.1, aov: 500, source_file: 'product.csv' }],
    Ads_Period: [{ record_key: 'a1', batch_id: 'b1', platform: 'Shopee', campaign_name: 'Rain', period_start: '2026-08-01', period_end: '2026-08-01', spend: 100, attributed_sales: 250, roas: 2.5, impressions: 1000, clicks: 50, orders: 3, source_file: 'ads.csv' }],
    Traffic_Period: [{ record_key: 't1', batch_id: 'b1', platform: 'TIKTOK', traffic_source: 'Video', period_start: '2026-08-01', period_end: '2026-08-01', sales_gmv: 40, visitors: 30, clicks: 6, views: 100, source_file: 'traffic.csv' }],
    Creator_Period: [{ record_key: 'c1', batch_id: 'b1', platform: 'TIKTOK', creator_name: 'Creator A', period_start: '2026-08-01', period_end: '2026-08-01', gmv: 300, orders: 4, units: 5, refunds: '2', commission: 30, source_file: 'creator.csv' }],
  };
}

function setup(options = {}) {
  const context = loadAppsScript();
  const source = options.source || tableRows();
  const calls = [];
  const readPhase1Sheet = options.readPhase1Sheet || ((sheet) => {
    calls.push(sheet);
    if (!Object.prototype.hasOwnProperty.call(source, sheet)) {
      const error = new Error(`missing ${sheet}`);
      error.code = 'SHEET_NOT_FOUND';
      throw error;
    }
    return { headers: HEADERS[sheet], rows: source[sheet] };
  });
  const repo = options.repo || context.PPG_REPO_memory_({ Users: USERS });
  context.PPG_RPC_setDeps_({
    repo,
    identity: options.identity === undefined ? (() => 'viewer@example.com') : options.identity,
    readPhase1Sheet,
    renderApp: () => 'APP_HTML',
    renderDenied: () => 'DENIED_HTML',
    historicalSnapshot: options.historicalSnapshot,
  });
  return { context, calls, repo };
}

test('Phase 1 config exposes an explicit read-only allowlisted source boundary', () => {
  const { context } = setup();
  assert.equal(context.PPG_CONFIG.phaseMode, 'READ_ONLY');
  assert.deepEqual(JSON.parse(JSON.stringify(context.PPG_CONFIG.approvedViewTabs)), APPROVED);
  assert.equal(context.PPG_CONFIG.allowlistTab, 'Users');
  assert.equal(typeof context.doGet, 'function');
  assert.equal(typeof context.getPhase1Bootstrap, 'function');
  assert.equal(typeof context.getPhase1Data, 'function');
});

test('doGet and RPCs distinguish allowed, unknown, inactive, and blank identities without serving protected content', () => {
  const allowed = setup();
  assert.equal(allowed.context.doGet(), 'APP_HTML');
  assert.equal(allowed.context.getPhase1Bootstrap({}).ok, true);

  const unknown = setup({ identity: () => 'unknown@example.com' });
  assert.equal(unknown.context.doGet(), 'DENIED_HTML');
  const unknownResponse = unknown.context.getPhase1Bootstrap({});
  assert.equal(unknownResponse.ok, false);
  assert.equal(unknownResponse.error.code, 'AUTH_REQUIRED');
  assert.equal(unknownResponse.data, null);
  assert.doesNotMatch(JSON.stringify(unknownResponse), /viewer@example|Workspace|HOYA/);

  const inactiveRepo = unknown.context.PPG_REPO_memory_({ Users: [{ ...USERS[0], Is_Active: 'FALSE' }] });
  const inactive = setup({ repo: inactiveRepo });
  assert.equal(inactive.context.doGet(), 'DENIED_HTML');
  assert.equal(inactive.context.getPhase1Bootstrap({}).error.code, 'USER_INACTIVE');

  const blank = setup({ identity: () => '' });
  assert.equal(blank.context.doGet(), 'DENIED_HTML');
  assert.equal(blank.context.getPhase1Bootstrap({}).error.code, 'AUTH_REQUIRED');
});

test('every legacy write, import, action, and administration RPC is server-blocked in READ_ONLY', () => {
  const { context, repo } = setup();
  const before = JSON.stringify(repo.tables);
  const mutationNames = ['uploadFiles', 'getImportStatus', 'listImportBatches', 'listActions', 'createAction', 'updateAction', 'changeActionStatus', 'listUsers', 'setUserRole'];
  for (const name of mutationNames) {
    const response = context[name]({ title: 'must not write', actionId: 'missing', email: 'viewer@example.com', role: 'ADMIN', files: [] });
    assert.equal(response.ok, false, `${name} should fail closed`);
    assert.equal(response.error.code, 'READ_ONLY', `${name} should expose READ_ONLY`);
    assert.equal(response.data, null);
  }
  assert.equal(JSON.stringify(repo.tables), before);
});

test('bootstrap returns the authorized user, source availability, coverage, dynamic periods, and Data Through', () => {
  const { context, calls } = setup();
  const response = context.getPhase1Bootstrap({});
  assert.equal(response.ok, true);
  assert.deepEqual(JSON.parse(JSON.stringify(response.data.user)), {
    userId: 'u1', workspaceId: 'w1', email: 'viewer@example.com', role: 'EXECUTIVE', isActive: true,
  });
  assert.equal(response.data.mode, 'LIVE');
  assert.equal(response.data.readOnly, true);
  assert.deepEqual(JSON.parse(JSON.stringify(response.data.approvedViewTabs)), APPROVED);
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), APPROVED);
  assert.equal(response.data.dataThrough, '2026-08-02');
  assert.equal(response.meta.dataThrough, '2026-08-02');
  assert.equal(response.data.coverage.minDate, '2026-07-31');
  assert.equal(response.data.coverage.maxDate, '2026-08-02');
  assert.ok(response.data.periods.some((period) => period.id === 'all'));
  assert.equal(response.data.sourceAvailability.Daily_Sales.available, true);
  assert.equal(response.data.sourceAvailability.Product_Period.available, true);
});

test('getPhase1Data validates scope, reads only approved view tabs, and preserves confirmed_gmv blanks as null', () => {
  const { context, calls } = setup();
  const response = context.getPhase1Data({ start: '2026-08-01', end: '2026-08-02', platform: 'shopee' });
  assert.equal(response.ok, true);
  assert.equal(response.data.mode, 'LIVE');
  assert.equal(response.data.range.start, '2026-08-01');
  assert.equal(response.data.range.end, '2026-08-02');
  assert.deepEqual(JSON.parse(JSON.stringify(response.data.daily)), [
    {
      record_key: 'd1', batch_id: 'b1', platform: 'shopee', sales_date: '2026-08-01', period_start: '2026-08-01', period_end: '2026-08-01', metric_scope: 'DAILY', gross_gmv: 110, confirmed_gmv: 100, orders: 2, units: 3, visitors: 10, refund_gmv: null, cancelled_gmv: null, source_file: 'daily.csv',
    },
  ]);
  assert.equal(response.data.sales.summary.confirmed_gmv, null);
  assert.equal(response.data.sales.summaryAvailability.confirmed_gmv, false);
  assert.equal(response.data.sales.reason, 'MISSING_DATE');
  assert.deepEqual(JSON.parse(JSON.stringify(response.data.sales.coverage.missingDates)), ['2026-08-02']);
  // Data Through is dataset-level coverage, not the selected query end.
  assert.equal(response.data.meta.dataThrough, '2026-08-02');
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), APPROVED);

  const blank = context.getPhase1Data({ start: '2026-08-02', end: '2026-08-02', platform: 'tiktok' });
  assert.equal(blank.ok, true);
  assert.equal(blank.data.daily[0].confirmed_gmv, null);
  assert.equal(blank.data.sales.summary.confirmed_gmv, null);
  assert.equal(blank.data.sales.summaryAvailability.confirmed_gmv, false);
});

test('invalid date and platform inputs fail safely before any source read', () => {
  const { context, calls } = setup();
  const badDate = context.getPhase1Data({ start: '2026-08-32', end: '2026-09-01' });
  assert.equal(badDate.ok, false);
  assert.equal(badDate.error.code, 'INVALID_PERIOD');
  const badPlatform = context.getPhase1Data({ start: '2026-08-01', end: '2026-08-01', platform: 'lazada' });
  assert.equal(badPlatform.ok, false);
  assert.equal(badPlatform.error.code, 'INVALID_PLATFORM');
  assert.deepEqual(calls, []);
});

test('source failures are observable, sanitized, and do not silently mix partial live data', () => {
  for (const failure of [
    { code: 'SHEET_NOT_FOUND', expected: 'SHEET_NOT_FOUND' },
    { code: 'HEADER_MISMATCH', expected: 'HEADER_MISMATCH' },
    { code: 'SOURCE_TIMEOUT', expected: 'SOURCE_TIMEOUT' },
    { code: 'SOURCE_PERMISSION_DENIED', expected: 'SOURCE_PERMISSION_DENIED' },
  ]) {
    const { context } = setup({
      readPhase1Sheet: (sheet) => {
        if (sheet === 'Daily_Sales') {
          const error = new Error(`internal spreadsheet id ${failure.code}`);
          error.code = failure.code;
          throw error;
        }
        return { headers: HEADERS[sheet], rows: [] };
      },
    });
    const response = context.getPhase1Data({ start: '2026-08-01', end: '2026-08-01' });
    assert.equal(response.ok, false);
    assert.equal(response.error.code, failure.expected);
    assert.equal(response.data, null);
    assert.doesNotMatch(JSON.stringify(response), /internal spreadsheet|spreadsheet id|viewer@example/);
  }
});

test('source failure may use an atomic Historical Snapshot, while auth failure never falls back', () => {
  const snapshot = {
    daily: [{ platform: 'shopee', sales_date: '2026-07-01', confirmed_gmv: 999 }],
    products: [], ads: [], traffic: [], creators: [],
    meta: { dataThrough: '2026-07-01', source: 'approved snapshot', snapshotDate: '2026-07-02' },
  };
  const fallback = setup({
    historicalSnapshot: snapshot,
    readPhase1Sheet: () => { const error = new Error('timeout internals'); error.code = 'SOURCE_TIMEOUT'; throw error; },
  });
  const fallbackResponse = fallback.context.getPhase1Bootstrap({});
  assert.equal(fallbackResponse.ok, true);
  assert.equal(fallbackResponse.data.mode, 'HISTORICAL_SNAPSHOT');
  assert.equal(fallbackResponse.data.readOnly, true);
  assert.equal(fallbackResponse.data.fallback.source, 'approved snapshot');
  assert.equal(fallbackResponse.meta.sourceMode, 'HISTORICAL_SNAPSHOT');

  const denied = setup({
    historicalSnapshot: snapshot,
    identity: () => null,
    readPhase1Sheet: () => { throw new Error('must not read'); },
  });
  const deniedResponse = denied.context.getPhase1Bootstrap({});
  assert.equal(deniedResponse.ok, false);
  assert.equal(deniedResponse.error.code, 'AUTH_REQUIRED');
  assert.equal(deniedResponse.data, null);
});
