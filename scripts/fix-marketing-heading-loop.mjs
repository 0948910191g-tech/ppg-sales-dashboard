import fs from 'node:fs';

const file = 'dashboard-reference-prototype.html';
let html = fs.readFileSync(file, 'utf8');

const oldBlock = `        if (heading && ROUTE_HEADINGS[route]) {\n          const nextHeading = \`\${ROUTE_HEADINGS[route][0]} <span>/ \${ROUTE_HEADINGS[route][1]}</span>\`;\n          if (heading.innerHTML !== nextHeading) heading.innerHTML = nextHeading;\n        }`;

const newBlock = `        if (heading && ROUTE_HEADINGS[route]) {\n          const [englishHeading, thaiHeading] = ROUTE_HEADINGS[route];\n          const nextHeadingText = \`\${englishHeading} / \${thaiHeading}\`;\n          if (heading.textContent.trim() !== nextHeadingText) {\n            heading.textContent = \`\${englishHeading} \`;\n            const secondaryHeading = document.createElement('span');\n            secondaryHeading.textContent = \`/ \${thaiHeading}\`;\n            heading.append(secondaryHeading);\n          }\n        }`;

const count = html.split(oldBlock).length - 1;
if (count !== 1) throw new Error(`expected exactly one unsafe heading block, found ${count}`);
html = html.replace(oldBlock, newBlock);
fs.writeFileSync(file, html);
console.log('marketing heading observer loop fixed');
