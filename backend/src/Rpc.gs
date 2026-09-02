/* Public Apps Script facade.  Phase 1 exposes only the secured read model. */
var PPG_RPC_DEPS_ = {
  repo: null,
  identity: function() { return PPG_RPC_defaultIdentity_(); },
  expectedWorkspaceId: undefined,
  readPhase1Sheet: null,
  historicalSnapshot: null,
  renderApp: null,
  renderDenied: null
};

function PPG_RPC_setDeps_(deps) {
  Object.keys(deps || {}).forEach(function(key) { PPG_RPC_DEPS_[key] = deps[key]; });
}

function PPG_RPC_defaultIdentity_() {
  try {
    if (typeof Session !== 'undefined' && Session.getActiveUser) {
      return Session.getActiveUser().getEmail();
    }
  } catch (error) {
    return null;
  }
  return null;
}

function PPG_RPC_repo_() {
  if (PPG_RPC_DEPS_.repo) return PPG_RPC_DEPS_.repo;
  try {
    if (typeof PropertiesService === 'undefined' || typeof SpreadsheetApp === 'undefined') {
      throw new Error('SOURCE_ADAPTER_REQUIRED');
    }
    var properties = PropertiesService.getScriptProperties();
    var spreadsheetId = properties.getProperty('PPG_SPREADSHEET_ID');
    if (!spreadsheetId) throw new Error('SOURCE_ADAPTER_REQUIRED');
    PPG_RPC_DEPS_.repo = PPG_PHASE1_REPO_fromSpreadsheet_(SpreadsheetApp.openById(spreadsheetId));
    return PPG_RPC_DEPS_.repo;
  } catch (error) {
    var failure = new Error('SOURCE_READ_FAILED');
    failure.code = 'SOURCE_READ_FAILED';
    throw failure;
  }
}

function PPG_RPC_testExpectedWorkspace_() {
  /* The in-memory repository is an explicit local test seam.  A deployed
   * Apps Script project must use the Script Property path above instead of
   * inferring authority from data rows. */
  var repo = PPG_RPC_DEPS_.repo;
  if (!repo || !repo.tables || !Array.isArray(repo.tables.Users)) return null;
  var workspaces = [];
  repo.tables.Users.forEach(function(row) {
    var workspaceId = PPG_AUTH_normalizeWorkspace_(row && (row.Workspace_ID !== undefined ? row.Workspace_ID : row.workspaceId));
    if (workspaceId && workspaces.indexOf(workspaceId) < 0) workspaces.push(workspaceId);
  });
  return workspaces.length === 1 ? workspaces[0] : null;
}

function PPG_RPC_expectedWorkspace_() {
  var injected = PPG_RPC_DEPS_.expectedWorkspaceId;
  if (injected !== undefined) {
    try {
      injected = typeof injected === 'function' ? injected() : injected;
    } catch (error) {
      return null;
    }
    return PPG_AUTH_normalizeWorkspace_(injected);
  }
  if (Object.prototype.hasOwnProperty.call(PPG_CONFIG, 'expectedWorkspaceId')) {
    return PPG_AUTH_normalizeWorkspace_(PPG_CONFIG.expectedWorkspaceId);
  }
  try {
    if (typeof PropertiesService !== 'undefined' && PropertiesService.getScriptProperties) {
      var properties = PropertiesService.getScriptProperties();
      var configured = properties && properties.getProperty ? properties.getProperty(PPG_CONFIG.expectedWorkspaceProperty) : null;
      return PPG_AUTH_normalizeWorkspace_(configured);
    }
  } catch (error) {
    return null;
  }
  return PPG_RPC_testExpectedWorkspace_();
}

function PPG_RPC_normalizeEmail_(value) {
  if (value === undefined || value === null) return null;
  var email = String(value).trim().toLowerCase();
  return email && email.indexOf('@') > 0 ? email : null;
}

function PPG_RPC_active_(value) {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value === null || value === undefined) return false;
  var text = String(value).trim().toUpperCase();
  return text === 'TRUE' || text === '1' || text === 'YES' || text === 'ACTIVE';
}

function PPG_RPC_readUsers_() {
  try {
    var repo = PPG_RPC_repo_();
    if (repo && typeof repo.readTable === 'function') return repo.readTable('Users').rows || [];
    return repo && typeof repo.read === 'function' ? repo.read('Users') : [];
  } catch (error) {
    return [];
  }
}

function PPG_RPC_currentUser_() {
  var identity;
  try {
    identity = PPG_RPC_DEPS_.identity && PPG_RPC_DEPS_.identity();
  } catch (error) {
    identity = null;
  }
  var email = PPG_RPC_normalizeEmail_(identity);
  if (!email) return { ok: false, code: 'AUTH_REQUIRED' };

  var rows = PPG_RPC_readUsers_();
  var match = null;
  for (var index = 0; index < rows.length; index += 1) {
    var candidate = rows[index] || {};
    var candidateEmail = PPG_RPC_normalizeEmail_(candidate.Email !== undefined ? candidate.Email : candidate.email);
    if (candidateEmail === email) {
      match = candidate;
      break;
    }
  }
  if (!match) return { ok: false, code: 'AUTH_REQUIRED' };
  if (!PPG_RPC_active_(match.Is_Active !== undefined ? match.Is_Active : match.isActive)) {
    return { ok: false, code: 'USER_INACTIVE' };
  }
  var userId = match.User_ID || match.userId || email;
  var workspaceValue = match.Workspace_ID !== undefined ? match.Workspace_ID : match.workspaceId;
  var workspaceId = PPG_AUTH_normalizeWorkspace_(workspaceValue);
  var roleValue = match.Role !== undefined ? match.Role : match.role;
  var role = String(roleValue || '').trim().toUpperCase();
  return {
    ok: true,
    user: {
      userId: String(userId),
      workspaceId: workspaceId === null || workspaceId === undefined ? null : String(workspaceId),
      email: email,
      role: role,
      isActive: true,
      permissions: PPG_AUTH_permissionsForRole_(role)
    }
  };
}

function PPG_RPC_safeMessage_(code) {
  var messages = {
    AUTH_REQUIRED: 'Authentication required.',
    USER_INACTIVE: 'Account is not active.',
    FORBIDDEN: 'Access denied.',
    WORKSPACE_REQUIRED: 'Workspace authorization is required.',
    WORKSPACE_MISMATCH: 'Access denied.',
    READ_ONLY: 'This operation is unavailable in read-only mode.',
    INVALID_PERIOD: 'Invalid period.',
    INVALID_PLATFORM: 'Invalid platform.',
    HEADER_MISMATCH: 'Source is unavailable.',
    SHEET_NOT_FOUND: 'Source is unavailable.',
    SOURCE_TIMEOUT: 'Source is temporarily unavailable.',
    SOURCE_PERMISSION_DENIED: 'Source is unavailable.',
    SOURCE_READ_FAILED: 'Source is unavailable.',
    SOURCE_TAB_NOT_APPROVED: 'Source is unavailable.'
  };
  return messages[code] || 'Request could not be completed.';
}

function PPG_RPC_safeDetails_(error) {
  var details = error && error.details;
  if (!details || typeof details !== 'object') return null;
  var sources = Array.isArray(details.sources) ? details.sources : null;
  if (!sources) return null;
  return {
    sources: sources.map(function(source) {
      return { source: String(source.source || ''), code: String(source.code || 'SOURCE_READ_FAILED'), reason: 'SOURCE_UNAVAILABLE' };
    })
  };
}

function PPG_RPC_errorResponse_(error) {
  var code = String(error && error.code || error && error.message || 'INTERNAL_ERROR');
  var known = ['AUTH_REQUIRED', 'USER_INACTIVE', 'FORBIDDEN', 'WORKSPACE_REQUIRED', 'WORKSPACE_MISMATCH', 'READ_ONLY', 'INVALID_PERIOD', 'INVALID_PLATFORM', 'HEADER_MISMATCH', 'SHEET_NOT_FOUND', 'SOURCE_TIMEOUT', 'SOURCE_PERMISSION_DENIED', 'SOURCE_READ_FAILED', 'SOURCE_TAB_NOT_APPROVED', 'USER_NOT_FOUND'];
  if (known.indexOf(code) < 0) code = 'INTERNAL_ERROR';
  return PPG_API_error_(code, PPG_RPC_safeMessage_(code), PPG_RPC_safeDetails_(error));
}

function PPG_RPC_authorizePhase1_(input) {
  var current = PPG_RPC_currentUser_();
  if (!current.ok) return current;
  var expectedWorkspace = PPG_RPC_expectedWorkspace_();
  if (!expectedWorkspace) return { ok: false, code: 'WORKSPACE_REQUIRED' };
  var authorized = PPG_AUTH_authorize_(current.user, 'dashboard.read', expectedWorkspace);
  if (!authorized.ok) return authorized;
  var request = input && typeof input === 'object' ? input : {};
  if (Object.prototype.hasOwnProperty.call(request, 'workspaceId')) {
    var requestedWorkspace = PPG_AUTH_normalizeWorkspace_(request.workspaceId);
    if (!requestedWorkspace) return { ok: false, code: 'WORKSPACE_REQUIRED' };
    if (requestedWorkspace !== authorized.user.workspaceId) return { ok: false, code: 'WORKSPACE_MISMATCH' };
  }
  return { ok: true, user: authorized.user };
}

function PPG_RPC_phase1Call_(input, fn) {
  var request = input || {};
  var authorized = PPG_RPC_authorizePhase1_(request);
  if (!authorized.ok) return PPG_API_error_(authorized.code, PPG_RPC_safeMessage_(authorized.code));
  try {
    var data = fn(authorized.user, request);
    var meta = {
      workspaceId: authorized.user.workspaceId,
      dataThrough: data && data.meta ? data.meta.dataThrough : data && data.dataThrough,
      sourceMode: data && data.meta ? data.meta.sourceMode : data && data.mode,
      phaseMode: PPG_CONFIG.phaseMode,
      readOnly: true,
      warnings: data && data.warnings ? data.warnings : []
    };
    return PPG_API_ok_(data, meta);
  } catch (error) {
    return PPG_RPC_errorResponse_(error);
  }
}

function PPG_PHASE1_validateQuery_(input) {
  var query = input || {};
  if (!PPG_CORE_validatePeriod_(query.start, query.end)) throw PPG_PHASE1_error_('INVALID_PERIOD');
  var platform = query.platform;
  if (platform === undefined || platform === null || platform === '' || String(platform).toLowerCase() === 'all') {
    platform = null;
  } else {
    platform = PPG_PHASE1_platform_(platform);
    if (!platform) throw PPG_PHASE1_error_('INVALID_PLATFORM');
  }
  return { start: query.start, end: query.end, platform: platform };
}

function PPG_PHASE1_bootstrap_(user, model) {
  var bootstrap = {
    mode: model.mode,
    readOnly: true,
    phaseMode: PPG_CONFIG.phaseMode,
    user: model.user,
    approvedViewTabs: model.approvedViewTabs,
    sourceAvailability: model.sourceAvailability,
    coverage: model.coverage,
    periods: model.periods,
    dataThrough: model.dataThrough
  };
  if (model.snapshot) bootstrap.fallback = model.snapshot;
  return bootstrap;
}

function getPhase1Bootstrap(input) {
  return PPG_RPC_phase1Call_(input, function(user) {
    var model = PPG_PHASE1_readModel_(user);
    return PPG_PHASE1_bootstrap_(user, model);
  });
}

function getPhase1Data(input) {
  return PPG_RPC_phase1Call_(input, function(user, request) {
    var query = PPG_PHASE1_validateQuery_(request);
    var model = PPG_PHASE1_readModel_(user);
    return PPG_PHASE1_data_(model, query);
  });
}

function PPG_RPC_readOnlyDenied_(input) {
  var authorized = PPG_RPC_authorizePhase1_(input || {});
  if (!authorized.ok) return PPG_API_error_(authorized.code, PPG_RPC_safeMessage_(authorized.code));
  return PPG_API_error_('READ_ONLY', PPG_RPC_safeMessage_('READ_ONLY'));
}

/* Existing v1 reads are routed to the Phase 1 seam so they cannot reach the
 * canonical/import tables.  Existing writes and administration endpoints are
 * retained as explicit, server-side read-only denials. */
function getBootstrap(input) { return getPhase1Bootstrap(input); }
function getDashboard(input) { return getPhase1Data(input); }
function getProducts(input) { return PPG_RPC_readOnlyDenied_(input); }
function getMarketing(input) { return PPG_RPC_readOnlyDenied_(input); }
function getCreators(input) { return PPG_RPC_readOnlyDenied_(input); }
function getCompetitors(input) { return PPG_RPC_readOnlyDenied_(input); }
function uploadFiles(input) { return PPG_RPC_readOnlyDenied_(input); }
function getImportStatus(input) { return PPG_RPC_readOnlyDenied_(input); }
function listImportBatches(input) { return PPG_RPC_readOnlyDenied_(input); }
function listActions(input) { return PPG_RPC_readOnlyDenied_(input); }
function createAction(input) { return PPG_RPC_readOnlyDenied_(input); }
function updateAction(input) { return PPG_RPC_readOnlyDenied_(input); }
function changeActionStatus(input) { return PPG_RPC_readOnlyDenied_(input); }
function listUsers(input) { return PPG_RPC_readOnlyDenied_(input); }
function setUserRole(input) { return PPG_RPC_readOnlyDenied_(input); }
function getSystemHealth(input) { return PPG_RPC_readOnlyDenied_(input); }

function PPG_RPC_renderDenied_() {
  try {
    if (typeof PPG_RPC_DEPS_.renderDenied === 'function') return PPG_RPC_DEPS_.renderDenied();
    if (typeof HtmlService !== 'undefined' && HtmlService.createHtmlOutput) {
      return HtmlService.createHtmlOutput('<!doctype html><html><head><meta charset="utf-8"><title>Access denied</title></head><body><main><h1>Access denied</h1><p>Your account is not authorized to view this dashboard.</p></main></body></html>');
    }
  } catch (error) {
    // Rendering failures must not expose an implementation error or payload.
  }
  return 'Access denied';
}

function PPG_RPC_renderApp_(authorized) {
  if (!authorized || authorized.ok !== true || !authorized.user) return PPG_RPC_renderDenied_();
  try {
    if (typeof PPG_RPC_DEPS_.renderApp === 'function') return PPG_RPC_DEPS_.renderApp(authorized.user);
    if (typeof HtmlService !== 'undefined' && HtmlService.createHtmlOutputFromFile) {
      return HtmlService.createHtmlOutputFromFile('dashboard').setTitle('PPG Sales Dashboard');
    }
  } catch (error) {
    // Local previews and missing deployment files fail closed.
  }
  return PPG_RPC_renderDenied_();
}

function doGet() {
  var authorized = PPG_RPC_authorizePhase1_();
  if (!authorized.ok) return PPG_RPC_renderDenied_();
  return PPG_RPC_renderApp_(authorized);
}
