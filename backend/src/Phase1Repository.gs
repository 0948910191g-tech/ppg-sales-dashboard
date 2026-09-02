/* Phase 1 production repository: the returned surface is read-only. */

var PPG_PHASE1_REPOSITORY_ERROR_CODES_ = [
  'SOURCE_PERMISSION_DENIED',
  'SOURCE_TIMEOUT',
  'SHEET_NOT_FOUND',
  'HEADER_MISMATCH',
  'SOURCE_READ_FAILED',
  'SOURCE_TAB_NOT_APPROVED'
];

function PPG_PHASE1_REPOSITORY_error_(code, sheetName) {
  var suffix = sheetName ? ':' + String(sheetName) : '';
  var error = new Error(String(code) + suffix);
  error.code = code;
  return error;
}

function PPG_PHASE1_REPOSITORY_errorCode_(error) {
  var raw = String(error && (error.code || error.message) || 'SOURCE_READ_FAILED').toUpperCase();
  if (PPG_PHASE1_REPOSITORY_ERROR_CODES_.indexOf(raw) >= 0) return raw;
  if (raw.indexOf('HEADER') >= 0 || raw.indexOf('SCHEMA') >= 0) return 'HEADER_MISMATCH';
  if (raw.indexOf('NOT_FOUND') >= 0 || /(^|[_\s-])MISSING([_\s-]|$)/.test(raw) || /(^|[_\s-])(?:SHEET|TAB)(?:[_\s-]|$)/.test(raw)) return 'SHEET_NOT_FOUND';
  if (raw.indexOf('TIMEOUT') >= 0 || raw.indexOf('TIMED_OUT') >= 0 || /TIMED[\s_-]+OUT/.test(raw) || raw.indexOf('DEADLINE') >= 0) return 'SOURCE_TIMEOUT';
  if (raw.indexOf('PERMISSION') >= 0 || raw.indexOf('ACCESS') >= 0 || raw.indexOf('DENIED') >= 0 || raw.indexOf('AUTHORIZATION') >= 0) return 'SOURCE_PERMISSION_DENIED';
  return 'SOURCE_READ_FAILED';
}

function PPG_PHASE1_REPOSITORY_isAllowedSheet_(sheetName) {
  var allowlist = PPG_CONFIG && PPG_CONFIG.allowlistTab ? [PPG_CONFIG.allowlistTab] : ['Users'];
  var views = PPG_CONFIG && Array.isArray(PPG_CONFIG.approvedViewTabs) ? PPG_CONFIG.approvedViewTabs : [];
  return allowlist.concat(views).indexOf(sheetName) >= 0;
}

function PPG_PHASE1_REPO_fromSpreadsheet_(spreadsheet) {
  if (!spreadsheet || typeof spreadsheet.getSheetByName !== 'function') {
    throw PPG_PHASE1_REPOSITORY_error_('SOURCE_ADAPTER_REQUIRED');
  }

  function readTable(sheetName) {
    if (!PPG_PHASE1_REPOSITORY_isAllowedSheet_(sheetName)) {
      throw PPG_PHASE1_REPOSITORY_error_('SOURCE_TAB_NOT_APPROVED', sheetName);
    }

    var sheet;
    try {
      sheet = spreadsheet.getSheetByName(sheetName);
    } catch (error) {
      throw PPG_PHASE1_REPOSITORY_error_(PPG_PHASE1_REPOSITORY_errorCode_(error), sheetName);
    }
    if (!sheet) throw PPG_PHASE1_REPOSITORY_error_('SHEET_NOT_FOUND', sheetName);

    var lastRow;
    var lastColumn;
    try {
      lastRow = Number(sheet.getLastRow());
      lastColumn = Number(sheet.getLastColumn());
    } catch (error) {
      throw PPG_PHASE1_REPOSITORY_error_(PPG_PHASE1_REPOSITORY_errorCode_(error), sheetName);
    }
    if (!isFinite(lastRow) || !isFinite(lastColumn) || lastRow < 1 || lastColumn < 1) {
      throw PPG_PHASE1_REPOSITORY_error_('HEADER_MISMATCH', sheetName);
    }

    var headerValues;
    var values;
    try {
      headerValues = sheet.getRange(1, 1, 1, lastColumn).getValues();
      values = lastRow < 2 ? [] : sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
    } catch (error) {
      throw PPG_PHASE1_REPOSITORY_error_(PPG_PHASE1_REPOSITORY_errorCode_(error), sheetName);
    }
    if (!Array.isArray(headerValues) || !Array.isArray(headerValues[0])) {
      throw PPG_PHASE1_REPOSITORY_error_('HEADER_MISMATCH', sheetName);
    }
    if (!Array.isArray(values)) throw PPG_PHASE1_REPOSITORY_error_('SOURCE_READ_FAILED', sheetName);

    var headers = headerValues[0].map(function(header) { return String(header == null ? '' : header).trim(); });
    if (!headers.length || headers.some(function(header) { return !header; })) {
      throw PPG_PHASE1_REPOSITORY_error_('HEADER_MISMATCH', sheetName);
    }

    var rows = values.map(function(row) {
      if (!Array.isArray(row) || row.length !== headers.length) {
        throw PPG_PHASE1_REPOSITORY_error_('HEADER_MISMATCH', sheetName);
      }
      var objectRow = {};
      headers.forEach(function(header, index) { objectRow[header] = row[index]; });
      return objectRow;
    });
    return { headers: headers, rows: rows };
  }

  function read(sheetName) {
    return readTable(sheetName).rows;
  }

  return { readTable: readTable, read: read };
}
