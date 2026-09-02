import fs from 'node:fs';

const file = 'dashboard-reference-prototype.html';
let html = fs.readFileSync(file, 'utf8');

const oldBlock = `      const host = document.createElement('section'); host.id = 'ui-completion-view'; host.className = 'ui-completion-view'; host.hidden = true; routeWorkspace.append(host);\n      const routes = { products:['Products','สินค้า'], 'marketing-ads':['Marketing & Ads','การตลาดและโฆษณา'], creators:['Creators','ครีเอเตอร์'], competitors:['Competitors','คู่แข่ง'], review:['Review','สัญญาณและคิวตรวจสอบ'], 'review-walkthrough':['Review Walkthrough','รีวิวทีละขั้น'], 'data-health':['Data Health','สุขภาพข้อมูล'], 'data-explorer':['Data Explorer','สำรวจข้อมูล'] };`;

const newBlock = `      const host = document.createElement('section'); host.id = 'ui-completion-view'; host.className = 'ui-completion-view'; host.hidden = true; routeWorkspace.append(host);\n      const completionFilterValues = {};\n      const routes = { products:['Products','สินค้า'], 'marketing-ads':['Marketing & Ads','การตลาดและโฆษณา'], creators:['Creators','ครีเอเตอร์'], competitors:['Competitors','คู่แข่ง'], review:['Review','สัญญาณและคิวตรวจสอบ'], 'review-walkthrough':['Review Walkthrough','รีวิวทีละขั้น'], 'data-health':['Data Health','สุขภาพข้อมูล'], 'data-explorer':['Data Explorer','สำรวจข้อมูล'] };`;

const count = html.split(oldBlock).length - 1;
if (count !== 1) throw new Error(`expected exactly one completion-router host block, found ${count}`);
html = html.replace(oldBlock, newBlock);
fs.writeFileSync(file, html);
console.log('review filter state moved into completion router scope');
