function PPG_AUTH_permissionsForRole_(role) {
  var PPG_role = typeof role === 'string' ? role.toUpperCase() : '';
  var PPG_permissions = ['dashboard.read', 'details.read', 'actions.read'];
  if (PPG_role === 'EXECUTIVE') return PPG_permissions;
  if (PPG_role === 'ANALYST' || PPG_role === 'OPERATOR' || PPG_role === 'ADMIN') {
    PPG_permissions = PPG_permissions.concat(['exports.create', 'actions.create', 'actions.update']);
  }
  if (PPG_role === 'OPERATOR' || PPG_role === 'ADMIN') {
    PPG_permissions = PPG_permissions.concat(['uploads.create', 'imports.create', 'imports.manage', 'actions.manage']);
  }
  if (PPG_role === 'ADMIN') {
    return PPG_permissions.concat(['users.manage', 'settings.manage']);
  }
  return PPG_role === 'ANALYST' || PPG_role === 'OPERATOR' ? PPG_permissions : [];
}

function PPG_AUTH_authorize_(user, permission, expectedWorkspaceId) {
  if (!user || typeof user !== 'object') {
    return { ok: false, code: 'AUTH_REQUIRED' };
  }
  var PPG_userId = user.userId || user.User_ID;
  if (!PPG_userId) return { ok: false, code: 'AUTH_REQUIRED' };
  var PPG_workspaceValue = user.workspaceId !== undefined ? user.workspaceId : user.Workspace_ID;
  var PPG_workspaceId = PPG_AUTH_normalizeWorkspace_(PPG_workspaceValue);
  if (arguments.length >= 3) {
    var PPG_expectedWorkspace = PPG_AUTH_normalizeWorkspace_(expectedWorkspaceId);
    if (!PPG_expectedWorkspace || !PPG_workspaceId) {
      return { ok: false, code: 'WORKSPACE_REQUIRED' };
    }
    if (PPG_workspaceId !== PPG_expectedWorkspace) {
      return { ok: false, code: 'WORKSPACE_MISMATCH' };
    }
  }
  var PPG_hasCamelActive = Object.prototype.hasOwnProperty.call(user, 'isActive');
  var PPG_hasSheetActive = Object.prototype.hasOwnProperty.call(user, 'Is_Active');
  var PPG_camelActive = PPG_AUTH_normalizeActive_(user.isActive);
  var PPG_sheetActive = PPG_AUTH_normalizeActive_(user.Is_Active);
  if (PPG_hasCamelActive && PPG_hasSheetActive && PPG_camelActive !== PPG_sheetActive) {
    return { ok: false, code: 'AUTH_FIELD_CONFLICT' };
  }
  var PPG_isActive = PPG_hasCamelActive ? PPG_camelActive : PPG_sheetActive;
  if (PPG_isActive !== true) return { ok: false, code: 'USER_INACTIVE' };
  var PPG_roleValue = typeof user.role === 'string' ? user.role : user.Role;
  var PPG_role = typeof PPG_roleValue === 'string' ? PPG_roleValue.trim().toUpperCase() : '';
  if (PPG_AUTH_permissionsForRole_(PPG_role).indexOf(permission) === -1) {
    return { ok: false, code: 'FORBIDDEN' };
  }
  return {
    ok: true,
    user: {
      userId: PPG_userId,
      workspaceId: PPG_workspaceId,
      email: user.email || user.Email || null,
      role: PPG_role,
      isActive: true
    }
  };
}

function PPG_AUTH_normalizeWorkspace_(value) {
  if (value === undefined || value === null) return null;
  var PPG_workspace = String(value).trim();
  return PPG_workspace ? PPG_workspace : null;
}

function PPG_AUTH_normalizeActive_(value) {
  if (value === true || value === 'TRUE') return true;
  if (value === false || value === 'FALSE') return false;
  return null;
}
