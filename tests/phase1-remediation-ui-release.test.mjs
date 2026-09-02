import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const html = fs.readFileSync(new URL('dashboard.html', root), 'utf8');
const releaseDoc = fs.readFileSync(new URL('docs/tickets/release/phase-1-secured-readonly-release-gate.md', root), 'utf8');

function createDashboardRuntime() {
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]).filter(Boolean);
  const createElement = tagName => ({
    tagName,
    className: '',
    innerHTML: '',
    textContent: '',
    children: [],
    appendChild(node) {
      this.children.push(node);
      this.innerHTML += node.innerHTML || '';
    },
    setAttribute() {},
    addEventListener() {},
    click() {}
  });
  const context = {
    console,
    window: {},
    document: {
      addEventListener() {},
      getElementById() { return null; },
      querySelectorAll() { return []; },
      createElement
    },
    alert() {},
    location: { reload() {} },
    URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} },
    Blob: class Blob {},
    Chart: class Chart {}
  };
  vm.runInNewContext(scripts[scripts.length - 1], context);
  return expression => {
    vm.runInNewContext(`this.__dashboardTestResult = (${expression})`, context);
    const value = context.__dashboardTestResult;
    return value === undefined ? value : JSON.parse(JSON.stringify(value));
  };
}

test('Sheet-backed labels have a text-safe rendering seam and runtime hostile values are escaped', () => {
  assert.match(html, /function phase1SafeText\(/);
  assert.match(html, /function phase1EscapeHtml\(/);
  assert.match(html, /phase1EscapeHtml\(p\.name/);
  assert.match(html, /phase1EscapeHtml\(p\.sku/);
  assert.match(html, /phase1EscapeHtml\(a\.campaign/);
  assert.match(html, /phase1EscapeHtml\(t\.source/);
  assert.match(html, /phase1EscapeHtml\(c\.name/);
  assert.match(html, /phase1SafeText\(item && item\.source/);

  const evaluate = createDashboardRuntime();
  const rendered = evaluate(`(() => {
    const productBody = {
      innerHTML: '',
      children: [],
      appendChild(node) {
        this.children.push(node);
        this.innerHTML += node.innerHTML || '';
      }
    };
    const nodes = {
      productTableBody: productBody,
      productScopeNotice: { textContent: '' },
      productPaginationControls: { innerHTML: '' },
      productSearchInput: { value: '' }
    };
    document.getElementById = id => nodes[id] || null;
    phase1Mode = 'demo';
    currentPlatformFilter = 'all';
    filteredProductPlatform = 'all';
    currentProdList = [{
      name: '<img src=x onerror=alert(1)>',
      sku: 'DEMO-SKU-001',
      platform: 'shopee',
      orders: null,
      gmv: null
    }];
    renderProductsTable();
    return productBody.innerHTML;
  })()`);
  assert.match(rendered, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(rendered, /<img\b/i);
});

test('source states distinguish secured model, server snapshot, local preview, and unavailable data', () => {
  assert.match(html, /Secured Read Model/);
  assert.match(html, /Historical Snapshot/);
  assert.match(html, /Local Static Preview/);
  assert.match(html, /Secured Read Model unavailable/);
  assert.match(html, /ไม่ใช่ข้อมูล protected/);
  assert.match(html, /phase1ActivateServerSnapshot\(/);
  assert.match(html, /phase1ActivateUnavailable\(/);
  assert.doesNotMatch(html, /phase1FallbackMeta\s*=\s*\{[\s\S]{0,180}source:\s*['"]dashboard\.html/);
});

test('Data Through is presented as coverage and not as sync freshness', () => {
  assert.match(html, /Data Through \(coverage\)/);
  assert.match(html, /ไม่ใช่เวลา sync/);
  assert.doesNotMatch(html, /last synced|lastSync|sync timestamp/i);
});

test('comparison coverage reasons are visibly separated for current and previous periods', () => {
  assert.match(html, /id="comparisonCoverageStatus"/);
  assert.match(html, /id="comparisonCurrentCoverageReason"/);
  assert.match(html, /id="comparisonPreviousCoverageReason"/);
  assert.match(html, /phase1ComparisonCoverageText\('current'\)/);
  assert.match(html, /phase1ComparisonCoverageText\('previous'\)/);
  assert.match(html, /MISSING_DATE/);
  assert.match(html, /MISSING_CONFIRMED_GMV/);
  assert.match(html, /MISSING_PLATFORM/);
});

test('release evidence records the remediation rerun and approval-gated smoke test', () => {
  assert.match(releaseDoc, /## Remediation rerun evidence/);
  assert.match(releaseDoc, /backend\/tests\/phase1-remediation-boundary\.test\.mjs/);
  assert.match(releaseDoc, /backend\/tests\/phase1-remediation-data\.test\.mjs/);
  assert.match(releaseDoc, /node --test backend\/tests\/\*\.test\.mjs tests\/\*\.test\.mjs/);
  assert.match(releaseDoc, /### Deployable Web App smoke test/);
  assert.match(releaseDoc, /approval-gated, not run locally/);
  assert.match(releaseDoc, /ห้าม deploy/);
  assert.match(releaseDoc, /clasp push/);
  assert.match(releaseDoc, /production Sheet/);
  assert.match(releaseDoc, /PENDING_APPROVAL/);
});
