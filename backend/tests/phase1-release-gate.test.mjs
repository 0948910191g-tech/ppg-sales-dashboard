import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { loadAppsScript } from './helpers/load-appsscript.mjs';

const fixture = JSON.parse(fs.readFileSync(new URL('./fixtures/phase1-read-model.json', import.meta.url), 'utf8'));
const approvedViews = ['Daily_Sales', 'Product_Period', 'Ads_Period', 'Traffic_Period', 'Creator_Period'];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function setup(seed = fixture, identity = 'allowed@example.test', options = {}) {
  const context = loadAppsScript();
  const repo = context.PPG_REPO_memory_(clone(seed));
  assert.equal(typeof context.PPG_RPC_setDeps_, 'function', 'test seam must expose dependency injection');
  const readPhase1Sheet = options.readPhase1Sheet || ((sheetName) => {
    if (!Object.prototype.hasOwnProperty.call(seed, sheetName)) {
      const error = new Error(`missing ${sheetName}`);
      error.code = 'SHEET_NOT_FOUND';
      throw error;
    }
    return { headers: Object.keys(seed[sheetName][0] || {}), rows: seed[sheetName] };
  });
  context.PPG_RPC_setDeps_({
    repo,
    identity: () => identity,
    phaseMode: 'READ_ONLY',
    readPhase1Sheet,
    historicalSnapshot: options.historicalSnapshot || {
      source: 'fixture Historical Snapshot',
      snapshotDate: '2026-08-31',
      dataThrough: '2026-07-31',
      daily: clone(fixture.Daily_Sales),
      products: clone(fixture.Product_Period),
      ads: clone(fixture.Ads_Period),
      traffic: clone(fixture.Traffic_Period),
      creators: clone(fixture.Creator_Period),
    },
  });
  return { context, repo };
}

function assertEnvelope(response) {
  assert.deepEqual(Object.keys(response).sort(), ['data', 'error', 'meta', 'ok']);
  assert.equal(typeof response.ok, 'boolean');
  assert.ok(response.meta && typeof response.meta === 'object');
}

function assertSafeDenied(response, code) {
  assertEnvelope(response);
  assert.equal(response.ok, false);
  assert.equal(response.error.code, code);
  assert.equal(response.data, null);
  assert.doesNotMatch(JSON.stringify(response), /confirmed_gmv|gross_gmv|workspace-ppg|fixture-/i);
}

function phase1Data(response) {
  assertEnvelope(response);
  assert.equal(response.ok, true);
  assert.ok(response.data && typeof response.data === 'object');
  return response.data;
}

function sourceNames(data) {
  const value = data.sourceAvailability || data.sources || data.availableSources || {};
  if (Array.isArray(value)) return value.map((entry) => String(entry.name || entry.source || entry.tab || entry));
  return Object.keys(value);
}

function periodStarts(data) {
  const periods = data.periods || (data.coverage && data.coverage.periods) || [];
  return periods.map((entry) => {
    if (typeof entry === 'string') return entry;
    return entry.start || entry.periodStart || entry.period_start || entry.key || entry.period;
  }).filter(Boolean);
}

test('Phase 1 bootstrap is an authorized public seam with source, coverage, periods, and Data Through', () => {
  const { context } = setup();
  assert.equal(typeof context.getPhase1Bootstrap, 'function');

  const response = context.getPhase1Bootstrap({});
  const data = phase1Data(response);
  const names = sourceNames(data);

  assert.deepEqual(names.sort(), approvedViews.slice().sort());
  assert.ok((data.coverage || data.periods), 'bootstrap must expose coverage or periods');
  assert.ok(periodStarts(data).some((value) => String(value).startsWith('2026-08')));
  assert.ok(response.meta.dataThrough || data.dataThrough || (data.coverage && data.coverage.dataThrough));
  assert.equal(data.user.email, 'allowed@example.test');
});

test('blank, unknown, and inactive identities are denied without snapshot disclosure', () => {
  const blank = setup(fixture, null).context.getPhase1Bootstrap({});
  const unknown = setup(fixture, 'unknown@example.test').context.getPhase1Bootstrap({});
  const inactive = setup(fixture, 'inactive@example.test').context.getPhase1Bootstrap({});

  assertSafeDenied(blank, 'AUTH_REQUIRED');
  assertSafeDenied(unknown, 'AUTH_REQUIRED');
  assertSafeDenied(inactive, 'USER_INACTIVE');
});

test('every Phase 1 mutation facade is server-blocked before repository writes', () => {
  const { context, repo } = setup();
  const mutationCalls = [
    ['uploadFiles', { files: [] }],
    ['createAction', { title: 'Should not persist' }],
    ['updateAction', { actionId: 'missing', title: 'Should not persist' }],
    ['changeActionStatus', { actionId: 'missing', status: 'DONE' }],
    ['setUserRole', { email: 'allowed@example.test', role: 'ADMIN' }],
  ];

  for (const [name, payload] of mutationCalls) {
    assert.equal(typeof context[name], 'function', `${name} must remain an explicit facade`);
    const response = context[name](payload);
    assertEnvelope(response);
    assert.equal(response.ok, false, `${name} must be blocked in READ_ONLY`);
    assert.equal(response.error.code, 'READ_ONLY', `${name} must use the stable read-only error code`);
  }

  assert.deepEqual(JSON.parse(JSON.stringify(repo.read('Action_Tasks'))), []);
  assert.deepEqual(JSON.parse(JSON.stringify(repo.read('Action_History'))), []);
  assert.equal(repo.find('Users', { Email: 'allowed@example.test' })[0].Role, 'EXECUTIVE');
});

test('scoped data validates ISO bounds and platform before reading approved views', () => {
  const { context } = setup();
  assert.equal(typeof context.getPhase1Data, 'function');

  const badDate = context.getPhase1Data({ start: '2026-08-40', end: '2026-08-31' });
  const reversed = context.getPhase1Data({ start: '2026-08-31', end: '2026-08-01' });
  const badPlatform = context.getPhase1Data({ start: '2026-08-01', end: '2026-08-31', platform: 'LAZADA' });

  assert.equal(badDate.ok, false);
  assert.equal(badDate.error.code, 'INVALID_PERIOD');
  assert.equal(reversed.error.code, 'INVALID_PERIOD');
  assert.equal(badPlatform.error.code, 'INVALID_PLATFORM');
});

test('scoped read model returns all five view families and preserves missing values', () => {
  const { context } = setup();
  const data = phase1Data(context.getPhase1Data({ start: '2026-08-01', end: '2026-08-31' }));

  for (const field of ['daily', 'products', 'ads', 'traffic', 'creators']) {
    assert.ok(Array.isArray(data[field]), `${field} must be an array in the read model`);
  }
  const missingGmv = data.daily.find((row) => String(row.platform).toUpperCase() === 'TIKTOK');
  assert.ok(missingGmv, 'fixture must include the TikTok row with a missing GMV');
  assert.equal(missingGmv.confirmed_gmv, null);
  assert.notEqual(missingGmv.confirmed_gmv, 0);
  assert.equal(data.products[0].period_start, '2026-08-01');
  assert.equal(data.products[0].period_end, '2026-08-31');
});

test('Sales comparison is unavailable when prior Daily Sales coverage is incomplete', () => {
  const { context } = setup();
  const data = phase1Data(context.getPhase1Data({ start: '2026-08-02', end: '2026-08-02' }));

  assert.ok(data.comparison && typeof data.comparison === 'object');
  assert.equal(data.comparison.available, false);
});

test('missing approved source is observable and falls back atomically to a labelled Historical Snapshot', () => {
  const missingAds = clone(fixture);
  delete missingAds.Ads_Period;
  const { context } = setup(missingAds);
  const response = context.getPhase1Data({ start: '2026-08-01', end: '2026-08-01' });

  assertEnvelope(response);
  assert.equal(response.ok, true);
  const data = response.data;
  const serialized = JSON.stringify({ data, meta: response.meta });
  assert.match(serialized, /Historical Snapshot/i);
  assert.match(serialized, /source|date/i);
  assert.ok(data.daily && data.products && data.ads && data.traffic && data.creators);
});

test('authentication failures never use the Historical Snapshot fallback', () => {
  const missingAds = clone(fixture);
  delete missingAds.Ads_Period;
  const response = setup(missingAds, 'unknown@example.test').context.getPhase1Data({
    start: '2026-08-01',
    end: '2026-08-01',
  });

  assertSafeDenied(response, 'AUTH_REQUIRED');
  assert.doesNotMatch(JSON.stringify(response), /Historical Snapshot/i);
});
