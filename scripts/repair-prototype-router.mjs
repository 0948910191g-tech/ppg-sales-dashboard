import fs from 'node:fs';

const file = 'dashboard-reference-prototype.html';
let html = fs.readFileSync(file, 'utf8');

const oldRenderStart = `    const renderRoute = () => {\n      const isSalesRoute = window.location.hash === '#sales-performance';\n      overviewView.hidden = isSalesRoute;\n      salesPerformanceView.hidden = !isSalesRoute;`;
const newRenderStart = `    const LEGACY_ROUTES = new Set(['overview', 'sales-performance']);\n    const renderRoute = () => {\n      const route = window.location.hash.slice(1) || 'overview';\n      if (!LEGACY_ROUTES.has(route)) return;\n      const isSalesRoute = route === 'sales-performance';\n      overviewView.hidden = isSalesRoute;\n      salesPerformanceView.hidden = !isSalesRoute;`;

const oldClick = `    document.querySelectorAll('[data-route]').forEach(button => button.addEventListener('click', () => {\n      const route = button.dataset.route;\n      const nextHash = route === 'sales-performance' ? '#sales-performance' : '#overview';\n      if (window.location.hash === nextHash) renderRoute();\n      else window.location.hash = nextHash;\n    }));`;
const newClick = `    document.querySelectorAll('[data-route="overview"], [data-route="sales-performance"]').forEach(button => button.addEventListener('click', () => {\n      const nextHash = \`#\${button.dataset.route}\`;\n      if (window.location.hash === nextHash) renderRoute();\n      else window.location.hash = nextHash;\n    }));`;

for (const [name, from, to] of [
  ['legacy render guard', oldRenderStart, newRenderStart],
  ['legacy click binding', oldClick, newClick]
]) {
  const matches = html.split(from).length - 1;
  if (matches !== 1) throw new Error(`${name}: expected exactly one match, found ${matches}`);
  html = html.replace(from, to);
}

fs.writeFileSync(file, html);
console.log('router repair applied');
