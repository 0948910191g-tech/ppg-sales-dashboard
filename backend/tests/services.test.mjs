import assert from 'node:assert/strict';
import test from 'node:test';
import { loadAppsScript } from './helpers/load-appsscript.mjs';

const ctx=()=>loadAppsScript();
test('memory repository appends and filters object rows',()=>{const c=ctx(),r=c.PPG_REPO_memory_();r.append('T',[{A:1,B:'x'}]);assert.deepEqual(JSON.parse(JSON.stringify(r.find('T',{A:1}))),[{A:1,B:'x'}]);});
test('setup plan includes folders and checklist without mutation',()=>{const c=ctx(),p=c.PPG_SETUP_planWorkspace_({});assert.ok(p.create.includes('Settings'));assert.deepEqual([...p.folders],['Inbox','Processing','Archive','Rejected']);assert.ok(p.checklist.length>=3);});
test('setup blocks mismatched schema before backup',()=>{const c=ctx();let backed=0;assert.throws(()=>c.PPG_SETUP_execute_({backupSpreadsheet:()=>{backed++;}}, {plan:{create:[],reuse:[],blocked:[{sheetName:'Settings'}]},confirmationToken:'PPG_SETUP_CONFIRM'}),/BLOCKED_SCHEMA/);assert.equal(backed,0);});
test('register upload queues supported file and rejects unsupported',()=>{const c=ctx(),r=c.PPG_REPO_memory_(),stored=[];const d={repo:r,hashContent:()=> 'h1',storeFile:(f,b)=>stored.push(b)};const out=c.PPG_IMPORT_registerUpload_(d,{workspaceId:'w',permissions:['uploads.create']},[{name:'sales.csv',content:'x'}],'2026-08-31T00:00:00Z');assert.equal(out[0].status,'QUEUED');assert.deepEqual(stored,['Inbox']);assert.throws(()=>c.PPG_IMPORT_registerUpload_(d,{workspaceId:'w',permissions:['uploads.create']},[{name:'x.pdf',content:'x'}]),/UNSUPPORTED_EXTENSION/);});
test('status hides non-accepted rows from accepted ids',()=>{const c=ctx(),r=c.PPG_REPO_memory_({DB_Import_Batches:[{Batch_ID:'b',Workspace_ID:'w',Batch_Status:'QUEUED'}],DB_Canonical_Daily:[{Batch_ID:'b',Metric_Date:'2026-08-01'}]});const s=c.PPG_IMPORT_getStatus_(r,'b');assert.equal(s.ok,true);assert.deepEqual([...s.meta.acceptedBatchIds],[]);});
