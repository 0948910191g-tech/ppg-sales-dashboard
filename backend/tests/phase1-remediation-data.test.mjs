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

const USER = [{ User_ID: 'u1', Workspace_ID: 'w1', Email: 'viewer@example.test', Role: 'EXECUTIVE', Is_Active: true }];

function dailyRow(date, confirmedGmv, platform = 'SHOPEE', key = date) {
  return {
    record_key: `daily-${key}`,
    batch_id: 'batch-1',
    platform,
    sales_date: date,
    period_start: date,
    period_end: date,
    metric_scope: 'DAILY',
    gross_gmv: confirmedGmv,
    confirmed_gmv: confirmedGmv,
    orders: 1,
    units: 1,
    visitors: 1,
    refund_gmv: null,
    cancelled_gmv: null,
    source_file: 'daily.csv',
  };
}

function emptyTables(daily = []) {
  return {
    Daily_Sales: daily,
    Product_Period: [],
    Ads_Period: [],
    Traffic_Period: [],
    Creator_Period: [],
  };
}

function snapshot(daily = []) {
  return {
    source: 'approved server snapshot',
    snapshotDate: '2026-08-31',
    dataThrough: '2026-08-04',
    daily,
    products: [],
    ads: [],
    traffic: [],
    creators: [],
  };
}

function setup({ tables = emptyTables(), reader, historicalSnapshot = null, identity = 'viewer@example.test' } = {}) {
  const context = loadAppsScript();
  const source = tables;
  const readPhase1Sheet = reader || ((sheetName) => ({ headers: HEADERS[sheetName], rows: source[sheetName] }));
  context.PPG_RPC_setDeps_({
    repo: context.PPG_REPO_memory_({ Users: USER }),
    identity: () => identity,
    readPhase1Sheet,
    historicalSnapshot,
  });
  return context;
}

function assertEnvelope(response) {
  assert.deepEqual(Object.keys(response).sort(), ['data', 'error', 'meta', 'ok']);
  assert.equal(typeof response.ok, 'boolean');
}

test('source failure diagnostics preserve the five safe canonical failure codes', () => {
  const failures = [
    ['SHEET_NOT_FOUND', 'SHEET_NOT_FOUND'],
    ['HEADER_MISMATCH', 'HEADER_MISMATCH'],
    ['SOURCE_TIMEOUT', 'SOURCE_TIMEOUT'],
    ['SOURCE_PERMISSION_DENIED', 'SOURCE_PERMISSION_DENIED'],
    ['internal adapter failure with spreadsheet-id=secret', 'SOURCE_READ_FAILED'],
  ];
  for (const [failure, expected] of failures) {
    const context = setup({
      reader: (sheetName) => {
        if (sheetName === 'Daily_Sales') {
          if (failure === 'HEADER_MISMATCH') return { headers: ['not', 'the', 'approved', 'schema'], rows: [] };
          const error = new Error(failure);
          if (failure !== 'internal adapter failure with spreadsheet-id=secret') error.code = failure;
          throw error;
        }
        return { headers: HEADERS[sheetName], rows: [] };
      },
    });
    const response = context.getPhase1Data({ start: '2026-08-01', end: '2026-08-01' });
    assertEnvelope(response);
    assert.equal(response.ok, false);
    assert.equal(response.error.code, expected);
    assert.equal(response.data, null);
    assert.equal(response.error.details.sources[0].source, 'Daily_Sales');
    assert.equal(response.error.details.sources[0].code, expected);
    assert.doesNotMatch(JSON.stringify(response), /spreadsheet-id|secret|internal adapter/);
  }
});

test('a missing Historical Snapshot returns a truthful unavailable error without fallback data', () => {
  const context = setup({
    reader: (sheetName) => {
      if (sheetName === 'Ads_Period') {
        const error = new Error('timeout');
        error.code = 'SOURCE_TIMEOUT';
        throw error;
      }
      return { headers: HEADERS[sheetName], rows: [] };
    },
  });
  const response = context.getPhase1Bootstrap({});
  assert.equal(response.ok, false);
  assert.equal(response.error.code, 'SOURCE_TIMEOUT');
  assert.equal(response.data, null);
  assert.doesNotMatch(JSON.stringify(response), /Historical Snapshot|snapshot/i);
});

test('fallback is atomic: a live row from a healthy source never mixes with the snapshot', () => {
  const liveDaily = dailyRow('2026-08-04', 400, 'SHOPEE', 'live');
  const savedDaily = dailyRow('2026-08-04', 40, 'SHOPEE', 'snapshot');
  const context = setup({
    tables: emptyTables([liveDaily]),
    historicalSnapshot: snapshot([savedDaily]),
    reader: (sheetName) => {
      if (sheetName === 'Ads_Period') {
        const error = new Error('permission details must stay private');
        error.code = 'SOURCE_PERMISSION_DENIED';
        throw error;
      }
      return { headers: HEADERS[sheetName], rows: emptyTables([liveDaily])[sheetName] };
    },
  });
  const response = context.getPhase1Data({ start: '2026-08-04', end: '2026-08-04' });
  assert.equal(response.ok, true);
  assert.equal(response.data.mode, 'HISTORICAL_SNAPSHOT');
  assert.equal(response.data.daily[0].confirmed_gmv, 40);
  assert.equal(response.data.daily[0].record_key, 'daily-snapshot');
  assert.equal(response.data.ads.length, 0);
  assert.doesNotMatch(JSON.stringify(response.data), /daily-live|400/);
});

test('snapshot source and capture metadata are consistent in bootstrap and scoped data', () => {
  const saved = snapshot([dailyRow('2026-08-04', 40)]);
  const reader = (sheetName) => {
    if (sheetName === 'Daily_Sales') {
      const error = new Error('missing approved tab');
      error.code = 'SHEET_NOT_FOUND';
      throw error;
    }
    return { headers: HEADERS[sheetName], rows: [] };
  };
  const context = setup({ reader, historicalSnapshot: saved });
  const bootstrap = context.getPhase1Bootstrap({});
  const scoped = context.getPhase1Data({ start: '2026-08-04', end: '2026-08-04' });
  assert.equal(bootstrap.ok, true);
  assert.equal(scoped.ok, true);
  for (const field of ['source', 'snapshotDate', 'capturedAt', 'captureDate', 'dataThrough']) {
    assert.equal(bootstrap.data.fallback[field], scoped.data.fallback[field], field);
  }
  assert.equal(scoped.data.source.source, bootstrap.data.fallback.source);
  assert.equal(scoped.data.meta.snapshotSource, bootstrap.data.fallback.source);
  assert.equal(scoped.data.meta.snapshotDate, bootstrap.data.fallback.snapshotDate);
  assert.equal(bootstrap.meta.sourceMode, 'HISTORICAL_SNAPSHOT');
});

test('scoped Data Through stays at dataset coverage instead of the selected query end', () => {
  const tables = emptyTables([
    dailyRow('2026-08-01', 10),
    dailyRow('2026-08-02', 20),
  ]);
  const context = setup({ tables });
  const response = context.getPhase1Data({ start: '2026-08-01', end: '2026-08-02', platform: 'SHOPEE' });
  assert.equal(response.ok, true);
  assert.equal(response.data.dataThrough, '2026-08-02');
  assert.equal(response.data.coverage.dataThrough, '2026-08-02');
  assert.equal(response.data.meta.dataThrough, '2026-08-02');
  assert.equal(response.meta.dataThrough, '2026-08-02');
});

test('dataset Data Through uses the latest approved source coverage', () => {
  const tables = emptyTables([dailyRow('2026-08-01', 10)]);
  tables.Product_Period = [{
    record_key: 'product-later', batch_id: 'batch-1', platform: 'SHOPEE', sku: 'SKU-1',
    product_name: 'Later coverage', period_start: '2026-08-01', period_end: '2026-08-31',
    sales_gmv: 10, ordered_gmv: 10, orders: 1, units: 1, buyers: 1, views: 1, clicks: 1,
    ctr: 1, conversion_rate: 1, aov: 10, source_file: 'product.csv'
  }];
  const context = setup({ tables });
  const response = context.getPhase1Bootstrap({});
  assert.equal(response.ok, true);
  assert.equal(response.data.dataThrough, '2026-08-31');
  assert.equal(response.meta.dataThrough, '2026-08-31');
});

test('Sales confirmed GMV summary is unavailable when a selected day has missing confirmed GMV', () => {
  const context = setup({ tables: emptyTables([
    dailyRow('2026-08-01', 10),
    dailyRow('2026-08-02', null),
  ]) });
  const data = context.getPhase1Data({ start: '2026-08-01', end: '2026-08-02', platform: 'SHOPEE' }).data;

  assert.equal(data.sales.summary.confirmed_gmv, null);
  assert.equal(data.sales.summaryAvailability.confirmed_gmv, false);
  assert.equal(data.sales.coverage.confirmedGmvComplete, false);
  assert.equal(data.sales.reason, 'MISSING_CONFIRMED_GMV');
  assert.deepEqual(JSON.parse(JSON.stringify(data.sales.coverage.missingConfirmedGmvDates)), ['2026-08-02']);
});

test('comparison is unavailable and identifies a missing current date', () => {
  const context = setup({ tables: emptyTables([
    dailyRow('2026-08-01', 10),
    dailyRow('2026-08-02', 20),
    dailyRow('2026-08-03', 30),
  ]) });
  const comparison = context.getPhase1Data({ start: '2026-08-03', end: '2026-08-04', platform: 'SHOPEE' }).data.comparison;
  assert.equal(comparison.available, false);
  assert.ok(comparison.reasons.includes('MISSING_CURRENT_DATE'));
  assert.deepEqual(JSON.parse(JSON.stringify(comparison.current.coverage.missingDates)), ['2026-08-04']);
  assert.equal(comparison.current.completeCoverage, false);
  assert.equal(comparison.previous.completeCoverage, true);
});

test('comparison is unavailable and identifies a missing previous date', () => {
  const context = setup({ tables: emptyTables([
    dailyRow('2026-08-01', 10),
    dailyRow('2026-08-03', 30),
    dailyRow('2026-08-04', 40),
  ]) });
  const comparison = context.getPhase1Data({ start: '2026-08-03', end: '2026-08-04', platform: 'SHOPEE' }).data.comparison;
  assert.equal(comparison.available, false);
  assert.ok(comparison.reasons.includes('MISSING_PREVIOUS_DATE'));
  assert.deepEqual(JSON.parse(JSON.stringify(comparison.previous.coverage.missingDates)), ['2026-08-02']);
  assert.equal(comparison.current.completeCoverage, true);
  assert.equal(comparison.previous.completeCoverage, false);
});

test('comparison is unavailable when any required day has blank or null confirmed GMV', () => {
  const context = setup({ tables: emptyTables([
    dailyRow('2026-08-01', 10),
    dailyRow('2026-08-02', 20),
    dailyRow('2026-08-03', null),
    dailyRow('2026-08-04', 40),
  ]) });
  const comparison = context.getPhase1Data({ start: '2026-08-03', end: '2026-08-04', platform: 'SHOPEE' }).data.comparison;
  assert.equal(comparison.available, false);
  assert.equal(comparison.reason, 'MISSING_CONFIRMED_GMV');
  assert.ok(comparison.reasons.includes('MISSING_CURRENT_GMV'));
  assert.deepEqual(JSON.parse(JSON.stringify(comparison.current.coverage.missingConfirmedGmvDates)), ['2026-08-03']);
  assert.equal(comparison.current.summary.confirmed_gmv, null);
  assert.equal(comparison.current.summaryAvailability.confirmed_gmv, false);
});

test('comparison is available only for complete comparable periods and respects the selected platform', () => {
  const daily = [
    dailyRow('2026-08-01', 10),
    dailyRow('2026-08-02', 20),
    dailyRow('2026-08-03', 30),
    dailyRow('2026-08-04', 40),
    dailyRow('2026-08-01', null, 'TIKTOK', 'other-platform'),
  ];
  const context = setup({ tables: emptyTables(daily) });
  const response = context.getPhase1Data({ start: '2026-08-03', end: '2026-08-04', platform: 'SHOPEE' });
  const comparison = response.data.comparison;
  assert.equal(comparison.available, true);
  assert.equal(comparison.reason, null);
  assert.deepEqual(JSON.parse(JSON.stringify(comparison.reasons)), []);
  assert.equal(comparison.current.summary.confirmed_gmv, 70);
  assert.equal(comparison.previous.summary.confirmed_gmv, 30);
  assert.equal(comparison.current.coverage.confirmedGmvComplete, true);
  assert.equal(comparison.previous.coverage.confirmedGmvComplete, true);
});

test('all-platform comparison is unavailable when one required date lacks an expected platform', () => {
  const context = setup({ tables: emptyTables([
    dailyRow('2026-08-01', 10, 'SHOPEE', 'shopee-1'),
    dailyRow('2026-08-01', 5, 'TIKTOK', 'tiktok-1'),
    dailyRow('2026-08-02', 20, 'SHOPEE', 'shopee-2'),
    dailyRow('2026-08-02', 6, 'TIKTOK', 'tiktok-2'),
    dailyRow('2026-08-03', 30, 'SHOPEE', 'shopee-3'),
    dailyRow('2026-08-03', 7, 'TIKTOK', 'tiktok-3'),
    dailyRow('2026-08-04', 40, 'SHOPEE', 'shopee-4'),
  ]) });
  const comparison = context.getPhase1Data({ start: '2026-08-03', end: '2026-08-04', platform: 'all' }).data.comparison;

  assert.equal(comparison.available, false);
  assert.equal(comparison.reason, 'MISSING_PLATFORM_COVERAGE');
  assert.ok(comparison.reasons.includes('MISSING_CURRENT_PLATFORM'));
  assert.deepEqual(JSON.parse(JSON.stringify(comparison.current.coverage.expectedPlatforms)), ['shopee', 'tiktok']);
  assert.deepEqual(JSON.parse(JSON.stringify(comparison.current.coverage.missingPlatforms)), ['tiktok']);
  assert.deepEqual(JSON.parse(JSON.stringify(comparison.current.coverage.missingPlatformCoverage)), [
    { date: '2026-08-04', platform: 'tiktok' },
  ]);
  assert.equal(comparison.current.completeCoverage, false);
  assert.equal(comparison.previous.completeCoverage, true);
});

test('all-platform Sales comparison ignores platforms that exist only in non-Sales sources', () => {
  const tables = emptyTables([
    dailyRow('2026-08-01', 10, 'SHOPEE', 'shopee-1'),
    dailyRow('2026-08-02', 20, 'SHOPEE', 'shopee-2'),
    dailyRow('2026-08-03', 30, 'SHOPEE', 'shopee-3'),
    dailyRow('2026-08-04', 40, 'SHOPEE', 'shopee-4'),
  ]);
  tables.Ads_Period = [{
    record_key: 'ads-tiktok', batch_id: 'batch-1', platform: 'TIKTOK', campaign_name: 'DEMO',
    period_start: '2026-08-03', period_end: '2026-08-04', spend: 1, attributed_sales: 2,
    roas: 2, impressions: 1, clicks: 1, orders: 1, source_file: 'ads.csv',
  }];
  const context = setup({ tables });
  const comparison = context.getPhase1Data({ start: '2026-08-03', end: '2026-08-04', platform: 'all' }).data.comparison;

  assert.equal(comparison.available, true);
  assert.deepEqual(JSON.parse(JSON.stringify(comparison.current.coverage.expectedPlatforms)), ['shopee']);
  assert.deepEqual(JSON.parse(JSON.stringify(comparison.current.coverage.missingPlatformCoverage)), []);
});
