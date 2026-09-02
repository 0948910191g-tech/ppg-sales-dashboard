import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const root = process.cwd();
const port = 4173;

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  const requested = decodeURIComponent(url.pathname === '/' ? '/dashboard-reference-prototype.html' : url.pathname);
  const filePath = path.resolve(root, `.${requested}`);

  if (!filePath.startsWith(root)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) throw new Error('Not a file');
    res.writeHead(200, { 'content-type': contentTypes[path.extname(filePath)] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404).end('Not found');
  }
});

await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(5000);
const runtimeErrors = [];
page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`);
});

const routes = [
  ['overview', 'Overview'],
  ['sales-performance', 'Sales Performance'],
  ['products', 'Products'],
  ['marketing-ads', 'Marketing & Ads'],
  ['creators', 'Creators'],
  ['competitors', 'Competitors'],
  ['review', 'Review'],
  ['data-health', 'Data Health'],
  ['data-explorer', 'Data Explorer']
];

async function snapshotState(route) {
  return page.evaluate((expectedRoute) => ({
    expectedRoute,
    href: location.href,
    hash: location.hash,
    titleHeadingCount: document.querySelectorAll('.title-row h1').length,
    titleHeading: document.querySelector('.title-row h1')?.textContent?.trim() || null,
    contentCount: document.querySelectorAll('main.content').length,
    overview: document.querySelector('#overview-view') ? {
      hidden: document.querySelector('#overview-view').hidden,
      connected: document.querySelector('#overview-view').isConnected
    } : null,
    sales: document.querySelector('#sales-performance-view') ? {
      hidden: document.querySelector('#sales-performance-view').hidden,
      connected: document.querySelector('#sales-performance-view').isConnected
    } : null,
    completion: document.querySelector('.ui-completion-view') ? {
      id: document.querySelector('.ui-completion-view').id,
      hidden: document.querySelector('.ui-completion-view').hidden,
      route: document.querySelector('.ui-completion-view').dataset.route || null,
      routeView: document.querySelector('.ui-completion-view').dataset.routeView || null,
      connected: document.querySelector('.ui-completion-view').isConnected
    } : null,
    activeRoutes: [...document.querySelectorAll('[data-route][aria-current="page"]')].map((node) => node.dataset.route),
    navCount: document.querySelectorAll(`button[data-route="${expectedRoute}"]`).length,
    bodyText: document.body?.innerText?.slice(0, 300) || null
  }), route);
}

async function assertRoute(route, headingText) {
  console.log(`route:start ${route}`);
  const nav = page.locator(`button[data-route="${route}"]`).first();
  const completionHost = page.locator('.ui-completion-view');
  await nav.waitFor({ state: 'visible' });
  await nav.click();
  await page.waitForFunction((expected) => location.hash === `#${expected}`, route);
  await page.waitForTimeout(100);

  const state = await snapshotState(route);
  console.log(`route:state ${route} ${JSON.stringify(state)}`);
  assert.equal(state.titleHeadingCount, 1, `${route}: shared top heading must remain mounted; state=${JSON.stringify(state)} errors=${runtimeErrors.join(' | ')}`);
  assert.equal(state.titleHeading?.includes(headingText), true, `${route}: top heading should contain ${headingText}; got ${state.titleHeading}`);
  assert.equal(await nav.getAttribute('aria-current'), 'page', `${route}: nav should be active`);

  if (route === 'overview') {
    assert.equal(await page.locator('#overview-view').isVisible(), true, 'overview should be visible');
    assert.equal(await page.locator('#sales-performance-view').isVisible(), false, 'sales should be hidden on overview');
    assert.equal(await completionHost.isVisible(), false, 'completion host should be hidden on overview');
    return;
  }

  if (route === 'sales-performance') {
    assert.equal(await page.locator('#overview-view').isVisible(), false, 'overview should be hidden on sales');
    assert.equal(await page.locator('#sales-performance-view').isVisible(), true, 'sales should be visible');
    assert.equal(await completionHost.isVisible(), false, 'completion host should be hidden on sales');
    return;
  }

  assert.equal(await page.locator('#overview-view').isVisible(), false, `${route}: overview should be hidden`);
  assert.equal(await page.locator('#sales-performance-view').isVisible(), false, `${route}: sales should be hidden`);
  assert.equal(await completionHost.isVisible(), true, `${route}: completion host should be visible; state=${JSON.stringify(state)} runtime errors=${runtimeErrors.join(' | ')}`);
  assert.equal(await completionHost.getAttribute('data-route'), route, `${route}: completion host should own the route`);
  assert.equal(await completionHost.getAttribute('data-route-view'), route, `${route}: semantic route view should match`);
}

let failed = false;
try {
  await page.goto(`http://127.0.0.1:${port}/dashboard-reference-prototype.html#overview`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(150);

  for (const [route, heading] of routes) {
    await assertRoute(route, heading);
  }

  await assertRoute('marketing-ads', 'Marketing & Ads');
  await page.locator('[data-page-filter="channel"]').selectOption('meta');
  assert.equal(await page.locator('[data-page-filter="channel"]').inputValue(), 'meta', 'Marketing channel filter should remain operable');
  await page.locator('[data-chart-tab="weekly"]').click();
  assert.equal(await page.locator('[data-chart-tab="weekly"]').getAttribute('aria-selected'), 'true', 'Marketing weekly chart tab should become selected');

  await assertRoute('review', 'Review');
  const reviewButton = page.locator('[data-open-signal]').first();
  await reviewButton.click();
  assert.equal(await page.locator('#ui-context-drawer-backdrop').isVisible(), true, 'Review should open context drawer');
  await page.locator('[data-drawer-close]').click();
  assert.equal(await page.locator('#ui-context-drawer-backdrop').isVisible(), false, 'Review drawer should close');

  await assertRoute('data-explorer', 'Data Explorer');
  await page.locator('[data-explorer-tab="chart"]').click();
  assert.equal(await page.locator('[data-explorer-panel="chart"]').isVisible(), true, 'Data Explorer chart tab should render');
  await page.locator('[data-explorer-tab="metadata"]').click();
  assert.equal(await page.locator('[data-explorer-panel="metadata"]').isVisible(), true, 'Data Explorer metadata tab should render');

  await assertRoute('overview', 'Overview');
  await assertRoute('sales-performance', 'Sales Performance');
  await assertRoute('marketing-ads', 'Marketing & Ads');

  assert.deepEqual(runtimeErrors, [], `Dashboard should have no runtime errors:\n${runtimeErrors.join('\n')}`);
  console.log('browser-smoke: all primary routes and core interactions passed');
} catch (error) {
  failed = true;
  const state = await snapshotState('failure').catch(() => null);
  fs.writeFileSync('browser-smoke-state.json', JSON.stringify({ state, runtimeErrors, error: String(error?.stack || error) }, null, 2));
  await page.screenshot({ path: 'browser-smoke-failure.png', fullPage: true }).catch(() => {});
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  if (!failed && fs.existsSync('browser-smoke-state.json')) fs.unlinkSync('browser-smoke-state.json');
}
