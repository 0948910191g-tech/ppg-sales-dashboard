import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const prototypePath = fileURLToPath(new URL('../dashboard-reference-prototype.html', import.meta.url));
const html = fs.readFileSync(prototypePath, 'utf8');
const inlineScripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(([, attributes]) => !/\bsrc\s*=\s*/i.test(attributes))
  .map(([, , body]) => body)
  .join('\n');
const css = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
  .map(([, body]) => body)
  .join('\n');

// Runtime-injected style blocks are part of the prototype CSS contract too.
const styleSource = `${css}\n${inlineScripts}`;
const source = `${html}\n${inlineScripts}`;

function assertSourceMatches(text, pattern, message) {
  assert.ok(pattern.test(text), message);
}

const ROUTES = [
  'overview',
  'sales-performance',
  'products',
  'marketing-ads',
  'creators',
  'competitors',
  'review',
  'review-walkthrough',
  'data-health',
  'data-explorer'
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function openingTags(tagName = '[a-z][\\w:-]*') {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'gi'))]
    .map(match => ({ raw: match[0], index: match.index }));
}

const tags = openingTags();

function attributeValue(rawTag, attributeName) {
  const escapedName = escapeRegExp(attributeName);
  const match = rawTag.match(new RegExp(
    `\\b${escapedName}\\s*=\\s*(?:(["'])(.*?)\\1|([^\\s"'=<>` + '`' + `]+))`,
    'i'
  ));
  return match?.[2] ?? match?.[3] ?? undefined;
}

function hasAttribute(rawTag, attributeName) {
  const tagName = rawTag.match(/^<\s*[^\s/>]+/);
  if (!tagName) return false;

  const attributeSource = rawTag
    .slice(tagName[0].length)
    .replace(/\/\s*>\s*$/, '')
    .replace(/>\s*$/, '');
  const attributePattern = /([:\w-]+)(?:\s*=\s*(?:["']([^"']*)["']|([^\s"'=<>]+)))?/g;
  let match;

  while ((match = attributePattern.exec(attributeSource))) {
    if (match[1].toLowerCase() === attributeName.toLowerCase()) return true;
  }

  return false;
}

function tagsWithAttribute(attributeName) {
  return tags.filter(({ raw }) => hasAttribute(raw, attributeName));
}

function tagsWithClass(className) {
  const escapedClass = escapeRegExp(className);
  return tags.filter(({ raw }) => {
    const classes = attributeValue(raw, 'class') ?? '';
    return new RegExp(`(?:^|\\s)${escapedClass}(?:\\s|$)`, 'i').test(classes);
  });
}

function tagsById(id) {
  const escapedId = escapeRegExp(id);
  return tags.filter(({ raw }) => new RegExp(
    `\\bid\\s*=\\s*["']${escapedId}["']`,
    'i'
  ).test(raw));
}

function firstTagById(id) {
  return tagsById(id)[0] ?? null;
}

function hasRuntimeAttributeForClass(className, attributeName, expectedValue) {
  const escapedClass = escapeRegExp(className);
  const escapedAttribute = escapeRegExp(attributeName);
  const escapedValue = escapeRegExp(expectedValue);
  return new RegExp(
    'querySelectorAll\\(\\s*["\\x27\\x60][^"\\x27\\x60]*' + escapedClass +
      '[^"\\x27\\x60]*["\\x27\\x60][\\s\\S]{0,1800}' +
      'setAttribute\\(\\s*["\']' + escapedAttribute + '["\']\\s*,\\s*["\']' + escapedValue + '["\']',
    'i'
  ).test(inlineScripts);
}

function visibleText(markup) {
  return markup
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMediaBodies(style, mediaQuery) {
  const bodies = [];
  const queryPattern = new RegExp(`@media\\s*\\(\\s*${mediaQuery}\\s*\\)`, 'gi');
  let match;

  while ((match = queryPattern.exec(style))) {
    const openingBrace = style.indexOf('{', match.index);
    if (openingBrace === -1) continue;

    let depth = 0;
    for (let index = openingBrace; index < style.length; index += 1) {
      if (style[index] === '{') depth += 1;
      if (style[index] !== '}') continue;

      depth -= 1;
      if (depth === 0) {
        bodies.push(style.slice(openingBrace + 1, index));
        queryPattern.lastIndex = index + 1;
        break;
      }
    }
  }

  return bodies;
}

function extractBalancedBlock(text, openingIndex) {
  const opening = text[openingIndex];
  const closing = opening === '{' ? '}' : ']';
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = openingIndex; index < text.length; index += 1) {
    const character = text[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      continue;
    }
    if (character === opening) depth += 1;
    if (character !== closing) continue;

    depth -= 1;
    if (depth === 0) return text.slice(openingIndex, index + 1);
  }

  return '';
}

function routeRegistrySource() {
  const declarations = [...inlineScripts.matchAll(
    /\b(?:const|let|var)\s+(ROUTE_REGISTRY|routeRegistry|routes)\s*=\s*(?:Object\.freeze\(\s*)?([{[])/gi
  )];
  assert.ok(declarations.length, 'prototype script must expose a central route registry');

  const completeRegistry = declarations
    .map(declaration => {
      const openingIndex = declaration.index + declaration[0].lastIndexOf(declaration[2]);
      return extractBalancedBlock(inlineScripts, openingIndex);
    })
    .find(registry => ROUTES.every(route => new RegExp(
      `(?:["']${escapeRegExp(route)}["']|\\b${escapeRegExp(route)}\\b)`,
      'i'
    ).test(registry)));

  assert.ok(
    completeRegistry,
    `one route registry must list all approved routes: ${ROUTES.join(', ')}`
  );
  return completeRegistry;
}

function hasStaticRouteNavigation(route) {
  const escapedRoute = escapeRegExp(route);
  return tags.some(({ raw }) => {
    if (!/<(?:a|button)\b/i.test(raw)) return false;

    return [
      new RegExp(`\\bdata-route\\s*=\\s*["']${escapedRoute}["']`, 'i'),
      new RegExp(`\\bdata-route-target\\s*=\\s*["']${escapedRoute}["']`, 'i'),
      new RegExp(`\\bhref\\s*=\\s*["']#${escapedRoute}["']`, 'i'),
      new RegExp(`\\baria-controls\\s*=\\s*["']${escapedRoute}-view["']`, 'i')
    ].some(pattern => pattern.test(raw));
  });
}

function hasRegistryDrivenNavigation() {
  return /Object\.entries\(\s*(?:ROUTE_REGISTRY|routeRegistry|routes)\s*\)\s*\.forEach[\s\S]{0,2200}dataset\.route/i.test(inlineScripts);
}

function hasRouteSurfaceMarker() {
  return tagsWithAttribute('data-route-view').length > 0 || /(?:data-route-view|dataset\.routeView|setAttribute\(\s*["']data-route-view["']|\.dataset\.route\s*=)/i.test(inlineScripts);
}

test('shared shell exposes one route heading and four shared scope controls', () => {
  const h1Tags = openingTags('h1');
  assert.equal(h1Tags.length, 1, 'the shared shell must expose exactly one h1 route heading');
  const headingContext = html.slice(Math.max(0, h1Tags[0].index - 260), h1Tags[0].index + h1Tags[0].raw.length + 120);
  assert.match(
    h1Tags[0].raw + headingContext,
    /(?:\bid=["'](?:pageHeadingTitle|route-heading)["']|class=["'][^"']*title-row[^"']*["'])/i,
    'the h1 must be a named shared route-heading hook'
  );
  assert.doesNotMatch(inlineScripts, /<h1\b/i, 'route renderers must reuse the shared h1 instead of creating another one');
  assertSourceMatches(
    inlineScripts,
    /(?:pageHeadingTitle|title-row\s+h1|routeHeading|querySelector\(\s*["'][^"']*h1)[\s\S]{0,1800}(?:innerHTML|innerText|textContent)\s*=/i,
    'route activation must update the shared route heading'
  );

  const shell = tagsWithClass('scope')[0]
    ?? firstTagById('globalContextBar');
  assert.ok(shell, 'the shared shell must expose a scope/context bar');
  assert.match(shell.raw, /\baria-label=["'][^"']+["']/i, 'the shared scope/context bar needs an accessible name');

  const controls = [
    ['period-filter', 'period'],
    ['compare-filter', 'comparison-period'],
    ['platform-filter', 'platform'],
    ['category-filter', 'category']
  ];
  const fallbackLabels = {
    'platform-filter': /platform|แพลตฟอร์ม/i,
    'category-filter': /category|หมวดหมู่/i
  };

  for (const [id, contextName] of controls) {
    const control = firstTagById(id) ?? tags.find(({ raw }) => (
      /^<(?:select|input|button)\b/i.test(raw) && fallbackLabels[id]?.test(raw)
    ));
    const runtimeId = new RegExp(`(?:\\.id\\s*=\\s*|setAttribute\\(\\s*["']id["']\\s*,\\s*)["']${escapeRegExp(id)}["']`, 'i');
    assert.ok(control || runtimeId.test(inlineScripts), `shared ${contextName} control #${id} is required`);
    if (!control) continue;
    assert.match(control.raw, /^<(?:select|input|button)\b/i, `#${id} must be a native control`);
    const controlContext = source.slice(
      Math.max(0, control.index - 500),
      control.index + control.raw.length + 500
    );
    assert.ok(
      attributeValue(control.raw, 'aria-label') ||
        attributeValue(control.raw, 'aria-labelledby') ||
        (attributeValue(control.raw, 'aria-controls') && /(?:period|ช่วงเวลา|compare|เปรียบเทียบ)/i.test(controlContext)),
      `#${id} needs an accessible name`
    );
    assert.doesNotMatch(control.raw, /\bdisabled(?:\s*=\s*(?:["']?(?:true|disabled)["']?))?/i, `#${id} must remain operable`);
    assertSourceMatches(
      inlineScripts,
      new RegExp(`${escapeRegExp(id)}|${escapeRegExp(contextName)}`, 'i'),
      `shared ${contextName} state must be represented in the prototype script`
    );
  }

  assertSourceMatches(inlineScripts, /filterState|scopeState|sharedScope/i, 'the four controls must use shared in-memory scope state');
  assertSourceMatches(inlineScripts, /addEventListener\(\s*["'](?:change|click)["']/i, 'shared scope controls need local interaction hooks');
});

test('shared shell visibly discloses the static, local, read-only prototype boundary', () => {
  const text = visibleText(html);
  assert.match(text, /(?:Prototype UI only|Prototype Preview|Static sample|ตัวอย่างข้อมูล)/i);
  assert.match(text, /(?:not live|read-only|local|secured source not connected|ไม่ใช่การยืนยันข้อมูล|ไม่ได้เชื่อม)/i);
  assertSourceMatches(source, /(?:prototype-notice|Prototype UI only|Static sample|data-(?:mode|state)=["'][^"']*(?:prototype|static|sample))/i, 'prototype source must carry a machine-readable disclosure hook');
});

test('CSS exposes focus-visible, reduced-motion, responsive, and table-overflow contracts', () => {
  assert.match(styleSource, /:focus-visible\b/i, 'focus-visible CSS is required for keyboard users');
  const focusBodies = [...styleSource.matchAll(/[^{}]*:focus-visible[^{}]*\{([^{}]*)\}/gi)].map(([, body]) => body);
  assert.ok(
    focusBodies.some(body => /(?:outline|box-shadow)\s*:/i.test(body)),
    'a :focus-visible rule must render a visible outline or focus ring'
  );

  const reducedMotionBodies = extractMediaBodies(styleSource, 'prefers-reduced-motion\\s*:\\s*reduce');
  assert.ok(reducedMotionBodies.length, 'prefers-reduced-motion: reduce media query is required');
  const reducedMotion = reducedMotionBodies.join('\n');
  assert.match(reducedMotion, /(?:animation|transition)(?:-duration)?\s*:/i, 'reduced motion must minimize animation/transition');
  assert.match(reducedMotion, /scroll-behavior\s*:\s*auto/i, 'reduced motion must disable smooth scrolling');

  const mobileBodies = extractMediaBodies(styleSource, 'max-width\\s*:\\s*(?:520|639|767|900|1023)px');
  assert.ok(mobileBodies.length, 'a mobile/tablet breakpoint is required');
  assert.ok(
    mobileBodies.some(body => /(?:display\s*:\s*block|grid-template-columns|flex-wrap)/i.test(body)),
    'mobile CSS must reflow the shared shell'
  );
  assert.ok(
    mobileBodies.some(body => /overflow(?:-x)?\s*:\s*(?:auto|scroll|hidden)/i.test(body)),
    'mobile CSS must define an explicit overflow policy'
  );
  const scrollableNavigationOrTabs = /(?:\[data-route-nav\]|\bnav\b|\.nav-group|\.ui-tablist|\.ui-steps|\.view-tabs)[^{}]*\{[^{}]*overflow(?:-x)?\s*:\s*(?:auto|scroll)/i.test(styleSource);
  const wrappedNavigationOrTabs = /(?:\[data-route-nav\]|\bnav\b|\.nav-group|\.ui-tablist|\.ui-steps|\.view-tabs)[^{}]*\{[^{}]*flex-wrap\s*:\s*wrap/i.test(styleSource);
  assert.ok(
    scrollableNavigationOrTabs || wrappedNavigationOrTabs,
    'mobile navigation or tab strips must remain operable through horizontal overflow or wrapping'
  );

  const tableShells = [
    ...tagsWithAttribute('data-table-scroll'),
    ...tagsWithClass('dashboard-table-scroll'),
    ...tagsWithClass('ui-table-wrap'),
    ...tagsWithClass('sales-table-shell')
  ];
  assert.ok(tableShells.length, 'dense tables must expose a labelled scroll shell');
  for (const { raw } of tableShells) {
    assert.equal(attributeValue(raw, 'tabindex'), '0', 'table scroll shells must be keyboard focusable');
    const className = ['data-table-scroll', 'dashboard-table-scroll', 'ui-table-wrap', 'sales-table-shell']
      .find(candidate => new RegExp(`(?:^|\\s)${escapeRegExp(candidate)}(?:\\s|$)`, 'i').test(attributeValue(raw, 'class') ?? ''));
    assert.ok(
      attributeValue(raw, 'role') === 'region' || (className && hasRuntimeAttributeForClass(className, 'role', 'region')),
      'table scroll shells must expose region semantics'
    );
    assert.ok(attributeValue(raw, 'aria-label'), 'table scroll shells need an accessible label');
  }
  assert.match(
    styleSource,
    /(?:\[data-table-scroll\]|\.dashboard-table-scroll|\.ui-table-wrap|\.sales-table-shell)[^{}]*\{[^{}]*overflow(?:-x)?\s*:\s*(?:auto|scroll)/i,
    'table shells must use horizontal overflow instead of clipping dense columns'
  );
});

test('route registry, route views, and hash navigation cover every approved route', () => {
  const registry = routeRegistrySource();
  assert.ok(hasRouteSurfaceMarker(), 'route views must expose data-route-view or an equivalent dynamic route-surface marker');

  for (const route of ROUTES) {
    assert.match(
      registry,
      new RegExp(`(?:["']${escapeRegExp(route)}["']|\\b${escapeRegExp(route)}\\b)`, 'i'),
      `route registry is missing #${route}`
    );
    assert.match(
      registry,
      new RegExp(`${escapeRegExp(route)}-view`, 'i'),
      `route registry is missing the #${route} view mapping`
    );
    assert.ok(
      hasStaticRouteNavigation(route) || hasRegistryDrivenNavigation(),
      `#${route} must have a hash-addressable navigation hook`
    );
  }

  assert.match(inlineScripts, /(?:window\.)?addEventListener\(\s*["']hashchange["']/i, 'hashchange must drive route activation');
  assert.match(inlineScripts, /(?:window\.)?location\.hash\b/i, 'the router must read the URL hash');
  assert.match(inlineScripts, /(?:function\s+(?:render|renderRoute|activateRoute|setActiveRoute)|(?:const|let|var)\s+(?:render|renderRoute|activateRoute|setActiveRoute)\s*=)/i, 'the prototype must expose a route activation seam');
});

test('inactive route views use the prototype hidden/visibility semantics', () => {
  routeRegistrySource();
  assertSourceMatches(
    inlineScripts,
    /(?:overviewView|salesPerformanceView|routeView|routeSurface|host)[\s\S]{0,1200}\.hidden\s*=/i,
    'route activation must toggle hidden state on route view surfaces'
  );
  assertSourceMatches(
    inlineScripts,
    /(?:hidden\s*=\s*(?:true|false|!|route)|setAttribute\(\s*["']hidden["'])/i,
    'inactive routes must have an explicit visibility state'
  );
});

test('action-like controls provide local-only feedback through a visible live region', () => {
  const feedbackCandidates = [
    firstTagById('prototypeFeedback'),
    firstTagById('toast'),
    firstTagById('filter-feedback')
  ].filter(Boolean);
  const feedback = feedbackCandidates.find(({ raw }) => (
    /role=["']status["']/i.test(raw)
  ));
  assert.ok(
    feedback || /(?:prototypeFeedback|filterFeedback|#toast|data-(?:prototype|local)-feedback)[\s\S]{0,1200}setAttribute\(\s*["']role["']\s*,\s*["']status["']/i.test(inlineScripts),
    'prototype must expose a feedback-region hook'
  );

  const feedbackMarker = inlineScripts.match(/prototypeFeedback|filterFeedback|toast/i);
  const feedbackSource = feedback?.raw ?? (
    feedbackMarker
      ? inlineScripts.slice(feedbackMarker.index, feedbackMarker.index + 1800)
      : inlineScripts
  );
  assert.match(feedbackSource, /role=["']status["']|setAttribute\(\s*["']role["']\s*,\s*["']status["']/i);
  assert.doesNotMatch(feedbackSource, /\bhidden(?:\s*=\s*["']true["'])?/i, 'local feedback must remain available to users and assistive technology');

  assert.match(
    source,
    /data-(?:prototype-action|local-action)|data-action/i,
    'action-like prototype controls must expose a local action hook'
  );
  assert.match(
    inlineScripts,
    /(?:data-(?:prototype-action|local-action)|data-action)[\s\S]{0,1800}(?:notify|setFeedback|showPrototypeFeedback|textContent|innerText)/i,
    'action-like controls must update local feedback rather than navigate or persist state'
  );
  assert.match(inlineScripts, /(?:notify|setFeedback|showPrototypeFeedback)\s*\(/i, 'a local feedback handler is required');
  assert.match(
    `${visibleText(html)}\n${inlineScripts}`,
    /(?:prototype|local|read-only|sample|ไม่มีการบันทึก|ไม่เปลี่ยนข้อมูล)/i,
    'local feedback copy must disclose the non-persistent prototype boundary'
  );
});

test('inline prototype scripts contain no network, persistence, or protected write API', () => {
  const forbidden = [
    ['fetch()', /\bfetch\s*\(/i],
    ['XMLHttpRequest/XHR', /\b(?:XMLHttpRequest|XHR)\b/i],
    ['WebSocket/EventSource', /\b(?:WebSocket|EventSource)\b/i],
    ['navigator.sendBeacon', /\bnavigator\.sendBeacon\s*\(/i],
    ['google.script.run', /\bgoogle\s*\.\s*script\s*\.\s*run\b/i],
    ['SpreadsheetApp', /\bSpreadsheetApp\b/i],
    ['UrlFetchApp', /\bUrlFetchApp\b/i],
    ['DriveApp', /\bDriveApp\b/i],
    ['supabase', /\bsupabase\b/i],
    ['firebase', /\bfirebase\b/i],
    ['localStorage', /\blocalStorage\b/i],
    ['sessionStorage', /\bsessionStorage\b/i],
    ['indexedDB', /\bindexedDB\b/i],
    ['document.cookie', /\bdocument\.cookie\b/i]
  ];

  for (const [name, pattern] of forbidden) {
    assert.doesNotMatch(inlineScripts, pattern, `prototype script must not reference ${name}`);
  }
});
