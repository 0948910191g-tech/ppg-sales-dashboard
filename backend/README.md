# PPG backend RPC

Bind this project to the Apps Script spreadsheet, review `appsscript.json`, and deploy as a domain-only web app only after approval. Required services are Spreadsheet, Drive (file lifecycle: Inbox -> Processing -> Archive/Rejected), and Lock. Configure an installable import trigger after reviewing folder IDs.

RPC responses always use `{ok,data,meta,error}`. `meta` includes request/workspace/time and accepted-batch/warning fields. Authentication resolves the active domain user and server-side role permissions. Actions are append-history only; there is no delete endpoint.

Local verification: `node --test backend/tests/*.test.mjs`. Live Sheets, imports, and deployment are explicit approval gates and are not part of local tests.
