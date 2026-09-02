import fs from 'node:fs';

const file = 'dashboard-reference-prototype.html';
let html = fs.readFileSync(file, 'utf8');

const oldLine = `        if (!host || !ROUTE_REGISTRY[route]) return;`;
const newLine = `        if (!host || !ROUTE_REGISTRY[route] || host.hidden || window.location.hash !== ROUTE_REGISTRY[route].hash) return;`;
const count = html.split(oldLine).length - 1;
if (count !== 1) throw new Error(`expected exactly one compatibility annotate guard, found ${count}`);
html = html.replace(oldLine, newLine);
fs.writeFileSync(file, html);
console.log('hidden completion route no longer overwrites shared heading');
