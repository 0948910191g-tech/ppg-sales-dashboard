function PPG_SETUP_planWorkspace_(existingHeaderMap) {
  var p = PPG_SCHEMA_plan_(existingHeaderMap || {});
  p.folders = ['Inbox', 'Processing', 'Archive', 'Rejected'];
  p.checklist = ['Review schema plan', 'Confirm backup', 'Create missing tabs and folders', 'Write Settings and first Admin user'];
  return p;
}
function PPG_SETUP_execute_(deps, request) {
  request = request || {};
  var plan = request.plan || PPG_SETUP_planWorkspace_(request.existingHeaderMap);
  if (plan.blocked && plan.blocked.length) throw new Error('BLOCKED_SCHEMA');
  if (request.confirmationToken !== 'PPG_SETUP_CONFIRM') throw new Error('CONFIRMATION_REQUIRED');
  if (!request.admin) throw new Error('ADMIN_REQUIRED');
  if (!deps || typeof deps.backupSpreadsheet !== 'function' || typeof deps.createSheet !== 'function' || typeof deps.ensureFolder !== 'function' || !deps.repo) throw new Error('PREFLIGHT_FAILED');
  var backup = deps.backupSpreadsheet(), created = [], folders = {};
  (plan.create || []).forEach(function(n) { deps.createSheet(n, PPG_SCHEMA_manifest_()[n]); created.push(n); });
  (plan.folders || ['Inbox','Processing','Archive','Rejected']).forEach(function(n) { folders[n] = deps.ensureFolder(n); });
  var id = request.workspaceId || ('ws-' + new Date().getTime()), now = new Date().toISOString();
  deps.repo.append('Settings', [{Workspace_ID:id, Setting_Key:'Workspace_ID', Setting_Value:id, Value_Type:'STRING', Is_Active:true, Created_At:now, Updated_At:now}]);
  Object.keys(folders).forEach(function(n) { if (folders[n]) deps.repo.append('Settings', [{Workspace_ID:id, Setting_Key:n+'_Folder_ID', Setting_Value:folders[n], Value_Type:'STRING', Is_Active:true, Created_At:now, Updated_At:now}]); });
  deps.repo.append('Users', [{User_ID:request.admin.userId || ('usr-'+new Date().getTime()), Workspace_ID:id, Email:request.admin.email, Display_Name:request.admin.displayName || '', Role:'ADMIN', Is_Active:true, Created_At:now, Updated_At:now}]);
  return {workspaceId:id, backup:backup, created:created, folders:folders};
}
