import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const dashboardPath = new URL('../dashboard.html', import.meta.url);
const html = fs.readFileSync(dashboardPath, 'utf8');

function createDashboardRuntime() {
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]).filter(Boolean);
  const context = {
    console,
    window: {},
    document: {
      addEventListener() {},
      getElementById() { return null; },
      querySelectorAll() { return []; }
    },
    alert() {},
    location: { reload() {} },
    URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} },
    Blob: class Blob {},
    Chart: class Chart {}
  };
  // The final inline script is the dashboard application. Earlier scripts
  // configure third-party libraries (including Tailwind) and are not part of
  // the client read-model seam under test.
  vm.runInNewContext(scripts[scripts.length - 1], context);
  return expression => {
    vm.runInNewContext(`this.__dashboardTestResult = (${expression})`, context);
    const value = context.__dashboardTestResult;
    return value === undefined ? value : JSON.parse(JSON.stringify(value));
  };
}

test('dashboard labels the current dataset as a non-live demo', () => {
  assert.match(html, /id="dashboardDataModeBadge"/);
  assert.match(html, /ตัวอย่างข้อมูล/);
  assert.doesNotMatch(html, /คุณภาพข้อมูล: 99\.8%/);
});

test('local static fixture is small, synthetic, and non-commercial', () => {
  const evaluate = createDashboardRuntime();
  const fixture = evaluate(`({
    provenance: dbData.provenance,
    summary: dbData.summary,
    lengths: {
      daily: dbData.daily.length,
      products: dbData.products.length,
      ads: dbData.ads.length,
      traffic: dbData.traffic.length,
      creators: dbData.creators.length,
      competitorBrands: dbData.competitors.brands.length,
      competitorSkus: dbData.competitors.skus.length
    },
    product: dbData.products[0],
    ad: dbData.ads[0],
    traffic: dbData.traffic[0],
    creator: dbData.creators[0]
  })`);

  assert.equal(fixture.provenance, 'SYNTHETIC_LOCAL_FIXTURE_NON_PROTECTED');
  assert.ok(Object.values(fixture.lengths).every(length => length <= 1), 'local fixture should contain at most one row per source');
  assert.ok(Object.values(fixture.summary).every(value => value === null), 'local fixture must not carry commercial totals');
  assert.match(fixture.product.sku, /^DEMO-/);
  assert.match(fixture.product.name, /^DEMO\b/);
  assert.match(fixture.ad.campaign, /^DEMO\b/);
  assert.match(fixture.traffic.source, /^DEMO\b/);
  assert.match(fixture.creator.name, /^DEMO\b/);
  assert.doesNotMatch(html, /1 มิถุนายน - 31 สิงหาคม 2026|6163921\.19|KaloData/);
  assert.doesNotMatch(html, /กฤษฎา|นภัส|ศรัณย์|พิมพ์ชนก|อัครพล/);
  assert.match(html, /owner: 'DEMO Owner A'/);
});

test('dashboard does not synthesize missing comparison or metric values', () => {
  assert.doesNotMatch(html, /Math\.random\(/);
  assert.doesNotMatch(html, /\*\s*1\.47/);
  assert.doesNotMatch(html, /\*\s*0\.825/);
  assert.match(html, /const totalUnits = null/);
  assert.match(html, /const totalBuyers = null/);
});

test('product catalog copy is derived from the embedded dataset', () => {
  assert.match(html, /id="productCatalogCount"/);
  assert.match(html, /id="productCatalogFilterCount"/);
  assert.match(html, /function renderProductCatalogCount\(\)/);
});

test('global context bar exposes four accessible scope controls', () => {
  assert.match(html, /id="globalContextBar"[^>]*role="region"/);
  assert.match(html, /aria-label="บริบทส่วนกลาง"/);
  assert.match(html, /id="datePresetSelect"[^>]*aria-label="เลือกช่วงเวลา"/);
  assert.match(html, /id="comparePresetSelect"[^>]*aria-label="เลือกช่วงเวลาเปรียบเทียบ"/);
  assert.match(html, /id="platformSelect"[^>]*aria-label="เลือกแพลตฟอร์ม"/);
  assert.match(html, /id="categorySelect"[^>]*aria-label="เลือกหมวดหมู่สินค้า"/);
});

test('supported Global Context values have handlers and survive sidebar view switches', () => {
  assert.match(html, /let currentComparePreset\s*=\s*'prev'/);
  assert.match(html, /let currentCategoryFilter\s*=\s*'all'/);
  assert.match(html, /onchange="onComparePresetChange\(this\.value\)"/);
  assert.match(html, /function onComparePresetChange\(val\)\s*\{[\s\S]*?currentComparePreset\s*=\s*val/);

  const switchStart = html.indexOf('function switchSidebarView(viewId)');
  const switchEnd = html.indexOf('// 2. TODAY SUB-TABS ROUTER', switchStart);
  assert.notEqual(switchStart, -1, 'sidebar view switcher should remain discoverable');
  assert.notEqual(switchEnd, -1, 'sidebar view switcher should have a bounded end');
  const switchSidebarView = html.slice(switchStart, switchEnd);
  assert.doesNotMatch(switchSidebarView, /compareDropdownContainer[^\n]*classList\.add\('hidden'\)/);
  assert.doesNotMatch(switchSidebarView, /categoryDropdownContainer[^\n]*classList\.add\('hidden'\)/);
});

test('global context bar uses the handoff flat color tokens without a gradient surface', () => {
  assert.match(html, /--context-ivory:\s*#F4F1EA/);
  assert.match(html, /--context-navy:\s*#10233C/);
  assert.match(html, /--context-cobalt:\s*#1D5FD1/);

  const contextBar = html.match(/<section id="globalContextBar"[\s\S]*?<\/section>/);
  assert.ok(contextBar, 'global context bar should be a bounded section');
  assert.doesNotMatch(contextBar[0], /gradient|backdrop-filter|backdrop-blur/i);
});

test('dashboard exposes an explicit Data Health demo-state banner', () => {
  assert.match(html, /id="dataHealthDemoBanner"/);
  assert.match(html, /ข้อมูลตัวอย่าง/);
});

test('historical action walkthrough preserves source context without a write workflow', () => {
  const actionLogicStart = html.indexOf('// 6. ACTION TASKS LOGIC');
  assert.notEqual(actionLogicStart, -1, 'action task logic should remain discoverable');
  const actionLogic = html.slice(actionLogicStart);

  assert.match(actionLogic, /function captureActionSourceMetadata\([^)]*\)\s*\{[\s\S]*?period:\s*getSelectedContextLabel\('datePresetSelect'\)[\s\S]*?comparisonPeriod:\s*getSelectedContextLabel\('comparePresetSelect'\)[\s\S]*?platform:\s*getSelectedContextLabel\('platformSelect'\)[\s\S]*?category:\s*getSelectedContextLabel\('categorySelect'\)/);
  assert.doesNotMatch(actionLogic, /actionTasks\.unshift\(/);
  assert.match(actionLogic, /data-action-source[\s\S]*?ขอบเขต:/);
});

test('Global Context applies the supported platform scope and labels category as unavailable', () => {
  const productTableStart = html.indexOf('function renderProductsTable()');
  assert.notEqual(productTableStart, -1, 'product renderer should remain discoverable');
  const productTable = html.slice(productTableStart, html.indexOf('// 9. ADS TABLE', productTableStart));

  assert.match(productTable, /currentPlatformFilter === 'all' \|\| p\.platform === currentPlatformFilter/);
  assert.match(html, /id="categorySelect"[^>]*disabled/);
  assert.match(html, /ไม่มีข้อมูลระดับหมวดหมู่/);
});

test('Global Context suppresses Performance tables whose source platform is outside the selected scope', () => {
  const adsStart = html.indexOf('function renderAdsTable()');
  const adsEnd = html.indexOf('// 10. TRAFFIC TABLE', adsStart);
  const creatorsStart = html.indexOf('function renderCreatorsTable()');
  const creatorsEnd = html.indexOf('// 12. COMPETITOR LOGIC', creatorsStart);
  assert.notEqual(adsStart, -1, 'ads renderer should remain discoverable');
  assert.notEqual(creatorsStart, -1, 'creators renderer should remain discoverable');

  assert.match(html.slice(adsStart, adsEnd), /currentPlatformFilter !== 'all' && currentPlatformFilter !== 'shopee'/);
  assert.match(html.slice(adsStart, adsEnd), /ไม่มีข้อมูล Shopee Ads ตามแพลตฟอร์มที่เลือก/);
  assert.match(html.slice(creatorsStart, creatorsEnd), /currentPlatformFilter !== 'all' && currentPlatformFilter !== 'tiktok'/);
  assert.match(html.slice(creatorsStart, creatorsEnd), /ไม่มีข้อมูล Creator ตามแพลตฟอร์มที่เลือก/);
});

test('Global Context filters the traffic table by its source platform', () => {
  const trafficStart = html.indexOf('function renderTrafficTable()');
  const trafficEnd = html.indexOf('// 11. CREATORS TABLE', trafficStart);
  assert.notEqual(trafficStart, -1, 'traffic renderer should remain discoverable');
  const trafficLogic = html.slice(trafficStart, trafficEnd);
  assert.match(trafficLogic, /currentPlatformFilter/);
  assert.match(trafficLogic, /ไม่มีข้อมูล Traffic ตามแพลตฟอร์มที่เลือก/);
  const handlerStart = html.indexOf('function onPlatformFilterChange(val)');
  const handlerEnd = html.indexOf('function onCategoryFilterChange', handlerStart);
  assert.match(html.slice(handlerStart, handlerEnd), /renderTrafficTable\(\)/);
});

test('period-scoped views keep aggregate Product, Ads, Traffic, and Creator data with an explicit source scope', () => {
  const productStart = html.indexOf('function renderProductsTable()');
  const productEnd = html.indexOf('function renderProductPaginationControls', productStart);
  const marketingStart = html.indexOf('function renderMarketingSummary()');
  const marketingEnd = html.indexOf('// 9. ADS TABLE', marketingStart);
  const adsStart = html.indexOf('function renderAdsTable()');
  const adsEnd = html.indexOf('// 10. TRAFFIC TABLE', adsStart);
  const trafficStart = html.indexOf('function renderTrafficTable()');
  const trafficEnd = html.indexOf('// 11. CREATORS TABLE', trafficStart);
  const creatorsStart = html.indexOf('function renderCreatorsTable()');
  const creatorsEnd = html.indexOf('// 12. COMPETITOR LOGIC', creatorsStart);
  assert.match(html.slice(productStart, productEnd), /updateProductScopeNotice\(\)/);
  assert.match(html, /แสดงข้อมูลรวมของ source ไม่ผูกวันที่/);
  assert.doesNotMatch(html.slice(marketingStart, marketingEnd), /periodUnavailable/);
  assert.doesNotMatch(html.slice(adsStart, adsEnd), /currentPreset !== 'all'/);
  assert.doesNotMatch(html.slice(trafficStart, trafficEnd), /currentPreset !== 'all'/);
  assert.doesNotMatch(html.slice(creatorsStart, creatorsEnd), /currentPreset !== 'all'/);
  assert.match(html, /id="marketingAdsSpendValue"/);
  assert.match(html, /id="productScopeNotice"/);
});

test('Product and Marketing load period-scoped rows through the secured read model', () => {
  assert.match(html, /getPhase1Data/);
  assert.match(html, /callPhase1Rpc\('getPhase1Data'/);
  assert.match(html, /start:\s*bounds\.start/);
  assert.match(html, /end:\s*bounds\.end/);
  assert.match(html, /loadLiveSheetData\(\)/);
});

test('changing the period refreshes every period-bound chart and daily table', () => {
  const handlerStart = html.indexOf('function onDatePresetChange(val)');
  const handlerEnd = html.indexOf('function onComparePresetChange', handlerStart);
  assert.notEqual(handlerStart, -1, 'period handler should remain discoverable');
  const handler = html.slice(handlerStart, handlerEnd);
  assert.match(handler, /applyPpgFilter\(\)/);
  assert.match(handler, /renderDailyBreakdownTable\(\)/);
  assert.match(handler, /initTodayMovementChart\(\)/);
  assert.match(handler, /initSalesComparisonChart\(\)/);

  const dailyStart = html.indexOf('function renderDailyBreakdownTable()');
  const dailyEnd = html.indexOf('// 6. ACTION TASKS LOGIC', dailyStart);
  const dailyRenderer = html.slice(dailyStart, dailyEnd);
  assert.match(dailyRenderer, /getFilteredDailyData\(\)/);
  assert.match(dailyRenderer, /currentPlatformFilter/);
});

test('changing the platform refreshes every platform-bound chart and daily table', () => {
  const handlerStart = html.indexOf('function onPlatformFilterChange(val)');
  const handlerEnd = html.indexOf('function onCategoryFilterChange', handlerStart);
  assert.notEqual(handlerStart, -1, 'platform handler should remain discoverable');
  const handler = html.slice(handlerStart, handlerEnd);
  assert.match(handler, /applyPpgFilter\(\)/);
  assert.match(handler, /renderDailyBreakdownTable\(\)/);
  assert.match(handler, /initTodayMovementChart\(\)/);
  assert.match(handler, /initSalesComparisonChart\(\)/);
});

test('Performance Compare renders its matrix from the selected daily scope instead of fixed snapshot values', () => {
  assert.match(html, /id="compareMatrixBody"/);
  const compareStart = html.indexOf('function renderCompareMatrix()');
  assert.notEqual(compareStart, -1, 'compare renderer should remain discoverable');
  const compareLogic = html.slice(compareStart, html.indexOf('// 6. ACTION TASKS LOGIC', compareStart));
  assert.match(compareLogic, /getFilteredDailyData\(\)/);
  assert.match(compareLogic, /currentPlatformFilter/);
  assert.match(compareLogic, /ไม่มีข้อมูลเปรียบเทียบ/);
});

test('dashboard does not present unavailable comparisons or data health as live facts', () => {
  assert.doesNotMatch(html, /vs prev/);
  assert.doesNotMatch(html, /setInterval\(updateLiveClock/);
  assert.doesNotMatch(html, /Backend Data Health & ETL Status/);
  assert.match(html, /ยังไม่มีข้อมูลเปรียบเทียบ/);
  assert.match(html, /ยังไม่เชื่อม Backend/);
});

test('phase 1 client uses secured Apps Script RPC instead of direct GViz or exposed Sheet ID', () => {
  assert.match(html, /google\.script\.run/);
  assert.doesNotMatch(html, /PPG_GOOGLE_SHEET_ID/);
  assert.doesNotMatch(html, /docs\.google\.com\/spreadsheets\/d\//);
  assert.doesNotMatch(html, /loadPpgSheetTab\(/);
});

test('phase 1 actions are explicitly walkthrough-only and do not mutate local tasks', () => {
  assert.match(html, /Actions[^<]*(?:walkthrough|ตัวอย่าง|Phase 2)/i);
  assert.doesNotMatch(html, /actionTasks\.unshift\(/);
  assert.doesNotMatch(html, /function toggleTaskStatus\([^)]*\)\s*\{[\s\S]*?task\.status\s*=/);
});

test('phase 1 periods are derived from live coverage and Attention Queue uses live rows', () => {
  assert.match(html, /function deriveLivePeriods\(/);
  assert.match(html, /function buildLiveAttentionSignals\(/);
  assert.match(html, /dataThrough/);
  assert.doesNotMatch(html, /let currentPreset\s*=\s*'2026-08'/);
});

test('phase 1 normalizes the RPC envelope and preserves null source values', () => {
  const evaluate = createDashboardRuntime();
  const normalized = evaluate(`phase1NormalizeData({
    mode: 'live',
    daily: [{ sales_date: '2027-01-03', platform: 'Shopee', confirmed_gmv: null, orders: '', units: 4 }],
    products: [], ads: [], traffic: [], creators: [],
    comparison: { available: false, reason: 'NO_PRIOR_COVERAGE' }
  })`);
  assert.equal(normalized.daily[0].confirmed_gmv, null);
  assert.equal(normalized.daily[0].orders, null);
  assert.equal(normalized.daily[0].units, 4);
  assert.equal(normalized.daily[0].platform, 'shopee');
  assert.equal(normalized.comparison.available, false);
});

test('phase 1 generates continuous month periods from the returned coverage, without a fixed year', () => {
  const evaluate = createDashboardRuntime();
  const periods = evaluate(`deriveLivePeriods({ coverage: { minDate: '2027-01-15', maxDate: '2027-03-06' } })`);
  assert.deepEqual(periods.filter(period => /^2027-/.test(period.id)).map(period => period.id), ['2027-03', '2027-02', '2027-01']);
  assert.equal(periods.find(period => period.id === '2027-01').start, '2027-01-15');
  assert.equal(periods.find(period => period.id === '2027-03').end, '2027-03-06');
  assert.equal(periods.find(period => period.id === 'all').start, '2027-01-15');
});

test('phase 1 nullable arithmetic does not turn missing coverage into zero', () => {
  const evaluate = createDashboardRuntime();
  assert.equal(evaluate(`phase1NullableSum([null, undefined, ''])`), null);
  assert.equal(evaluate(`phase1NullableSum([null, 0, 2])`), 2);
  assert.equal(evaluate(`phase1NullableSum([null, null])`), null);
});

test('phase 1 auth failures are distinguishable from safe source fallback failures', () => {
  const evaluate = createDashboardRuntime();
  const authFailure = evaluate(`(() => { try { phase1EnvelopeData({ ok: false, error: { code: 'AUTH_REQUIRED' } }, 'PHASE1'); } catch (error) { return { code: error.code, authFailure: phase1IsAuthFailure(error) }; } })()`);
  const sourceFailure = evaluate(`(() => { try { phase1EnvelopeData({ ok: false, error: { code: 'SOURCE_TIMEOUT' } }, 'PHASE1'); } catch (error) { return { code: error.code, authFailure: phase1IsAuthFailure(error) }; } })()`);
  assert.deepEqual(authFailure, { code: 'AUTH_REQUIRED', authFailure: true });
  assert.deepEqual(sourceFailure, { code: 'SOURCE_TIMEOUT', authFailure: false });
});

test('phase 1 workspace authorization failures are denied client-side', () => {
  const evaluate = createDashboardRuntime();
  ['WORKSPACE_REQUIRED', 'WORKSPACE_MISMATCH'].forEach(code => {
    const denial = evaluate(`(() => { try { phase1EnvelopeData({ ok: false, error: { code: '${code}' } }, 'PHASE1'); } catch (error) { return { code: error.code, authFailure: phase1IsAuthFailure(error) }; } })()`);
    assert.deepEqual(denial, { code, authFailure: true });
  });
});

test('phase 1 keeps current and previous comparison coverage reasons separate', () => {
  const evaluate = createDashboardRuntime();
  const coverage = evaluate(`(() => {
    phase1Mode = 'live';
    phase1Comparison = {
      available: false,
      reason: 'INCOMPLETE_COVERAGE',
      reasons: ['MISSING_CURRENT_DATE', 'MISSING_PREVIOUS_GMV', 'MISSING_PREVIOUS_PLATFORM'],
      current: {
        coverage: {
          coverageReason: 'MISSING_DATE',
          missingDates: ['2027-02-03'],
          missingPlatformCoverage: [{ date: '2027-02-04', platform: 'shopee' }]
        }
      },
      previous: {
        coverage: {
          coverageReason: 'MISSING_PLATFORM_COVERAGE',
          missingConfirmedGmvDates: ['2027-01-31'],
          missingPlatformCoverage: [{ date: '2027-01-30', platform: 'tiktok' }]
        }
      }
    };
    return {
      current: phase1ComparisonCoverageText('current'),
      previous: phase1ComparisonCoverageText('previous')
    };
  })()`);
  assert.match(coverage.current, /ขาดวันที่/);
  assert.match(coverage.current, /2027-02-03/);
  assert.match(coverage.current, /ขาดแพลตฟอร์ม/);
  assert.match(coverage.current, /shopee/);
  assert.doesNotMatch(coverage.current, /ขาด Confirmed GMV/);
  assert.match(coverage.previous, /ขาด Confirmed GMV/);
  assert.match(coverage.previous, /2027-01-31/);
  assert.match(coverage.previous, /ขาดแพลตฟอร์ม/);
  assert.match(coverage.previous, /tiktok/);
  assert.doesNotMatch(coverage.previous, /ขาดวันที่/);
});

test('phase 1 comparison reads the secured read model confirmed_gmv metric', () => {
  const evaluate = createDashboardRuntime();
  const change = evaluate(`phase1ComparisonText(
    phase1SummaryMetric({ confirmed_gmv: 120 }, ['gmv', 'GMV', 'total_gmv', 'confirmed_gmv']),
    phase1SummaryMetric({ confirmed_gmv: 100 }, ['gmv', 'GMV', 'total_gmv', 'confirmed_gmv']),
    'เทียบช่วงก่อนหน้า'
  )`);
  assert.equal(change, '+20.0% เทียบช่วงก่อนหน้า');
});

test('phase 1 fallback metadata identifies source and unavailable capture date, separate from competitor scope', () => {
  assert.match(html, /id="competitorBenchmarkSnapshot"/);
  assert.match(html, /id="competitorBenchmarkSnapshotMeta"/);
  assert.match(html, /Historical Snapshot[^\n]*source:/);
  assert.match(html, /capturedAt: null/);
  assert.match(html, /Benchmark Snapshot[^\n]*ไม่ผูกช่วง Sales/);
});

function getDataExplorerMarkup() {
  const explorerStart = html.indexOf('<!-- VIEW 5: DATA EXPLORER');
  const explorerEnd = html.indexOf('<!-- END VIEW 5: DATA EXPLORER -->', explorerStart);
  assert.notEqual(explorerStart, -1, 'Data Explorer view should have a bounded start marker');
  assert.notEqual(explorerEnd, -1, 'Data Explorer view should have a bounded end marker');
  return html.slice(explorerStart, explorerEnd);
}

function getDataExplorerRow(explorerMarkup, sourceFamily) {
  const rowStart = explorerMarkup.indexOf(`data-source-family="${sourceFamily}"`);
  const rowEnd = explorerMarkup.indexOf('</tr>', rowStart);
  assert.notEqual(rowStart, -1, `${sourceFamily} row should be present in Data Explorer`);
  assert.notEqual(rowEnd, -1, `${sourceFamily} row should be closed`);
  return explorerMarkup.slice(rowStart, rowEnd);
}

test('dashboard exposes Data Explorer as a separate sidebar destination and router branch', () => {
  assert.match(html, /<button[^>]*onclick="switchSidebarView\('explorer'\)"[^>]*id="side-explorer"[\s\S]*?Data Explorer/);
  assert.match(html, /id="view-explorer"/);
  assert.match(html, /id="explorerSubInfo"/);

  const switchStart = html.indexOf('function switchSidebarView(viewId)');
  const switchEnd = html.indexOf('// 2. TODAY SUB-TABS ROUTER', switchStart);
  assert.notEqual(switchStart, -1, 'sidebar view switcher should remain discoverable');
  assert.notEqual(switchEnd, -1, 'sidebar view switcher should have a bounded end');
  const switchSidebarView = html.slice(switchStart, switchEnd);
  assert.match(switchSidebarView, /view-explorer/);
  assert.match(switchSidebarView, /viewId === 'explorer'/);
  assert.match(switchSidebarView, /explorerSubInfo[\s\S]*classList\.remove\('hidden'\)/);
});

test('Data Explorer presents a responsive availability table for every embedded source family', () => {
  const explorer = getDataExplorerMarkup();
  assert.match(explorer, /<div[^>]*class="[^"]*overflow-x-auto[^"]*"/);
  assert.match(explorer, /<table[^>]*id="dataExplorerAvailabilityTable"/);
  assert.match(explorer, /ความละเอียดที่รองรับ \(Granularity\)/);

  const sourceFamilies = [
    ['daily-sales', 'ยอดขายรายวัน'],
    ['products', 'Products'],
    ['ads', 'Ads'],
    ['traffic', 'Traffic'],
    ['creators', 'Creators'],
    ['competitor-benchmarks', 'Competitor benchmarks']
  ];
  sourceFamilies.forEach(([sourceFamily, label]) => {
    const row = getDataExplorerRow(explorer, sourceFamily);
    assert.match(row, new RegExp(label));
    assert.match(row, /data-availability="embedded"/);
    assert.match(row, /data-granularity="[^"]+"/);
  });
});

test('Data Explorer states supported granularity and uses the Handoff fallback for unavailable day or week data', () => {
  const explorer = getDataExplorerMarkup();
  const fallback = 'ไม่มีข้อมูลระดับวัน/สัปดาห์ - ดูข้อมูลต้นฉบับได้ที่ Data Explorer';
  const expectedGranularity = {
    'daily-sales': 'daily',
    products: 'product',
    ads: 'campaign',
    traffic: 'source',
    creators: 'creator',
    'competitor-benchmarks': 'benchmark'
  };

  Object.entries(expectedGranularity).forEach(([sourceFamily, granularity]) => {
    const row = getDataExplorerRow(explorer, sourceFamily);
    assert.match(row, new RegExp(`data-granularity="${granularity}"`));
  });

  ['products', 'ads', 'traffic', 'creators', 'competitor-benchmarks'].forEach((sourceFamily) => {
    const row = getDataExplorerRow(explorer, sourceFamily);
    assert.match(row, new RegExp(fallback.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
});

test('Data Explorer separates competitor benchmark scope from the selected sales period', () => {
  const explorer = getDataExplorerMarkup();
  assert.match(explorer, /id="dataExplorerSalesPeriodNote"/);
  assert.match(explorer, /ช่วงยอดขายที่เลือกใน Global Context/);
  assert.match(explorer, /id="dataExplorerBenchmarkScopeNote"/);
  assert.match(explorer, /ขอบเขต benchmark แยกจากช่วงยอดขายที่เลือก/);
  assert.match(getDataExplorerRow(explorer, 'competitor-benchmarks'), /benchmark snapshot/);
});

test('Data Explorer stays a read-only non-live demo without backend, import controls, or fabricated metrics', () => {
  const explorer = getDataExplorerMarkup();
  assert.match(explorer, /id="dataExplorerDemoBanner"/);
  assert.match(explorer, /ไม่ใช่ข้อมูลสด/);
  assert.match(explorer, /ไม่ได้เรียก backend/);
  assert.match(explorer, /ไม่สร้างวันที่หรือตัวชี้วัดเพิ่ม/);
  assert.doesNotMatch(explorer, /<button\b|<input\b|<form\b|onclick\s*=|fetch\s*\(|XMLHttpRequest|axios|openUploadModal/);
  assert.doesNotMatch(explorer, /฿|%|\b20\d{2}\b/);
});

function getOverviewMarkup() {
  const overviewStart = html.indexOf('<!-- SUB-VIEW 1.1: TODAY - ภาพรวม (OVERVIEW) -->');
  const overviewEnd = html.indexOf('<!-- SUB-VIEW 1.2: TODAY - ไฮไลต์ประจำสัปดาห์ (WEEKLY HIGHLIGHTS) -->', overviewStart);
  assert.notEqual(overviewStart, -1, 'Overview view should have a bounded start marker');
  assert.notEqual(overviewEnd, -1, 'Overview view should have a bounded end marker');
  return html.slice(overviewStart, overviewEnd);
}

function getContextDrawerMarkup() {
  const drawerStart = html.indexOf('id="contextDrawer"');
  const drawerEnd = html.indexOf('<!-- JAVASCRIPT DATA & LOGIC -->', drawerStart);
  assert.notEqual(drawerStart, -1, 'Context Drawer should be present');
  assert.notEqual(drawerEnd, -1, 'Context Drawer should be bounded before application logic');
  return html.slice(drawerStart, drawerEnd);
}

test('Overview exposes exactly three live-review signals in an explicitly labelled Attention Queue', () => {
  const overview = getOverviewMarkup();
  assert.match(overview, /id="attentionQueue"/);
  assert.match(overview, /Attention Queue/);
  assert.match(overview, /Live review[^<]*ไม่มีการบันทึก Action ใน Phase 1/);

  const signalIds = [...overview.matchAll(/data-attention-signal="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(signalIds, ['ads-roas', 'creator-refunds', 'data-freshness']);
  const queueStart = overview.indexOf('id="attentionQueue"');
  const queueEnd = overview.indexOf('</section>', queueStart);
  assert.notEqual(queueEnd, -1, 'Attention Queue should have a bounded section');
  assert.doesNotMatch(overview.slice(queueStart, queueEnd), /[+-]\d+(?:\.\d+)?%/);
});

test('each Attention Queue signal opens an accessible Context Drawer without an action write entry point', () => {
  const overview = getOverviewMarkup();
  ['ads-roas', 'creator-refunds', 'data-freshness'].forEach(signalId => {
    const signalStart = overview.indexOf(`data-attention-signal="${signalId}"`);
    const signalEnd = overview.indexOf('</article>', signalStart);
    assert.notEqual(signalStart, -1, `${signalId} signal should be present`);
    assert.notEqual(signalEnd, -1, `${signalId} signal should be closed`);
    const signal = overview.slice(signalStart, signalEnd);
    assert.match(signal, /<button[^>]*type="button"/);
    assert.match(signal, /aria-controls="contextDrawer"/);
    assert.match(signal, new RegExp(`openContextDrawer\\('${signalId}'\\)`));
  });

  const drawer = getContextDrawerMarkup();
  assert.match(drawer, /id="contextDrawer"[^>]*role="dialog"/);
  assert.match(drawer, /aria-modal="true"/);
  assert.match(drawer, /aria-labelledby="contextDrawerTitle"/);
  assert.match(drawer, /aria-describedby="contextDrawerDescription"/);
  assert.match(drawer, /id="contextDrawerClose"[^>]*aria-label=/);
  assert.match(drawer, /id="contextDrawerSourceMetric"/);
  assert.match(drawer, /id="contextDrawerContext"/);
  assert.match(drawer, /id="contextDrawerEvidence"/);
  assert.match(drawer, /Phase 2/);
  assert.doesNotMatch(drawer, /createActionFromContext/);
});

test('Context Drawer snapshots source metric with Global Context without opening a task modal', () => {
  const actionLogicStart = html.indexOf('// 6. ACTION TASKS LOGIC');
  assert.notEqual(actionLogicStart, -1, 'action task logic should remain discoverable');
  const actionLogic = html.slice(actionLogicStart);

  assert.match(actionLogic, /function captureActionSourceMetadata\(signal\)/);
  assert.doesNotMatch(actionLogic, /source:\s*captureActionSourceMetadata\(pendingActionSignal\)/);
  assert.match(actionLogic, /function captureActionSourceMetadata\(signal\)[\s\S]*?source:\s*signal[\s\S]*?metric:\s*signal[\s\S]*?period:\s*getSelectedContextLabel\('datePresetSelect'\)[\s\S]*?platform:\s*getSelectedContextLabel\('platformSelect'\)/);
  assert.match(html, /id="modalNewTask"[^>]*role="dialog"/);
});

test('Context Drawer and task modal close with Escape or a labelled close button without backend or delete workflows', () => {
  const drawer = getContextDrawerMarkup();
  assert.match(html, /addEventListener\('keydown',[\s\S]*?event\.key\s*===\s*'Escape'/);
  assert.match(drawer, /id="contextDrawerClose"[^>]*onclick="closeContextDrawer\(\)"/);
  assert.match(html, /id="modalNewTask"[^>]*aria-hidden="true"/);
  assert.match(html, /id="modalNewTaskClose"[^>]*onclick="closeNewTaskModal\(\)"[^>]*aria-label=/);
  assert.doesNotMatch(drawer, /fetch\s*\(|XMLHttpRequest|axios/);
  assert.doesNotMatch(html, /deleteAction|removeAction|ลบรายการ/);
});

test('Context Drawer hidden state cannot be overridden by its flex layout utility', () => {
  assert.match(html, /#contextDrawer\[hidden\]\s*\{\s*display:\s*none\s*!important;\s*\}/);
});

test('responsive sidebar rules do not hide the Context Drawer panel', () => {
  assert.match(html, /<aside id="appSidebar"/);
  assert.match(html, /\.command-wall > #appSidebar/);
  assert.doesNotMatch(html, /\.command-wall > aside > div:last-child/);
});

test('Overview shell follows the Category Command Wall direction', () => {
  assert.match(html, /--command-canvas:\s*#F4F1EA/);
  assert.match(html, /--command-ink:\s*#10233C/);
  assert.match(html, /--command-cobalt:\s*#1D5FD1/);
  assert.match(html, /id="channelMatrix"/);
  assert.match(html, /id="overviewDataHealthBanner"/);
  assert.match(html, /id="overviewDecisionRail"/);
  assert.match(html, /Status\s*<\/span>[\s\S]*?KPI\s*<\/span>[\s\S]*?Trend\s*<\/span>[\s\S]*?Cause\s*<\/span>[\s\S]*?Action\s*<\/span>/);
});

test('Weekly Highlights does not surface mockup figures as business facts', () => {
  const highlightsStart = html.indexOf('id="today-sub-highlights"');
  const statusStart = html.indexOf('id="today-sub-status"', highlightsStart);
  assert.notEqual(highlightsStart, -1, 'Weekly Highlights should be present');
  assert.notEqual(statusStart, -1, 'Weekly Highlights should have a bounded end');
  const highlights = html.slice(highlightsStart, statusStart);
  assert.match(highlights, /Weekly Highlights: ข้อมูลตัวอย่าง/);
  assert.match(highlights, /ไม่มี comparison period/);
  assert.doesNotMatch(highlights, /฿\s*[0-9]|[+-]\s*[0-9]+(?:\.\d+)?%/);
  assert.match(html, /function initializeHighlightSuggestionAccessibility\(\)/);
  assert.match(html, /today-sub-highlights[^\n]*switchSidebarView\(\\'action\\'\)/);
});

test('Performance navigation exposes the approved competitor destination', () => {
  assert.match(html, /id="subtab-an-compare"[^>]*>[\s\S]*?Competitors/);
  assert.match(html, /id="analyze-sub-compare"/);
});

test('Performance Sales KPI strip follows the selected daily scope', () => {
  const salesStart = html.indexOf('id="analyze-sub-sales"');
  const productsStart = html.indexOf('id="analyze-sub-products"', salesStart);
  assert.notEqual(salesStart, -1, 'Sales drill-down should be present');
  assert.notEqual(productsStart, -1, 'Sales drill-down should have a bounded end');
  const sales = html.slice(salesStart, productsStart);
  for (const id of ['analyzeSalesTotalGmv', 'analyzeSalesTotalOrders', 'analyzeSalesAov', 'analyzeSalesConversionRate']) {
    assert.match(sales, new RegExp(`id="${id}"`));
  }
  assert.doesNotMatch(sales, /ยอดขายรวมลดลง\s*13\.3%|Shopee ยอดขายลดลง\s*12\.6%|TikTok ยังเติบโตต่อเนื่อง/);
  const filterStart = html.indexOf('function applyPpgFilter()');
  assert.match(html.slice(filterStart), /analyzeSalesTotalGmv/);
  assert.match(html.slice(filterStart), /analyzeSalesTotalOrders/);
});

test('Overview data health banner shares the live status contract', () => {
  assert.match(html, /id="overviewDataHealthTitle"/);
  assert.match(html, /id="overviewDataHealthDescription"/);
  const statusStart = html.indexOf('function updateLiveDataStatus(isLive, error)');
  const statusEnd = html.indexOf('function getSelectedContextLabel', statusStart);
  assert.notEqual(statusStart, -1, 'live status updater should remain discoverable');
  assert.notEqual(statusEnd, -1, 'live status updater should have a bounded end');
  assert.match(html.slice(statusStart, statusEnd), /overviewDataHealthTitle/);
  assert.match(html.slice(statusStart, statusEnd), /overviewDataHealthDescription/);
  assert.match(html.slice(statusStart, statusEnd), /liveTimestampBadge/);
});

test('Actions, Data Health, and Data Explorer use data-safe command surfaces', () => {
  const actionStart = html.indexOf('id="view-action"');
  const dataStart = html.indexOf('id="view-data"', actionStart);
  const explorerStart = html.indexOf('id="view-explorer"', dataStart);
  assert.notEqual(actionStart, -1, 'Actions view should be present');
  assert.notEqual(dataStart, -1, 'Data Health view should be present');
  assert.notEqual(explorerStart, -1, 'Data Explorer view should be present');

  const actions = html.slice(actionStart, dataStart);
  assert.match(actions, /command-actions/);
  assert.match(actions, /command-action-list-panel/);
  assert.match(actions, /command-action-summary-panel/);
  assert.match(actions, /command-action-sample-label/);
  assert.match(actions, /aria-label="กรองงานตามเจ้าของ"/);
  assert.doesNotMatch(actions, /ยอดขายรวมเติบโตต่อเนื่อง|Conversion Product Card ดีขึ้น|CTR Product Card ต่ำกว่าค่าเฉลี่ย|ยอดจาก Creator ลดลง/);
  assert.doesNotMatch(actions, /\+19\.5%|\-16\.8%/);

  const dataHealth = html.slice(dataStart, explorerStart);
  assert.match(dataHealth, /id="dataHealthDemoBanner"[^>]*command-data-health/);
  assert.match(dataHealth, /command-data-health-card/);
  assert.match(dataHealth, /command-source-mark/);
  assert.match(dataHealth, /command-data-health-state/);
  assert.match(dataHealth, /command-data-health-value/);
  assert.match(dataHealth, /command-data-health-meta/);
  assert.match(dataHealth, /command-data-health-action[^>]*aria-label=/);
  assert.match(dataHealth, /command-data-pipeline-step/);
  assert.match(dataHealth, /command-data-table-shell[^>]*tabindex="0"[^>]*aria-label=/);

  const explorer = html.slice(explorerStart);
  assert.match(explorer, /command-explorer-table-shell[^>]*tabindex="0"[^>]*aria-label=/);
});

test('Category Command Wall includes reduced-motion and focus-visible safeguards', () => {
  assert.match(html, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(html, /transition-duration:\s*0\.01ms\s*!important/);
  assert.match(html, /#view-explorer \.command-explorer-table-shell:focus-visible/);
  assert.match(html, /#view-data \.command-data-table-shell:focus-visible/);
});

test('primary navigation and icon controls meet the 44px touch-target contract', () => {
  assert.match(html, /\.command-wall \.sidebar-btn\s*\{[\s\S]*?min-height:\s*2\.75rem/);
  assert.match(html, /\.command-wall \.ppg-tab-btn,[\s\S]*?#view-analyze button[\s\S]*?min-height:\s*2\.75rem/);
  assert.match(html, /id="btnRefreshDashboard"[^>]*aria-label="รีเฟรชข้อมูล"[^>]*class="[^"]*min-h-11[^"]*min-w-11/);
  assert.match(html, /#modalNewTaskClose,[\s\S]*?#contextDrawerClose[\s\S]*?min-width:\s*2\.75rem/);
});
