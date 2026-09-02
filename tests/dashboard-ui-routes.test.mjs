import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const prototypePath = fileURLToPath(new URL('../dashboard-reference-prototype.html', import.meta.url));
const html = fs.readFileSync(prototypePath, 'utf8');
const inlineScript = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1])
  .join('\n');

const expectedRoutes = [
  'overview',
  'sales-performance',
  'products',
  'marketing-ads',
  'creators',
  'competitors'
];

const routeContracts = {
  'sales-performance': {
    label: /Sales\s+Performance/i,
    regions: [
      { id: 'sales-kpi-strip', labels: [/Confirmed GMV/i, /Orders/i, /AOV/i, /Buyers/i, /Conversion Rate/i] },
      { id: 'sales-trend-panel', labels: [/Sales Trend/i, /แนวโน้มยอดขาย/i] },
      { id: 'sales-daily-breakdown', labels: [/Daily Breakdown/i, /รายละเอียดรายวัน/i], table: true },
      { id: 'sales-evidence', labels: [/Sales Evidence/i, /หลักฐานยอดขาย/i] },
      { id: 'sales-alerts', labels: [/Sales Alerts/i, /แจ้งเตือนยอดขาย/i] },
      { id: 'sales-recommendations', labels: [/Sales Recommendation/i, /คำแนะนำ/i] }
    ]
  },
  products: {
    label: /Products|สินค้า/i,
    regions: [
      { id: 'products-kpi-strip', labels: [/Product GMV/i, /Units Sold/i, /Active SKUs?/i, /Out of Stock SKUs?/i, /Product Conversion/i] },
      { id: 'products-top-products', labels: [/Top Products/i], table: true },
      { id: 'products-category-performance', labels: [/Category Performance/i], table: true },
      { id: 'products-stock-health', labels: [/Stock Health/i] },
      { id: 'products-low-stock-alerts', labels: [/Low Stock Alerts/i] },
      { id: 'products-product-funnel', labels: [/Product Funnel/i] },
      { id: 'products-top-movers', labels: [/Top Movers/i] },
      { id: 'products-review-actions', labels: [/Product Review Actions?/i, /Review Actions?/i] }
    ]
  },
  'marketing-ads': {
    label: /Marketing\s*(?:&|and)\s*Ads|การตลาด(?:และ)?โฆษณา/i,
    regions: [
      { id: 'marketing-ads-kpi-strip', labels: [/Ad Spend/i, /Sales from Ads/i, /ROAS/i, /CTR/i, /CPC/i, /Conversion/i] },
      { id: 'marketing-ads-spend-vs-sales', labels: [/Spend\s*(?:vs|versus)\s*(?:Attributed )?Sales/i] },
      { id: 'marketing-ads-roas-trend', labels: [/ROAS Trend/i] },
      { id: 'marketing-ads-traffic-sources', labels: [/Traffic Source Split/i, /Traffic Sources?/i] },
      { id: 'marketing-ads-campaign-performance', labels: [/Campaign Performance/i], table: true },
      { id: 'marketing-ads-audience-placement', labels: [/Audience/i, /Placement/i] },
      { id: 'marketing-ads-opportunities', labels: [/Optimization Opportunities/i, /Opportunities/i] }
    ]
  },
  creators: {
    label: /Creators|ครีเอเตอร์/i,
    regions: [
      { id: 'creators-kpi-strip', labels: [/Creator GMV/i, /Orders via Creators/i, /Active Creators/i, /Creator Conversion/i, /Average AOV/i] },
      { id: 'creators-top-creators', labels: [/Top Creators/i], table: true },
      { id: 'creators-gmv-trend', labels: [/GMV Trend/i] },
      { id: 'creators-insights', labels: [/Creator Insights/i, /Insights/i] },
      { id: 'creators-source-contribution', labels: [/Source Contribution/i] },
      { id: 'creators-tier-segmentation', labels: [/Tier Segmentation/i, /Tier/i], table: true },
      { id: 'creators-campaign-status', labels: [/Campaign Status/i] },
      { id: 'creators-health-snapshot', labels: [/Creator Health/i, /Health Snapshot/i] }
    ]
  },
  competitors: {
    label: /Competitors|คู่แข่ง|Benchmark/i,
    regions: [
      { id: 'competitors-benchmark-banner', labels: [/Competitor Benchmark/i, /Benchmark Screen/i, /Benchmark Period/i] },
      { id: 'competitors-market-share-kpis', labels: [/Market Size/i, /Market Share/i] },
      { id: 'competitors-channel-share', labels: [/Channel Market Share/i, /Channel Share/i] },
      { id: 'competitors-price-assortment', labels: [/Price Comparison/i, /Assortment Comparison/i], table: true },
      { id: 'competitors-promotion-intensity', labels: [/Promotion Intensity/i] },
      { id: 'competitors-benchmark-trend', labels: [/Benchmark Trend/i] },
      { id: 'competitors-sov-price-index', labels: [/Share of Voice/i, /Price Index/i] },
      { id: 'competitors-opportunity-insights', labels: [/Opportunity Insights/i, /Opportunities/i] }
    ]
  }
};

const semanticRegionTags = new Set(['main', 'section', 'article', 'aside', 'div', 'figure', 'table']);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function openingTags(source) {
  return [...source.matchAll(/<([a-z][\w:-]*)\b[^>]*>/gi)].map((match) => ({
    name: match[1].toLowerCase(),
    raw: match[0],
    index: match.index
  }));
}

const tags = openingTags(html);

function attribute(tag, name) {
  const match = tag.raw.match(new RegExp(`\\b${escapeRegExp(name)}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match?.[2] ?? null;
}

function contextAround(source, index, radius = 12000) {
  return source.slice(Math.max(0, index - radius), Math.min(source.length, index + radius));
}

function routeRegistrySource() {
  const declaration = html.match(/(?:const|let|var)\s+(?:ROUTE_REGISTRY|routeRegistry|ROUTES|routes)\s*=\s*(?:Object\.freeze\(\s*)?[{[]/i);
  assert.ok(declaration, 'dashboard should expose a central route registry object for deep links');
  return html.slice(declaration.index, declaration.index + 60000);
}

function hasScriptRouteIdHook(route) {
  const escapedRoute = escapeRegExp(route);
  return new RegExp(
    `(?:\\.id\\s*=\\s*|setAttribute\\(\\s*["']id["']\\s*,\\s*)["']${escapedRoute}-view["']`,
    'i'
  ).test(inlineScript);
}

function hasScriptRouteMarker(route) {
  const escapedRoute = escapeRegExp(route);
  return new RegExp(
    `(?:data-route-view|data-route)["']?\\s*(?:=|,)|dataset\\.routeView\\s*=\\s*` +
      `["']${escapedRoute}["']`,
    'i'
  ).test(inlineScript) && new RegExp(`(?:data-route-view|data-route)["']?[^\\n]{0,180}["']${escapedRoute}["']`, 'i').test(html + inlineScript);
}

function findRouteView(route) {
  const viewId = `${route}-view`;
  const markupView = tags.find((tag) => (
    semanticRegionTags.has(tag.name) &&
    attribute(tag, 'data-route-view')?.toLowerCase() === route
  )) ?? tags.find((tag) => (
    semanticRegionTags.has(tag.name) &&
    attribute(tag, 'id')?.toLowerCase() === viewId &&
    attribute(tag, 'data-route')?.toLowerCase() === route
  ));

  if (markupView) return markupView;

  const dynamicView = new RegExp(
    `document\\.createElement\\(\\s*["'](?:main|section|article|aside|div)["']\\s*\\)` +
      `[\\s\\S]{0,1200}(?:\\.id\\s*=\\s*|setAttribute\\(\\s*["']id["']\\s*,\\s*)` +
      `["']${escapeRegExp(viewId)}["']`,
    'i'
  );

  return dynamicView.test(inlineScript) && hasScriptRouteIdHook(route) && hasScriptRouteMarker(route)
    ? { name: 'dynamic semantic container', raw: '', index: inlineScript.search(dynamicView) }
    : null;
}

function findRegionHook(regionId) {
  const markupRegion = tags.find((tag) => (
    semanticRegionTags.has(tag.name) &&
    (
      attribute(tag, 'data-region')?.toLowerCase() === regionId ||
      attribute(tag, 'id')?.toLowerCase() === regionId
    )
  ));

  if (markupRegion) return { source: html, index: markupRegion.index, markup: markupRegion };

  const escapedRegion = escapeRegExp(regionId);
  const dynamicRegion = new RegExp(
    `(?:\\.id\\s*=\\s*|setAttribute\\(\\s*["']id["']\\s*,\\s*)["']${escapedRegion}["']|` +
      `(?:data-region|data-panel)["']?\\s*[:=]\\s*["']${escapedRegion}["']|` +
      `["']${escapedRegion}["']\\s*:`,
    'i'
  );
  const match = inlineScript.match(dynamicRegion);
  return match
    ? { source: inlineScript, index: match.index, markup: null }
    : null;
}

function findNavHook(route) {
  return tags.find((tag) => (
    (tag.name === 'a' || tag.name === 'button') &&
    (
      attribute(tag, 'data-route')?.toLowerCase() === route ||
      attribute(tag, 'data-route-target')?.toLowerCase() === route
    ) && (
      attribute(tag, 'aria-controls')?.toLowerCase() === `${route}-view` ||
      attribute(tag, 'href')?.toLowerCase() === `#${route}`
    )
  ));
}

function hasChangeHandlerNear(tokens) {
  const changePattern = /addEventListener\(\s*["']change["']/gi;
  let match;

  while ((match = changePattern.exec(inlineScript))) {
    const context = contextAround(inlineScript, match.index, 1800);
    if (tokens.some((token) => new RegExp(escapeRegExp(token), 'i').test(context))) {
      return true;
    }
  }

  return false;
}

function findControl(id) {
  return tags.find((tag) => (
    ['select', 'input', 'button'].includes(tag.name) &&
    attribute(tag, 'id')?.toLowerCase() === id
  ));
}

function hasAttributeHook(attributeName, expectedValue) {
  return tags.some((tag) => attribute(tag, attributeName)?.toLowerCase() === expectedValue.toLowerCase());
}

test('route registry and navigation expose every UI-01 through UI-05 deep link', () => {
  const registry = routeRegistrySource();

  for (const route of expectedRoutes) {
    assert.match(
      registry,
      new RegExp(`(?:["']${escapeRegExp(route)}["']|\\b${escapeRegExp(route)}\\b)\\s*:`, 'i'),
      `routeRegistry should register #${route}`
    );

    const nav = findNavHook(route);
    assert.ok(nav, `navigation should expose [data-route="${route}"] or [data-route-target="${route}"] with aria-controls="${route}-view"`);

    const navContext = contextAround(html, nav.index, 650);
    assert.match(navContext, routeContracts[route]?.label ?? new RegExp(route, 'i'), `navigation label should identify #${route}`);
  }

  assert.match(inlineScript, /(?:window\.)?location\.hash/i, 'route controller should read the URL hash');
  assert.match(inlineScript, /addEventListener\(\s*["']hashchange["']/i, 'route controller should react to deep-link hash changes');
});

for (const [route, contract] of Object.entries(routeContracts)) {
  test(`#${route} exposes its primary semantic regions`, () => {
    assert.ok(findRouteView(route), `#${route} should expose a semantic #${route}-view route surface`);

    for (const region of contract.regions) {
      const hook = findRegionHook(region.id);
      assert.ok(hook, `#${route} is missing semantic region hook [data-region="${region.id}"]`);

      const regionContext = contextAround(hook.source, hook.index, 14000);
      assert.ok(
        region.labels.some((label) => label.test(regionContext)),
        `${region.id} should keep a visible semantic heading near its region hook`
      );

      if (region.table) {
        assert.match(
          regionContext,
          /<table\b|\brole=["'](?:table|grid)["']/i,
          `${region.id} should expose table/grid semantics for dense comparison data`
        );
      }
    }
  });
}

test('Products exposes an operable local brand filter', () => {
  const control = findControl('products-brand-filter');
  assert.ok(control, 'Products should expose #products-brand-filter as a native control');
  assert.equal(attribute(control, 'data-filter')?.toLowerCase(), 'brand', '#products-brand-filter should declare data-filter="brand"');
  assert.ok(attribute(control, 'aria-label') || attribute(control, 'aria-labelledby'), '#products-brand-filter should have an accessible name');
  assert.doesNotMatch(control.raw, /\bdisabled(?:\s*=\s*(?:["']?true|["']))?/i, '#products-brand-filter must remain operable');
  assert.ok(
    hasChangeHandlerNear(['products-brand-filter', 'brand', 'products']),
    '#products-brand-filter should have a local change/update path'
  );
});

test('Marketing & Ads exposes local channel and campaign-type controls', () => {
  for (const [id, filter] of [
    ['marketing-ads-channel-filter', 'channel'],
    ['marketing-ads-campaign-type-filter', 'campaign-type']
  ]) {
    const control = findControl(id);
    assert.ok(control, `Marketing & Ads should expose #${id}`);
    assert.equal(attribute(control, 'data-filter')?.toLowerCase(), filter, `#${id} should declare data-filter="${filter}"`);
    assert.ok(attribute(control, 'aria-label') || attribute(control, 'aria-labelledby'), `#${id} should have an accessible name`);
    assert.doesNotMatch(control.raw, /\bdisabled(?:\s*=\s*(?:["']?true|["']))?/i, `#${id} must remain operable`);
    assert.ok(
      hasChangeHandlerNear([id, filter, 'marketing-ads']),
      `#${id} should have a local change/update path`
    );
  }
});

test('Creators exposes an operable local creator-status filter', () => {
  const control = findControl('creators-status-filter');
  assert.ok(control, 'Creators should expose #creators-status-filter as a native control');
  assert.equal(attribute(control, 'data-filter')?.toLowerCase(), 'status', '#creators-status-filter should declare data-filter="status"');
  assert.ok(attribute(control, 'aria-label') || attribute(control, 'aria-labelledby'), '#creators-status-filter should have an accessible name');
  assert.doesNotMatch(control.raw, /\bdisabled(?:\s*=\s*(?:["']?true|["']))?/i, '#creators-status-filter must remain operable');
  assert.ok(
    hasChangeHandlerNear(['creators-status-filter', 'creator-status', 'status', 'creators']),
    '#creators-status-filter should have a local change/update path'
  );
});

test('Competitors keeps benchmark period and snapshot/sample state separate from Sales scope', () => {
  const benchmarkPeriod = findControl('benchmark-period-filter');
  assert.ok(benchmarkPeriod, 'Competitors should expose #benchmark-period-filter');
  assert.equal(attribute(benchmarkPeriod, 'data-filter')?.toLowerCase(), 'benchmark-period', '#benchmark-period-filter should declare data-filter="benchmark-period"');
  assert.equal(attribute(benchmarkPeriod, 'data-period-scope')?.toLowerCase(), 'benchmark', '#benchmark-period-filter should declare data-period-scope="benchmark"');
  assert.match(
    attribute(benchmarkPeriod, 'aria-label') ?? '',
    /Benchmark\s+Period/i,
    '#benchmark-period-filter should be explicitly labelled Benchmark Period'
  );
  assert.ok(hasChangeHandlerNear(['benchmark-period-filter', 'benchmark-period', 'competitors']), '#benchmark-period-filter should update local prototype state');

  assert.ok(hasAttributeHook('data-benchmark-state', 'snapshot'), 'Competitors should expose data-benchmark-state="snapshot"');
  assert.match(
    html,
    /(?:Competitor\s+Benchmark|Benchmark\s+Screen)[\s\S]{0,5000}(?:Snapshot|sample|ตัวอย่าง)/i,
    'benchmark UI should visibly disclose Snapshot/sample status'
  );
  assert.match(html, /(?:Selected\s+)?Sales\s+Period/i, 'Sales scope should retain an explicit period label');
  assert.match(html, /Benchmark\s+Period/i, 'benchmark scope should retain an explicit period label');

  const salesPeriod = findControl('period-filter');
  assert.ok(salesPeriod, 'shared Sales scope should expose #period-filter');
  assert.notEqual(
    attribute(salesPeriod, 'id'),
    attribute(benchmarkPeriod, 'id'),
    'Sales period and benchmark period must use separate controls'
  );
});

test('completion routes remain local static UI and avoid protected browser data APIs', () => {
  for (const [name, pattern] of [
    ['fetch', /\bfetch\s*\(/i],
    ['XMLHttpRequest', /\bXMLHttpRequest\b/i],
    ['axios', /\baxios\s*\(/i],
    ['WebSocket', /\bWebSocket\s*\(/i],
    ['EventSource', /\bEventSource\s*\(/i],
    ['sendBeacon', /\bnavigator\.sendBeacon\s*\(/i],
    ['google.script.run', /google\.script\.run/i],
    ['google.visualization', /google\.visualization/i],
    ['Google Sheets URL', /(?:docs\.google\.com\/spreadsheets|sheets\.googleapis\.com)/i],
    ['Apps Script data service', /\b(?:SpreadsheetApp|UrlFetchApp|DriveApp)\b/i],
    ['remote data SDK', /\b(?:supabase|firebase)\b/i],
    ['browser persistence', /\b(?:localStorage|sessionStorage|indexedDB)\b/i],
    ['cookie access', /\bdocument\.cookie\b/i]
  ]) {
    assert.doesNotMatch(inlineScript, pattern, `prototype must not use protected browser/data API: ${name}`);
  }
});
