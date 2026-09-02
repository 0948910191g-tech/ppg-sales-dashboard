function PPG_API_ok_(data, meta) {
  return { ok: true, data: data, meta: PPG_API_meta_(meta), error: null };
}

function PPG_API_error_(code, message, details, meta) {
  return {
    ok: false,
    data: null,
    meta: PPG_API_meta_(meta),
    error: { code: code, message: message, details: details === undefined ? null : details }
  };
}

function PPG_API_meta_(meta) {
  var PPG_input = meta || {};
  return {
    requestId: typeof PPG_input.requestId === 'string' && PPG_input.requestId ? PPG_input.requestId : 'ppg-' + new Date().getTime(),
    workspaceId: PPG_input.workspaceId || null,
    generatedAt: PPG_input.generatedAt || new Date().toISOString(),
    dataThrough: PPG_input.dataThrough || null,
    sourceMode: PPG_input.sourceMode || null,
    phaseMode: PPG_input.phaseMode || null,
    readOnly: PPG_input.readOnly === true,
    acceptedBatchIds: Array.isArray(PPG_input.acceptedBatchIds) ? PPG_input.acceptedBatchIds.slice() : [],
    warnings: Array.isArray(PPG_input.warnings) ? PPG_input.warnings.slice() : []
  };
}

function PPG_CORE_normalizePlatform_(value) {
  if (typeof value !== 'string') return null;
  var PPG_normalized = value.replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (PPG_normalized === 'SHOPEE' || PPG_normalized === 'SHOPEETHAILAND' || PPG_normalized === 'SHOPEESHOP') return 'SHOPEE';
  if (PPG_normalized === 'TIKTOK' || PPG_normalized === 'TIKTOKSHOP') return 'TIKTOK';
  return null;
}

function PPG_CORE_validateIsoDate_(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  var PPG_parts = value.split('-');
  var PPG_year = Number(PPG_parts[0]);
  var PPG_month = Number(PPG_parts[1]);
  var PPG_day = Number(PPG_parts[2]);
  var PPG_date = new Date(Date.UTC(PPG_year, PPG_month - 1, PPG_day));
  return PPG_date.getUTCFullYear() === PPG_year && PPG_date.getUTCMonth() === PPG_month - 1 && PPG_date.getUTCDate() === PPG_day;
}

function PPG_CORE_validatePeriod_(startDate, endDate) {
  return PPG_CORE_validateIsoDate_(startDate) && PPG_CORE_validateIsoDate_(endDate) && startDate <= endDate;
}
