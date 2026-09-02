import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const prototypeUrl = new URL('../dashboard-reference-prototype.html', import.meta.url);
const html = fs.readFileSync(prototypeUrl, 'utf8');
const inlineScript = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1])
  .join('\n');
const source = `${html}\n${inlineScript}`;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesAny(value, patterns) {
  return patterns.some((pattern) => pattern.test(value));
}

function assertMatchesAny(value, patterns, message) {
  assert.ok(matchesAny(value, patterns), message);
}

function routeSurfacePatterns(route) {
  const token = escapeRegExp(route);
  return [
    new RegExp(
      `<(?:main|section|div|aside|article|template)\\b[^>]*(?:\\bid|data-(?:route|route-view|view|page|screen))=["']${token}(?:-view)?["']`,
      'i'
    ),
    new RegExp(
      `(?:\\.id\\s*=\\s*|\\.dataset\\.(?:route|routeView)\\s*=\\s*|setAttribute\\(\\s*["'](?:id|data-route|data-route-view|data-view)["']\\s*,\\s*)["']${token}(?:-view)?["']`,
      'i'
    )
  ];
}

function routeNavPatterns(route) {
  const token = escapeRegExp(route);
  return [
    new RegExp(
      `<(?:a|button)\\b[^>]*(?:href|data-(?:route|route-target|view|nav-target)|aria-controls)=["']#?${token}(?:-view)?["']`,
      'i'
    ),
    new RegExp(
      `<(?:a|button)\\b[^>]*(?:onclick|data-route-handler)=[^>]*(?:#["']?${token}|["']${token}["'])`,
      'i'
    )
  ];
}

function routeDeepLinkPatterns(route) {
  const token = escapeRegExp(route);
  return [
    new RegExp(`(?:href|data-nav-target)=["']#${token}["']`, 'i'),
    new RegExp(`data-route-target=["']${token}["']`, 'i'),
    new RegExp(`(?:location\\.hash|hashchange)[\\s\\S]{0,600}(?:#${token}\\b|\\b${token}\\b)`, 'i')
  ];
}

function routeMarkerIndexes(route) {
  const indexes = [];
  for (const pattern of routeSurfacePatterns(route)) {
    const match = pattern.exec(source);
    if (match) indexes.push(match.index);
  }
  return indexes;
}

function routeContext(route) {
  const indexes = routeMarkerIndexes(route);
  if (!indexes.length) return '';

  const start = Math.min(...indexes);
  const otherRouteIndexes = Object.keys(ROUTES)
    .filter((candidate) => candidate !== route)
    .flatMap((candidate) => routeMarkerIndexes(candidate))
    .filter((index) => index > start);
  const end = otherRouteIndexes.length
    ? Math.min(...otherRouteIndexes)
    : Math.min(source.length, start + 100000);

  // Include the assignment/template prefix for routes created by inline JS.
  return source.slice(Math.max(0, start - 1800), end);
}

function contextAround(value, pattern, radius = 12000) {
  const match = pattern.exec(value);
  if (!match) return '';
  return value.slice(Math.max(0, match.index - 800), match.index + radius);
}

function firstMatchingContext(value, patterns, radius = 12000) {
  for (const pattern of patterns) {
    const context = contextAround(value, pattern, radius);
    if (context) return context;
  }
  return '';
}

const ROUTES = {
  review: 'Review / Attention Queue',
  'review-walkthrough': 'Review Walkthrough',
  'data-health': 'Data Health',
  'data-explorer': 'Data Explorer'
};

const REVIEW_FILTER_PATTERNS = {
  severity: [
    /<(?:select|input|button)\b[^>]*(?:id|name)=["'][^"']*(?:review[-_ ]*)?(?:severity|priority)[^"']*["']/i,
    /<(?:select|input|button)\b[^>]*data-(?:review-)?filter=["'](?:severity|priority)["']/i,
    /<(?:select|input|button)\b[^>]*aria-label=["'][^"']*(?:severity|priority)[^"']*["']/i
  ],
  source: [
    /<(?:select|input|button)\b[^>]*(?:id|name)=["'][^"']*(?:review[-_ ]*)?source[^"']*["']/i,
    /<(?:select|input|button)\b[^>]*data-(?:review-)?filter=["']source["']/i,
    /<(?:select|input|button)\b[^>]*aria-label=["'][^"']*(?:signal )?source[^"']*["']/i
  ]
};

const REVIEW_DETAIL_PATTERNS = [
  /<(?:aside|dialog|section|div)\b[^>]*(?:id|data-(?:review-)?(?:detail|drawer))=["'][^"']*(?:review|signal|context)?[-_ ]?(?:detail|drawer|pane)[^"']*["']/i,
  /<(?:aside|dialog|section|div)\b[^>]*(?:id|class|data-[\w-]+)=["'][^"']*(?:review|signal|context|drawer)[-_ ]?(?:detail|drawer|pane)[^"']*["']/i,
  /<(?:aside|dialog|section|div)\b[^>]*data-(?:context|signal|review|drawer)[-_ ]?(?:detail|drawer|pane)(?:=["'][^"']*["'])?/i,
  /\b(?:reviewDetailDrawer|reviewDetailPane|signalDetailDrawer|contextDrawer)\b/i
];

const WALKTHROUGH_STEPS = [
  ['signal', /\bSignal\b/i],
  ['context', /\bContext\b/i],
  ['evidence', /\bEvidence\b/i],
  ['insight', /\bInsight\b/i],
  ['next-step', /\bNext[\s-]+Step\b/i]
];

for (const [route, label] of Object.entries(ROUTES)) {
  test(`${label} exposes a hash route, navigation hook, and named view surface`, () => {
    assertMatchesAny(
      source,
      routeSurfacePatterns(route),
      `${route} should expose a named section/view hook (id/data-route or inline assignment)`
    );
    assertMatchesAny(
      html,
      routeNavPatterns(route),
      `${route} should expose a route-bearing link or button`
    );
    assertMatchesAny(
      source,
      routeDeepLinkPatterns(route),
      `${route} should be reachable through #${route} or the hash router`
    );

    const view = routeContext(route);
    assert.ok(view, `${route} should have bounded route content`);
    assertMatchesAny(
      view,
      [
        /<(?:main|section|div|article|h1|h2)\b/i,
        /(?:render|show|open|navigate)[A-Za-z]*(?:Route|View|Page)/i
      ],
      `${route} should expose route content rather than only a navigation label`
    );
  });
}

test('Review exposes severity/source filters, summaries, a semantic signal table, and local queue controls', () => {
  const review = routeContext('review');
  assert.ok(review, 'Review route context is required before checking its controls');

  for (const [filterName, patterns] of Object.entries(REVIEW_FILTER_PATTERNS)) {
    assertMatchesAny(
      review,
      patterns,
      `Review should expose a ${filterName} filter using a labelled control or data-review-filter hook`
    );
  }

  for (const level of ['high', 'medium', 'low']) {
    assertMatchesAny(
      review,
      [
        new RegExp(`data-(?:review-)?(?:summary|severity|priority)=["'][^"']*${level}[^"']*["']`, 'i'),
        new RegExp(`\\b${level}\\b`, 'i')
      ],
      `Review should visibly summarize ${level} severity`
    );
  }

  assertMatchesAny(
    review,
    [
      /<(?:table|div|section)\b[^>]*(?:id|data-[\w-]+|aria-label|class)=["'][^"']*(?:review|attention|signal)[^"']*(?:table|queue|list|grid)?[^"']*["']/i,
      /<table\b/i
    ],
    'Review should expose a signal table/queue region'
  );
  assertMatchesAny(
    review,
    [/<table\b/i, /role=["'](?:table|grid)["']/i],
    'Review signal rows should use table or grid semantics'
  );

  for (const [name, patterns] of Object.entries({
    sort: [
      /data-(?:review-)?sort(?:-by)?(?:=["'][^"']*["'])?/i,
      /<(?:button|select)\b[^>]*(?:id|aria-label)=["'][^"']*sort[^"']*["']/i,
      /aria-sort=["'][^"']+["']/i
    ],
    columns: [
      /data-(?:review-)?columns?(?:=["'][^"']*["'])?/i,
      /<(?:button|select)\b[^>]*(?:id|aria-label)=["'][^"']*columns?[^"']*["']/i,
      /column options?/i
    ],
    pagination: [
      /data-(?:review-)?pagination(?:=["'][^"']*["'])?/i,
      /<(?:nav|div|button)\b[^>]*(?:id|aria-label|class)=["'][^"']*pag(?:e|ination)[^"']*["']/i,
      /(?:Previous|Next|หน้าก่อน|ถัดไป)/i
    ]
  })) {
    assertMatchesAny(review, patterns, `Review should expose ${name} controls`);
  }

  assertMatchesAny(
    inlineScript,
    [
      /(?:review|signal|attention)[\s\S]{0,5000}(?:addEventListener\(\s*["'](?:change|click)["']|onchange|onclick)/i,
      /(?:filterReview|sortReview|paginateReview|renderReview|reviewSignals)/i
    ],
    'Review filters and queue controls should have local interaction hooks'
  );
});

test('Review makes a signal selectable and connects it to a labelled detail drawer', () => {
  const review = routeContext('review');
  assert.ok(review, 'Review route context is required before checking signal selection');

  assertMatchesAny(
    review,
    [
      /<(?:button|tr|article|li|div)\b[^>]*(?:data-(?:review-)?signal(?:-id)?|data-signal-id)(?:=["'][^"']*["'])?/i,
      /<(?:button|tr|article|li|div)\b[^>]*role=["']button["'][^>]*>/i
    ],
    'Review should expose a keyboard-selectable signal row/control'
  );
  assertMatchesAny(
    review,
    [
      /data-(?:review-)?signal(?:-id)?=["'][^"']+["']/i,
      /data-signal-id=["'][^"']+["']/i,
      /aria-controls=["'][^"']*(?:detail|drawer|context)[^"']*["']/i
    ],
    'A Review signal should carry a stable signal/selection hook'
  );
  assertMatchesAny(
    inlineScript,
    [
      /(?:selectReviewSignal|setSelected(?:Review)?Signal|open(?:Review|Signal|Context)(?:Detail|Drawer)?)/i,
      /(?:data-(?:review-)?signal|data-signal-id)[\s\S]{0,5000}(?:addEventListener\(\s*["'](?:click|keydown)["']|matches\(\s*["'][^"']*signal)/i
    ],
    'Review signal selection should have a local click/keyboard handler'
  );

  assertMatchesAny(
    source,
    REVIEW_DETAIL_PATTERNS,
    'Review should expose a Context/Signal detail drawer or pane hook'
  );
  const detail = firstMatchingContext(source, REVIEW_DETAIL_PATTERNS) || review;
  assertMatchesAny(
    detail,
    [/<(?:aside|dialog)\b/i, /role=["']dialog["']/i],
    'The selected-signal detail surface should be an aside or dialog'
  );
  assertMatchesAny(
    detail,
    [/aria-labelledby=["'][^"']+["']/i, /aria-label=["'][^"']*(?:detail|drawer|context|signal)[^"']*["']/i],
    'The selected-signal detail surface should be labelled for assistive technology'
  );
  for (const field of ['source', 'metric', 'period', 'platform', 'coverage']) {
    assert.match(detail, new RegExp(`\\b${field}\\b`, 'i'), `Detail drawer should expose ${field} context`);
  }
  assertMatchesAny(
    review,
    [
      /aria-controls=["'][^"']*(?:detail|drawer|context)[^"']*["']/i,
      /data-(?:review-)?action=["'](?:open-context|open-detail|review|walkthrough)["']/i,
      /(?:Open Context|Review Signal|เปิด Context|ดูรายละเอียด)/i
    ],
    'The selected signal should have an explicit detail-drawer entry point'
  );
});

test('Review and Review Walkthrough expose Escape and focus-restoration hooks for overlays', () => {
  const review = routeContext('review');
  const walkthrough = routeContext('review-walkthrough');
  assert.ok(review, 'Review route context is required for overlay focus checks');
  assert.ok(walkthrough, 'Review Walkthrough route context is required for overlay focus checks');

  assert.match(
    inlineScript,
    /(?:event\.)?key\s*===?\s*["']Escape["']/i,
    'Overlay behavior should listen for Escape'
  );
  assertMatchesAny(
    inlineScript,
    [
      /(?:restore|return)(?:Review|Signal|Drawer|Walkthrough)?Focus/i,
      /(?:previous|last)(?:ActiveElement|ReviewTrigger|SignalTrigger|Focus)[\s\S]{0,700}\.focus\s*\(/i,
      /activeElement[\s\S]{0,700}(?:restore|return)[\s\S]{0,300}\.focus\s*\(/i
    ],
    'Closing a review overlay should restore focus to the triggering signal/control'
  );

  const escapeWindows = [
    contextAround(inlineScript, /key\s*===?\s*["']Escape["']/i, 1400),
    contextAround(inlineScript, /(?:restore|return)(?:Review|Signal|Drawer|Walkthrough)?Focus/i, 1400)
  ].join('\n');
  assertMatchesAny(
    escapeWindows,
    [
      /(?:review|signal|context|drawer|walkthrough|modal)/i,
      /classList\.(?:add|remove|toggle)/i
    ],
    'Escape/focus behavior should be tied to the review drawer or walkthrough, not an unrelated key handler'
  );

  assertMatchesAny(
    `${review}\n${source}`,
    [
      /id=["'][^"']*(?:detail|drawer|context)[^"']*["'][^>]*[^>]*aria-(?:labelledby|describedby|modal)/i,
      /role=["']dialog["']/i
    ],
    'Review overlay should expose a labelled dialog/drawer hook'
  );
  assertMatchesAny(
    walkthrough,
    [
      /<(?:button|a)\b[^>]*(?:data-(?:walkthrough-)?action|aria-label)=["'][^"']*(?:close|back|กลับ|ปิด)[^"']*["']/i,
      /role=["']tablist["']/i
    ],
    'Walkthrough should expose keyboard-operable close/back or step-navigation controls'
  );
});

test('Review Walkthrough carries the selected signal through five read-only steps', () => {
  const walkthrough = routeContext('review-walkthrough');
  assert.ok(walkthrough, 'Review Walkthrough route context is required');

  for (const [step, labelPattern] of WALKTHROUGH_STEPS) {
    assertMatchesAny(
      walkthrough,
      [
        new RegExp(`data-(?:review-)?walkthrough-step=["']${escapeRegExp(step)}["']`, 'i'),
        new RegExp(`data-step=["']${escapeRegExp(step)}["']`, 'i'),
        new RegExp(`(?:id|class)=["'][^"']*(?:walkthrough|review)[-_ ]*${escapeRegExp(step)}[^"']*["']`, 'i'),
        labelPattern
      ],
      `Review Walkthrough should expose the ${step} step`
    );
  }

  const machineStepHooks = [
    ...walkthrough.matchAll(/data-(?:review-)?walkthrough-step=["']([^"']+)["']/gi),
    ...walkthrough.matchAll(/data-step=["']([^"']+)["']/gi)
  ].map((match) => match[1].toLowerCase());
  if (machineStepHooks.length) {
    assert.ok(
      new Set(machineStepHooks).size >= 5,
      'Walkthrough should expose five distinct machine-readable step hooks'
    );
  } else {
    assert.match(walkthrough, /(?:five|5)[ -]?step/i, 'Walkthrough should disclose that the path has five steps');
  }

  assertMatchesAny(
    walkthrough,
    [
      /role=["']tablist["']/i,
      /role=["']tab["']/i,
      /<(?:button|a)\b[^>]*(?:data-(?:review-)?walkthrough-step|aria-controls)=["']/i
    ],
    'Walkthrough steps should be keyboard-operable tabs or buttons'
  );
  assertMatchesAny(
    walkthrough,
    [/aria-(?:current|selected)=["'](?:step|true|false)["']/i, /data-state=["'](?:current|complete|future)["']/i, /(?:active|complete|current|future)[-_ ]?step/i],
    'Walkthrough should communicate current/completed/future step state'
  );

  const flowSource = `${routeContext('review')}\n${walkthrough}\n${inlineScript}`;
  assertMatchesAny(
    flowSource,
    [
      /selected(?:Review)?Signal[\s\S]{0,5000}(?:walkthrough|review-walkthrough)/i,
      /(?:walkthrough|review-walkthrough)[\s\S]{0,5000}selected(?:Review)?Signal/i,
      /open(?:Review)?Walkthrough\s*\(/i
    ],
    'The selected Review Signal should be handed off to Review Walkthrough'
  );
  for (const contextField of ['source', 'metric', 'period', 'platform']) {
    assert.match(
      walkthrough,
      new RegExp(`\\b${contextField}\\b`, 'i'),
      `Walkthrough should preserve selected-signal ${contextField} context`
    );
  }
  assert.match(
    walkthrough,
    /(?:read[- ]only|non[- ]persistent|static sample|prototype|ไม่[^<]{0,80}(?:บันทึก|ถาวร)|ยังไม่สร้าง[^<]{0,40}(?:Action|งาน))/i,
    'Walkthrough should disclose its read-only/non-persistent prototype boundary'
  );
  assert.doesNotMatch(
    walkthrough,
    /\b(?:create|save|persist|submit)(?:Action|Task|Review)?\s*\(/i,
    'Walkthrough must not expose a persistent action creator'
  );
});

test('Data Health exposes source-health and coverage semantics without conflating status concepts', () => {
  const health = routeContext('data-health');
  assert.ok(health, 'Data Health route context is required');

  const regions = [
    {
      name: 'Source Health overview',
      patterns: [
        /data-(?:data-)?health-[^= ]*source[^= ]*/i,
        /(?:id|class|data-[\w-]+)=["'][^"']*source[-_ ]?health[^"']*["']/i,
        /Source Health(?: Overview)?/i
      ]
    },
    {
      name: 'Coverage Heatmap',
      patterns: [
        /data-(?:data-)?health-[^= ]*coverage[^= ]*/i,
        /(?:id|class|data-[\w-]+)=["'][^"']*(?:coverage[-_ ]?heatmap|heatmap)[^"']*["']/i,
        /Coverage Heatmap/i
      ]
    },
    {
      name: 'Data Quality Issues',
      patterns: [
        /data-(?:data-)?health-[^= ]*(?:quality|issue)[^= ]*/i,
        /(?:id|class|data-[\w-]+)=["'][^"']*(?:data[-_ ]?quality|quality[-_ ]?issues)[^"']*["']/i,
        /Data Quality Issues?/i
      ]
    },
    {
      name: 'Partial Coverage',
      patterns: [
        /data-(?:data-)?health-[^= ]*partial[^= ]*/i,
        /(?:id|class|data-[\w-]+)=["'][^"']*partial[-_ ]?coverage[^"']*["']/i,
        /Partial Coverage/i
      ]
    },
    {
      name: 'Historical Snapshot details',
      patterns: [
        /data-(?:data-)?health-[^= ]*snapshot[^= ]*/i,
        /(?:id|class|data-[\w-]+)=["'][^"']*historical[-_ ]?snapshot[^"']*["']/i,
        /Historical Snapshot(?: Details)?/i
      ]
    },
    {
      name: 'status legend',
      patterns: [
        /data-(?:data-)?health-[^= ]*legend[^= ]*/i,
        /(?:id|class|data-[\w-]+)=["'][^"']*status[-_ ]?legend[^"']*["']/i,
        /status legend/i
      ]
    }
  ];
  for (const region of regions) {
    assertMatchesAny(health, region.patterns, `Data Health should expose ${region.name}`);
  }

  for (const statusConcept of ['freshness', 'availability', 'coverage', 'error']) {
    assert.match(
      health,
      new RegExp(`\\b${statusConcept}\\b`, 'i'),
      `Data Health should label ${statusConcept} separately`
    );
  }
  assert.match(health, /Data Through/i, 'Data Health should expose Data Through as coverage metadata');
  assert.match(health, /Historical Snapshot/i, 'Data Health should label snapshot state explicitly');
  assert.match(
    health,
    /(?:unavailable|partial coverage|missing coverage|source error|ไม่พร้อม|ไม่มีข้อมูล)/i,
    'Data Health should explain unavailable/partial/error coverage'
  );
  assertMatchesAny(
    health,
    [
      /<(?:table|div|section)\b[^>]*(?:data-source|source-family|source-health|health-source|data-[\w-]+=["'][^"']*source)/i,
      /role=["'](?:table|grid)["']/i
    ],
    'Data Health source health should use a semantic row/table surface'
  );
  assertMatchesAny(
    health,
    [
      /<(?:button|a)\b[^>]*(?:data-(?:source|health|source-row)[-_]?(?:detail|row)?|aria-controls=["'][^"']*(?:source|health)[^"']*)/i,
      /<(?:button|a)\b[^>]*data-source=["'][^"']+[^>]*>/i,
      /role=["']button["'][^>]*(?:source|health)/i
    ],
    'Data Health should expose a keyboard-operable source detail affordance'
  );
  assert.doesNotMatch(
    health,
    /<(?:button|a)\b[^>]*(?:data-action|id|aria-label)=["'][^"']*(?:refresh|sync)[^"']*["']/i,
    'Data Health must not present a fake refresh/sync action'
  );
});

test('Data Explorer exposes scoped controls, tabs, a paginated table, metadata, and a CSV prototype notice', () => {
  const explorer = routeContext('data-explorer');
  assert.ok(explorer, 'Data Explorer route context is required');

  const controls = {
    'source family': [
      /<(?:select|input|button)\b[^>]*(?:id|name)=["'][^"']*(?:source[-_ ]?family|source)[^"']*["']/i,
      /<(?:select|input|button)\b[^>]*data-(?:explorer-)?(?:source|filter)=["'][^"']*(?:source|family)[^"']*["']/i,
      /<(?:select|input|button|div)\b[^>]*data-(?:explorer-)?control=["']source[-_ ]?family["']/i,
      /<(?:select|input|button|div)\b[^>]*role=["']combobox["'][^>]*(?:source[-_ ]?family|source)/i
    ],
    metric: [
      /<(?:select|input|button)\b[^>]*(?:id|name)=["'][^"']*metric[^"']*["']/i,
      /<(?:select|input|button)\b[^>]*data-(?:explorer-)?metric=["'][^"']*["']/i,
      /<(?:select|input|button|div)\b[^>]*data-(?:explorer-)?control=["']metric["']/i,
      /<(?:select|input|button|div)\b[^>]*role=["']combobox["'][^>]*metric/i
    ],
    platform: [
      /<(?:select|input|button)\b[^>]*(?:id|name)=["'][^"']*platform[^"']*["']/i,
      /<(?:select|input|button)\b[^>]*data-(?:explorer-)?platform=["'][^"']*["']/i,
      /<(?:select|input|button|div)\b[^>]*data-(?:explorer-)?control=["']platform["']/i,
      /<(?:select|input|button|div)\b[^>]*role=["']combobox["'][^>]*platform/i
    ],
    granularity: [
      /<(?:select|input|button)\b[^>]*(?:id|name)=["'][^"']*granular[^"']*["']/i,
      /<(?:select|input|button)\b[^>]*data-(?:explorer-)?granular(?:ity)?=["'][^"']*["']/i,
      /<(?:select|input|button|div)\b[^>]*data-(?:explorer-)?control=["']granular(?:ity)?["']/i,
      /<(?:select|input|button|div)\b[^>]*role=["']combobox["'][^>]*granular/i
    ],
    date: [
      /<(?:input|select|button)\b[^>]*type=["']date["']/i,
      /<(?:input|select|button)\b[^>]*(?:id|name|data-[\w-]+)=["'][^"']*(?:date|period|from|to)[^"']*["']/i,
      /<(?:input|select|button|div)\b[^>]*data-(?:explorer-)?control=["'](?:date|period)["']/i,
      /<(?:input|select|button|div)\b[^>]*role=["']combobox["'][^>]*(?:date|period)/i
    ]
  };
  for (const [name, patterns] of Object.entries(controls)) {
    assertMatchesAny(explorer, patterns, `Data Explorer should expose a ${name} control`);
  }
  assertMatchesAny(
    inlineScript,
    [
      /(?:data[-_ ]?explorer|explorerView|explorerState)[\s\S]{0,1800}(?:addEventListener\(\s*["'](?:change|click)["']|onchange|onclick)/i,
      /(?:filter|select|render)(?:Explorer|DataExplorer)/i
    ],
    'Data Explorer controls should have local interaction hooks'
  );

  assertMatchesAny(
    explorer,
    [/role=["']tablist["']/i, /data-(?:explorer-)?tabs?=["']/i, /class=["'][^"']*tabs?[^"']*["']/i],
    'Data Explorer should expose a tablist'
  );
  for (const tab of ['table', 'chart', 'metadata']) {
    assertMatchesAny(
      explorer,
      [
        new RegExp(`data-(?:explorer-)?tab=["']${tab}["']`, 'i'),
        new RegExp(`<(?:button|a|div)\\b[^>]*(?:role=["']tab["'][^>]*>|data-(?:explorer-)?tab=["']${tab}["'][^>]*>)[^<]*${tab}`, 'i'),
        new RegExp(`<(?:button|a)\\b[^>]*>[^<]*${tab}[^<]*<`, 'i')
      ],
      `Data Explorer should expose the ${tab} tab`
    );
  }
  assertMatchesAny(
    explorer,
    [
      /role=["']tab["'][^>]*aria-(?:selected|controls)/i,
      /<(?:button|a)\b[^>]*(?:data-(?:explorer-)?tab|aria-controls)=["']/i
    ],
    'Data Explorer tabs should be keyboard-operable and stateful'
  );

  assertMatchesAny(
    explorer,
    [
      /<table\b[^>]*(?:id|data-[\w-]+|aria-label)=["'][^"']*(?:explorer|data|grid|table)[^"']*["']/i,
      /role=["']grid["']/i,
      /data-(?:explorer-)?(?:table|grid)/i
    ],
    'Data Explorer should expose a data table/grid'
  );
  assertMatchesAny(
    explorer,
    [/tabindex=["']0["'][^>]*aria-label=["']/i, /aria-label=["'][^"']*(?:data|explorer|grid|table)[^"']*["']/i],
    'Data Explorer table/grid should be labelled and keyboard-focusable'
  );
  for (const [name, patterns] of Object.entries({
    pagination: [
      /data-(?:explorer-)?pagination(?:=["'][^"']*["'])?/i,
      /(?:id|class|aria-label)=["'][^"']*pag(?:e|ination)[^"']*["']/i,
      /(?:Previous|Next|หน้าก่อน|ถัดไป)/i
    ],
    sorting: [
      /data-(?:explorer-)?sort(?:-by)?(?:=["'][^"']*["'])?/i,
      /aria-sort=["'][^"']+["']/i,
      /(?:id|aria-label)=["'][^"']*sort[^"']*["']/i
    ],
    columns: [
      /data-(?:explorer-)?columns?(?:=["'][^"']*["'])?/i,
      /(?:id|aria-label)=["'][^"']*columns?[^"']*["']/i,
      /column options?/i
    ]
  })) {
    assertMatchesAny(explorer, patterns, `Data Explorer should expose ${name} controls`);
  }

  assertMatchesAny(
    explorer,
    [/field descriptions?/i, /metadata/i, /คำอธิบาย(?:ฟิลด์|ข้อมูล)/i],
    'Data Explorer should describe fields in its Metadata view'
  );
  assertMatchesAny(
    explorer,
    [/Read Model/i, /source availability/i, /availability/i],
    'Data Explorer should disclose source availability/read-model semantics'
  );
  assertMatchesAny(
    explorer,
    [/fallback/i, /Historical Snapshot/i, /unavailable/i, /ไม่มีข้อมูล/i],
    'Data Explorer should explain fallback or unavailable coverage'
  );

  const csvWindow = contextAround(explorer, /CSV/i, 900) || explorer;
  assert.match(explorer, /CSV/i, 'Data Explorer should mention CSV explicitly');
  assertMatchesAny(
    csvWindow,
    [
      /(?:prototype|static|disabled|notice|unavailable|not available|ยังไม่พร้อม|ตัวอย่าง|อ่านอย่างเดียว)/i,
      /data-(?:explorer-)?csv(?:-notice)?/i,
      /aria-disabled=["']true["']/i
    ],
    'CSV should remain a disabled/prototype notice until an approved source exists'
  );
  assert.doesNotMatch(
    explorer,
    /(?:URL\.createObjectURL|new\s+Blob\s*\(|downloadCsv|exportCsv|download=["'])/i,
    'Data Explorer CSV notice must not be wired to a real export implementation'
  );
});

test('UI-06 through UI-10 remain a local read-only prototype with no write/import/backend/direct-Sheet APIs', () => {
  const forbiddenBrowserApis = [
    /\bfetch\s*\(/i,
    /\bXMLHttpRequest\b/i,
    /\b(?:axios|ky|superagent)\s*\(/i,
    /\b(?:WebSocket|EventSource)\s*\(/i,
    /\bnavigator\.sendBeacon\s*\(/i,
    /\bgoogle\s*\.\s*script\s*\.\s*run\b/i,
    /\bgoogle\s*\.\s*visualization\b/i,
    /\b(?:SpreadsheetApp|DriveApp|UrlFetchApp)\b/i,
    /\b(?:getActiveSpreadsheet|getSheetByName|openById|getRange|getDataRange|setValues|appendRow|deleteRow|insertRow)\s*\(/i,
    /\bPPG_(?:GOOGLE|SPREADSHEET)_SHEET_ID\b/i,
    /(?:docs\.google\.com\/spreadsheets|sheets\.googleapis\.com)/i,
    /\b(?:supabase|firebase)\b/i,
    /(?:https?:\/\/|["'`])[^"'`\n]*(?:\/api(?:\/|["'`])|\/backend(?:\/|["'`]))/i,
    /\b(?:method|httpMethod)\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i,
    /\.open\(\s*["'](?:POST|PUT|PATCH|DELETE)["']/i,
    /\b(?:import|upload)(?:Data|File|Csv|Rows|Source|Sheet)?\s*\(/i,
    /\b(?:create|update|delete)(?:Action|Task|Record|Row|Data|Source|Import)\b/i,
    /\b(?:localStorage|sessionStorage|indexedDB|document\.cookie)\b/i
  ];

  for (const forbidden of forbiddenBrowserApis) {
    assert.doesNotMatch(inlineScript, forbidden, `prototype must not expose ${forbidden}`);
  }
  assert.doesNotMatch(html, /<input\b[^>]*type=["']file["']/i, 'prototype must not expose an import/upload input');
  assert.doesNotMatch(html, /<form\b[^>]*(?:action|method)=["']/i, 'prototype must not expose a write/import form');
  assert.doesNotMatch(
    html,
    /(?:onclick|data-action|aria-label)=["'][^"']*(?:import|upload|write|save|create|update|delete)[^"']*["']/i,
    'prototype must not expose a write/import action control'
  );
});

test('rendered Review and Data Explorer routes preserve local filter state and expose the full Explorer scope', () => {
  const actualReview = contextAround(inlineScript, /function\s+review\s*\(/i, 10000);
  const actualExplorer = contextAround(inlineScript, /function\s+dataExplorer\s*\(/i, 10000);

  assert.match(
    actualExplorer,
    /data-page-filter=["']platform["'][\s\S]{0,160}aria-label=["']Platform["']/i,
    'the rendered Data Explorer route must include a Platform control, not only the hidden contract template'
  );
  assert.match(
    actualExplorer,
    /data-page-filter=["']date["'][\s\S]{0,160}aria-label=["']Date["']/i,
    'the rendered Data Explorer route must include a Date control, not only the hidden contract template'
  );
  assert.match(
    actualReview,
    /completionFilterValues\.severity[\s\S]{0,100}\|\|\s*["']all["']/i,
    'Review filtering must read durable local state instead of the route DOM that render replaces'
  );
  assert.match(
    inlineScript,
    /completionFilterValues\[control\.dataset\.pageFilter\]\s*=\s*control\.value/i,
    'route filters must capture the selected value before re-rendering'
  );
  assert.match(
    inlineScript,
    /querySelectorAll\(\s*["']\[data-page-filter\]["']\s*\)[\s\S]{0,400}completionFilterValues\[filter\][\s\S]{0,160}control\.value/i,
    'new route markup must restore the selected value after it is rendered again'
  );
});
