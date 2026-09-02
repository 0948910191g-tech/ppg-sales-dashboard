import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const prototypeUrl = new URL('../dashboard-reference-prototype.html', import.meta.url);
const prototypePath = fileURLToPath(prototypeUrl);
const html = fs.readFileSync(prototypePath, 'utf8');
const inlineScript = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1])
  .join('\n');

function classPattern(className) {
  return new RegExp(`<[^>]+\\bclass=["'][^"']*\\b${className}\\b[^"']*["']`, 'i');
}

function extractMediaBodies(source, mediaQuery) {
  const bodies = [];
  const queryPattern = new RegExp(`@media\\s*\\(\\s*${mediaQuery}\\s*\\)`, 'gi');
  let match;

  while ((match = queryPattern.exec(source))) {
    const openingBrace = source.indexOf('{', match.index);
    if (openingBrace === -1) continue;

    let depth = 0;
    for (let index = openingBrace; index < source.length; index += 1) {
      if (source[index] === '{') depth += 1;
      if (source[index] !== '}') continue;

      depth -= 1;
      if (depth === 0) {
        bodies.push(source.slice(openingBrace + 1, index));
        queryPattern.lastIndex = index + 1;
        break;
      }
    }
  }

  return bodies;
}

const salesRouteKey = '(?:sales|sales[-_]?performance)';

const salesNavTriggerPattern = new RegExp(
  `<(?:a|button)\\b(?=[^>]*(?:href|data-(?:route|nav-target|view))=["']#?${salesRouteKey}["'])[^>]*>[\\s\\S]{0,320}?Sales\\s+Performance`,
  'i'
);

const salesRouteHookPattern = new RegExp(
  `<(?:main|section|div|template)\\b[^>]*(?:(?:data-(?:route|view|page|screen))=["']${salesRouteKey}["']|(?:id|class)=["'][^"']*(?:sales[-_]?performance|sales[-_]?route|route[-_]?sales|sales[-_]?page)[^"']*["'])|(?:const|let|var)\\s+salesPerformanceView\\s*=\\s*document\\.createElement\\(\\s*["']section["']\\s*\\)[\\s\\S]{0,500}?(?:\\.id\\s*=\\s*["']${salesRouteKey}["']|setAttribute\\(\\s*["'](?:id|data-route)["']\\s*,\\s*["']${salesRouteKey}["'])`,
  'i'
);

const salesRegionPattern = (tokens) => new RegExp(
  `<(?:main|section|div|article|aside|table|tbody|ul|ol|template)\\b[^>]*(?:\\bdata-(?:sales-)?(?:region|panel)=["'][^"']*${tokens}[^"']*["']|\\b(?:id|class)=["'][^"']*(?:sales[-_]?performance[-_]?|sales[-_]?|route[-_]?sales[-_]?|sales[-_]?route[-_]?|sales[-_]?region[-_]?)(?:${tokens})[^"']*["']|\\baria-label=["'][^"']*${tokens}[^"']*["']|\\bdata-sales-${tokens}\\b)`,
  'i'
);

function contextAfter(pattern, source = html, length = 12000) {
  const match = source.match(pattern);
  assert.ok(match, `missing expected hook: ${pattern}`);
  // Include a short heading prefix so a semantic table wrapper can be
  // associated with the panel title immediately before its hook.
  const contextStart = Math.max(0, match.index - 800);
  return source.slice(contextStart, match.index + length);
}

test('reference prototype contains the dashboard regions and reference labels', () => {
  const requiredRegions = [
    ['navigation rail', /<aside\b[^>]*\bclass=["'][^"']*\bsidebar\b/i],
    ['top bar', classPattern('topbar')],
    ['scope controls', /<section\b[^>]*\bclass=["'][^"']*\bscope\b/i],
    ['KPI strip', classPattern('kpi-grid')],
    ['trend and channel grid', classPattern('main-grid')],
    ['traffic, products, and review grid', classPattern('bottom-grid')]
  ];

  for (const [name, pattern] of requiredRegions) {
    assert.match(html, pattern, `missing required ${name} region`);
  }

  for (const label of [
    'Overview / ภาพรวม',
    'Confirmed GMV',
    'Orders',
    'AOV',
    'Sales from Ads',
    'Cancelled Orders',
    'GMV Trend / แนวโน้มยอดขาย',
    'Channel Split / สัดส่วนตามช่องทาง',
    'Real-time / แบบเรียลไทม์',
    'Traffic &amp; Source / ทราฟฟิกและแหล่งที่มา',
    'Top Products / สินค้าขายดี',
    'Review Action / สัญญาณที่ต้องตรวจสอบ'
  ]) {
    assert.match(html, new RegExp(label), `missing reference label: ${label}`);
  }
});

test('reference prototype carries an explicit data-safety disclosure', () => {
  assert.match(html, /Prototype UI only/i, 'prototype state should be labelled');
  assert.match(
    html,
    /ไม่ใช่การยืนยันข้อมูลจาก secured read model/i,
    'sample metrics must be explicitly separated from the secured read model'
  );
});

test('Sales Performance is a hash-addressable navigation route', () => {
  assert.match(
    html,
    salesNavTriggerPattern,
    'Sales Performance navigation should expose a route-bearing link or button'
  );
  assert.match(
    html,
    salesRouteHookPattern,
    'Sales Performance should expose a named route surface'
  );

  const hasHashReference = new RegExp(
    `href=["']#${salesRouteKey}["']`,
    'i'
  ).test(html);
  const hasHashController = /(?:hashchange|location\.hash)/i.test(inlineScript);
  assert.ok(
    hasHashReference || hasHashController,
    'Sales Performance navigation should be reachable through a URL hash'
  );
});

test('Sales Performance exposes the reference KPI and analysis regions', () => {
  const regions = [
    {
      name: 'KPI strip',
      hook: salesRegionPattern('(?:kpi|kpis|metric|metrics)(?:[-_]?strip|[-_]?grid)?'),
      labels: [/Confirmed GMV/i, /Orders/i, /AOV/i, /Buyers/i, /Conversion Rate/i],
      cardPattern: /<(?:article|div)\b[^>]*(?:data-(?:kpi|metric)\b|class=["'][^"']*\b(?:kpi|metric)\b)/gi,
      minimumCards: 5
    },
    {
      name: 'sales trend',
      hook: salesRegionPattern('(?:(?:sales[-_]?|gmv[-_]?)?trend|top[-_]?grid)'),
      labels: [/Sales Trend/i, /แนวโน้มยอดขาย/i]
    },
    {
      name: 'daily breakdown',
      hook: salesRegionPattern('(?:daily(?:[-_]?breakdown)?|รายละเอียดรายวัน)'),
      labels: [/Daily Breakdown/i, /รายละเอียดรายวัน/i],
      semanticPattern: /<table\b|\brole=["'](?:table|grid)["']/i
    },
    {
      name: 'sales evidence',
      hook: salesRegionPattern('(?:sales[-_]?evidence|evidence)'),
      labels: [/Sales Evidence/i, /หลักฐานยอดขาย/i]
    },
    {
      name: 'sales alerts',
      hook: salesRegionPattern('(?:sales[-_]?alerts?|alerts?|แจ้งเตือนยอดขาย)'),
      labels: [/Sales Alerts/i, /แจ้งเตือนยอดขาย/i]
    },
    {
      name: 'sales recommendations',
      hook: salesRegionPattern('(?:sales[-_]?recommendations?|recommendations?|คำแนะนำ)'),
      labels: [/Sales Recommendation/i, /คำแนะนำ/i]
    },
    {
      name: 'platform performance',
      hook: salesRegionPattern('(?:sales[-_]?platform|platform(?:[-_]?performance)?|ยอดขายตามแพลตฟอร์ม)'),
      labels: [/Sales by Platform/i, /ยอดขายตามแพลตฟอร์ม/i],
      semanticPattern: /<table\b|\brole=["'](?:table|grid)["']/i
    },
    {
      name: 'source performance',
      hook: salesRegionPattern('(?:sales[-_]?source|source(?:[-_]?performance)?|ยอดขายตามแหล่งที่มา)'),
      labels: [/Sales by Source/i, /ยอดขายตามแหล่งที่มา/i],
      semanticPattern: /<table\b|\brole=["'](?:table|grid)["']/i
    },
    {
      name: 'sales insights',
      hook: salesRegionPattern('(?:sales[-_]?insights?|insights?|list|อินไซต์ยอดขาย)'),
      labels: [/Top Sales Insights/i, /อินไซต์ยอดขาย/i]
    }
  ];

  for (const region of regions) {
    const regionSource = contextAfter(region.hook, html, region.minimumCards ? 7000 : 5000);
    for (const label of region.labels) {
      assert.match(regionSource, label, `${region.name} is missing ${label}`);
    }
    if (region.cardPattern) {
      const cards = regionSource.match(region.cardPattern) ?? [];
      assert.ok(
        cards.length >= region.minimumCards,
        `${region.name} should expose at least ${region.minimumCards} identifiable metric cards`
      );
    }
    if (region.semanticPattern) {
      assert.match(regionSource, region.semanticPattern, `${region.name} should use table semantics`);
    }
  }
});

test('Sales Performance makes static sample and unavailable states explicit', () => {
  const routeSource = contextAfter(salesRouteHookPattern, html, 20000);
  const staticStatePattern = /(?:\bdata-(?:state|mode|source|fixture|static|sample)=["'][^"']*(?:static|sample|fixture|true)[^"']*["']|\b(?:aria-label|aria-description)=["'][^"']*(?:static sample|prototype sample)[^"']*["']|\bclass=["'][^"']*(?:static[-_]?sample|sample[-_]?state|prototype[-_]?sample|sales[-_]?route[-_]?note)[^"']*["'])/i;
  const unavailableStatePattern = /(?:\bdata-(?:state|status|availability)=["'][^"']*unavailable[^"']*["']|\b(?:aria-label|aria-description)=["'][^"']*unavailable[^"']*["']|\bclass=["'][^"']*unavailable[^"']*["'])/i;

  assert.match(
    routeSource,
    staticStatePattern,
    'Sales Performance should carry a machine-readable static-sample state'
  );
  assert.match(
    routeSource,
    /(?:Prototype UI|Static sample|ตัวอย่างข้อมูล)/i,
    'Sales Performance should visibly disclose that metrics are samples'
  );
  assert.match(
    routeSource,
    unavailableStatePattern,
    'Sales Performance should carry a machine-readable unavailable state'
  );
  assert.match(
    routeSource,
    /(?:Unavailable in static preview|Secured source not connected|ไม่มีข้อมูลใน Prototype|ยังไม่ได้เชื่อม secured source|ไม่มี[^<]{0,80}static sample|แสดง\s*[“"]?—[”"]?\s*แทนการสร้างข้อมูล)/i,
    'Sales Performance should explain unavailable coverage instead of implying zero'
  );
});

test('Sales Performance route remains local and read-only', () => {
  assert.match(
    inlineScript,
    /(?:hashchange|location\.hash|sales[-_]?performance|sales[-_]?route)/i,
    'Sales route behavior should be represented in the local prototype script'
  );

  for (const forbidden of [
    /\bfetch\s*\(/i,
    /\bXMLHttpRequest\b/i,
    /\baxios\s*\(/i,
    /google\.script\.run/i,
    /google\.visualization/i,
    /\b(?:SpreadsheetApp|UrlFetchApp)\b/i,
    /\b(?:supabase|firebase)\b/i
  ]) {
    assert.doesNotMatch(
      inlineScript,
      forbidden,
      `Sales Performance route must not call protected data APIs: ${forbidden}`
    );
  }
});

test('reference prototype exposes native date inputs for a selectable period range', () => {
  const dateInputs = [...html.matchAll(/<input\b[^>]*\btype=["']date["'][^>]*>/gi)]
    .map((match) => match[0]);

  assert.ok(dateInputs.length >= 2, 'period picker should expose both start and end native date inputs');
  assert.ok(
    dateInputs.some((tag) => /(?:id|name)=["'][^"']*(?:period|date)[_-]?(?:start|from)|(?:id|name)=["'][^"']*(?:start|from)[_-]?(?:period|date)/i.test(tag)),
    'period picker should expose a start/from date input'
  );
  assert.ok(
    dateInputs.some((tag) => /(?:id|name)=["'][^"']*(?:period|date)[_-]?(?:end|to)|(?:id|name)=["'][^"']*(?:end|to)[_-]?(?:period|date)/i.test(tag)),
    'period picker should expose an end/to date input'
  );

  assert.match(
    html,
    /id=["']period-filter["'][^>]*type=["']button["'][^>]*aria-controls=["']period-popover["']/i,
    'period control should expose an accessible popover trigger'
  );
  assert.match(inlineScript, /(?:openPeriodPopover|periodPopover)[\s\S]{0,500}(?:addEventListener\(\s*["']click["']|classList\.add\(["']open["']\))/i);
});

test('compare, platform, and category controls are interactive and not left disabled', () => {
  const controls = [
    { name: 'compare period', id: 'compare-filter', aliases: ['compareFilter'] },
    { name: 'platform', id: 'platform-filter', aliases: ['platformFilter'] },
    { name: 'category', id: 'category-filter', aliases: ['categoryFilter'] }
  ];

  const hasChangeHandlerNear = (terms) => {
    const changePattern = /addEventListener\(\s*["']change["']/gi;
    let match;
    while ((match = changePattern.exec(inlineScript))) {
      const context = inlineScript.slice(Math.max(0, match.index - 220), match.index + 220);
      if (terms.some((term) => new RegExp(term, 'i').test(context))) return true;
    }
    return false;
  };

  for (const control of controls) {
    assert.match(
      inlineScript,
      new RegExp(`(?:id=["']${control.id}["']|\\b${control.aliases.join('|')}\\b)`, 'i'),
      `${control.name} control should be present`
    );
    assert.ok(
      hasChangeHandlerNear([control.id, ...control.aliases]),
      `${control.name} control should have a change handler`
    );
  }

  assert.match(inlineScript, /platformFilter\.disabled\s*=\s*false|platformFilter\.removeAttribute\(\s*["']disabled["']\s*\)/i);
  assert.match(inlineScript, /categoryFilter\.disabled\s*=\s*false|categoryFilter\.removeAttribute\(\s*["']disabled["']\s*\)/i);
  assert.doesNotMatch(
    inlineScript.match(/<select\s+id=["']compare-filter["'][^>]*>/i)?.[0] ?? '',
    /\bdisabled\b/i,
    'compare period control should not be disabled'
  );
});

test('interactive prototype discloses sample data and unavailable states', () => {
  const visibleMarkup = html
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ');

  assert.match(visibleMarkup, /Prototype UI only/i, 'visible UI should identify itself as a prototype');
  assert.match(html, /(?:static sample|ตัวอย่างข้อมูล|Sample scope)/i, 'sample-data disclosure should be present');
  assert.match(
    html,
    /(?:Unavailable in static preview|ไม่มีข้อมูล(?:ตัวอย่าง|ใน Prototype)|secured source not connected|ยังไม่ได้เชื่อม secured source)/i,
    'unavailable-state disclosure should be present'
  );
  assert.match(inlineScript, /filter-feedback|setFeedback\s*\(/i, 'filter changes should have an explicit feedback/status surface');
});

test('filter apply path is local-only and cannot fetch or access protected sources', () => {
  assert.match(
    inlineScript,
    /(?:function\s+[A-Za-z_$][\w$]*(?:apply|filter|render)[A-Za-z0-9_$]*\s*\(|(?:const|let|var)\s+[A-Za-z_$][\w$]*(?:apply|filter|render)[A-Za-z0-9_$]*\s*=)/i,
    'prototype should expose a filter/apply/render function'
  );
  assert.match(inlineScript, /filterState|filterValues/i, 'apply path should read local filter state');
  assert.match(inlineScript, /addEventListener\(\s*["'](?:change|input|click)["']/i, 'filter controls should have an event path');

  for (const forbidden of [
    /\bfetch\s*\(/i,
    /\bXMLHttpRequest\b/i,
    /google\.script\.run/i,
    /google\.visualization/i,
    /loadLiveSheetData\s*\(/i,
    /docs\.google\.com\/spreadsheets/i,
    /(?:supabase|firebase)\b/i
  ]) {
    assert.doesNotMatch(inlineScript, forbidden, `local prototype filter path must not use ${forbidden}`);
  }
});

test('data refresh motion is scoped to the KPI update path and has a focal target', () => {
  const refreshHookMatch = inlineScript.match(
    /const\s+playDataRefresh\s*=\s*\(\)\s*=>\s*\{([\s\S]*?)\n\s*\};/i
  );
  assert.ok(refreshHookMatch, 'prototype should expose a named data-refresh motion hook');

  const refreshHook = refreshHookMatch[1];
  assert.match(refreshHook, /querySelector\(\s*['"]\.kpi-grid['"]\s*\)/i);
  assert.match(refreshHook, /querySelectorAll\(\s*['"]\.kpi\s+\.metric['"]\s*\)/i);
  assert.match(refreshHook, /clearTimeout\(\s*refreshTimer\s*\)/i, 'repeat updates should cancel the prior pulse');
  assert.match(refreshHook, /classList\.remove\(\s*['"]is-refreshing['"]\s*\)/i);
  assert.match(refreshHook, /classList\.add\(\s*['"]is-refreshing['"]\s*\)/i);
  assert.match(refreshHook, /(?:setTimeout|requestAnimationFrame)\s*\(/i, 'the focal state should have a bounded lifecycle');

  assert.match(
    html,
    /\.kpi-grid\.is-refreshing[\s\S]*?\.kpi\s+\.metric\.is-refreshing/i,
    'motion styles should target the KPI focal surface rather than a global selector'
  );
  assert.match(html, /@keyframes\s+metric-refresh\b/i, 'the refresh hook should have an authored, named motion');

  const renderFiltersMatch = inlineScript.match(
    /const\s+renderFilters\s*=\s*\(animate\s*=\s*true\)\s*=>\s*\{([\s\S]*?)\n\s*\};/i
  );
  assert.ok(renderFiltersMatch, 'filter rendering should expose an explicit animation opt-in');
  assert.match(renderFiltersMatch[1], /if\s*\(\s*animate\s*\)\s*playDataRefresh\s*\(\s*\)/i);
  assert.match(inlineScript, /renderFilters\(\s*false\s*\)/i, 'initial render should not replay update feedback');

  assert.match(inlineScript, /filterFeedback\.setAttribute\(\s*['"]role['"]\s*,\s*['"]status['"]\s*\)/i);
  assert.match(inlineScript, /filterFeedback\.classList\.add\(\s*['"]is-updated['"]\s*\)/i);
});

test('reduced motion keeps the refresh state intentional and legible', () => {
  const reducedMotionBlocks = extractMediaBodies(
    html,
    'prefers-reduced-motion\\s*:\\s*reduce'
  );
  assert.ok(reducedMotionBlocks.length > 0, 'prototype should define a reduced-motion media query');

  const scopedAlternative = reducedMotionBlocks.find((body) =>
    /(?:\.filter-feedback\.is-updated|\.kpi-grid\.is-refreshing|\.kpi\s+\.metric\.is-refreshing)/i.test(body)
  );
  assert.ok(
    scopedAlternative,
    'reduced motion should name the dashboard motion targets, not only disable every element globally'
  );
  assert.match(
    scopedAlternative,
    /(?:animation|transition|transform)\s*:/i,
    'reduced motion should explicitly change the motion behavior'
  );
  assert.match(
    scopedAlternative,
    /(?:animation\s*:\s*none|transform\s*:\s*none|transition-duration\s*:\s*[^;]+)!?/i,
    'reduced motion should remove or shorten spatial movement'
  );
  assert.match(
    scopedAlternative,
    /(?:box-shadow|opacity|background(?:-color)?|color)\s*:/i,
    'reduced motion should retain a visible state cue instead of making feedback disappear'
  );
});

test('period popover closes through keyboard paths without losing focus context', () => {
  const popoverMarkup = inlineScript.match(
    /const\s+periodPopover\s*=\s*document\.createElement\(\s*['"]section['"]\s*\);([\s\S]*?)document\.body\.append\(periodPopover\)/i
  );
  assert.ok(popoverMarkup, 'period popover should be a named, inspectable dialog surface');
  assert.match(popoverMarkup[1], /setAttribute\(\s*['"]role['"]\s*,\s*['"]dialog['"]\s*\)/i);
  assert.match(popoverMarkup[1], /setAttribute\(\s*['"]aria-(?:label|labelledby)['"]/i);

  const openMatch = inlineScript.match(
    /const\s+openPeriodPopover\s*=\s*\(\)\s*=>\s*\{([\s\S]*?)\n\s*\};/i
  );
  assert.ok(openMatch, 'period popover should have an explicit open path');
  assert.match(openMatch[1], /setAttribute\(\s*['"]aria-expanded['"]\s*,\s*['"]true['"]\s*\)/i);
  assert.match(openMatch[1], /querySelector\(\s*['"]#period-start['"]\s*\)\.focus\(\s*\)/i);

  const closeMatch = inlineScript.match(
    /const\s+closePeriodPopover\s*=\s*\(([^)]*)\)\s*=>\s*\{([\s\S]*?)\n\s*\};/i
  );
  assert.ok(closeMatch, 'period popover should have a named close path');
  const closeArgs = closeMatch[1];
  const closeBody = closeMatch[2];
  assert.match(closeArgs, /returnFocus\s*=\s*false/i, 'focus restoration should be an explicit close option');
  assert.match(closeBody, /periodPopover\.classList\.remove\(\s*['"]open['"]\s*\)/i);
  assert.match(closeBody, /setAttribute\(\s*['"]aria-expanded['"]\s*,\s*['"]false['"]\s*\)/i);
  assert.match(closeBody, /if\s*\(\s*returnFocus\s*\)[\s\S]{0,120}\.focus\(\s*\)/i);

  assert.match(
    inlineScript,
    /cancel-period[\s\S]{0,260}closePeriodPopover\(\s*true\s*\)/i,
    'cancel should return focus to the period trigger'
  );
  assert.match(
    inlineScript,
    /apply-period[\s\S]{0,600}closePeriodPopover\(\s*true\s*\)/i,
    'apply should return focus to the period trigger'
  );
  assert.match(
    inlineScript,
    /event\.key\s*===\s*['"]Escape['"][\s\S]{0,180}periodPopover\.classList\.contains\(\s*['"]open['"]\s*\)[\s\S]{0,180}closePeriodPopover\(\s*true\s*\)/i,
    'Escape should close an open popover and restore the trigger focus'
  );
});

test('Review confirmation opens the local read-only walkthrough route', () => {
  assert.match(
    inlineScript,
    /confirm-modal[\s\S]{0,360}window\.location\.hash\s*=\s*["']review-walkthrough["']/i,
    'the confirmation action must navigate to the local Review Walkthrough it names'
  );
});

test('every local src and href asset reference resolves to a file', () => {
  const references = [...html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)]
    .map((match) => match[1])
    .filter((reference) => reference && !/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference));

  assert.ok(references.length > 0, 'prototype should include at least one local asset reference');

  for (const reference of references) {
    const pathWithoutFragment = reference.split(/[?#]/, 1)[0];
    const assetUrl = new URL(pathWithoutFragment, pathToFileURL(prototypePath));
    assert.equal(assetUrl.protocol, 'file:', `local reference should resolve from the prototype: ${reference}`);

    const assetPath = fileURLToPath(assetUrl);
    assert.ok(fs.existsSync(assetPath), `missing local asset: ${reference}`);
    assert.ok(fs.statSync(assetPath).isFile(), `local asset is not a file: ${reference}`);

    // Keep this assertion explicit so a future absolute filesystem path cannot
    // silently pass as a prototype-local asset.
    assert.equal(
      path.dirname(assetPath).startsWith(path.dirname(prototypePath)),
      true,
      `local asset must live beside the prototype: ${reference}`
    );
  }
});
