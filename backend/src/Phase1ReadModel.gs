/*
 * Phase 1 read model.
 *
 * This module deliberately has no write-capable dependency.  It reads the
 * allowlist separately, then reads only the five approved view tabs.  The
 * production repository may be a Spreadsheet repository while tests can
 * inject a bounded readPhase1Sheet adapter.
 */
var PPG_PHASE1_VIEW_HEADERS_ = {
  Daily_Sales: ['record_key', 'batch_id', 'platform', 'sales_date', 'period_start', 'period_end', 'metric_scope', 'gross_gmv', 'confirmed_gmv', 'orders', 'units', 'visitors', 'refund_gmv', 'cancelled_gmv', 'source_file'],
  Product_Period: ['record_key', 'batch_id', 'platform', 'sku', 'product_name', 'period_start', 'period_end', 'sales_gmv', 'ordered_gmv', 'orders', 'units', 'buyers', 'views', 'clicks', 'ctr', 'conversion_rate', 'aov', 'source_file'],
  Ads_Period: ['record_key', 'batch_id', 'platform', 'campaign_name', 'period_start', 'period_end', 'spend', 'attributed_sales', 'roas', 'impressions', 'clicks', 'orders', 'source_file'],
  Traffic_Period: ['record_key', 'batch_id', 'platform', 'traffic_source', 'period_start', 'period_end', 'sales_gmv', 'visitors', 'clicks', 'views', 'source_file'],
  Creator_Period: ['record_key', 'batch_id', 'platform', 'creator_name', 'period_start', 'period_end', 'gmv', 'orders', 'units', 'refunds', 'commission', 'source_file']
};

var PPG_PHASE1_SOURCE_ERROR_CODES_ = [
  'SOURCE_PERMISSION_DENIED',
  'SOURCE_TIMEOUT',
  'SHEET_NOT_FOUND',
  'HEADER_MISMATCH',
  'SOURCE_READ_FAILED',
  'SOURCE_TAB_NOT_APPROVED'
];

function PPG_PHASE1_viewTabs_() {
  return PPG_CONFIG.approvedViewTabs.slice();
}

function PPG_PHASE1_error_(code, details) {
  var error = new Error(code);
  error.code = code;
  error.details = details || null;
  return error;
}

function PPG_PHASE1_errorCode_(error) {
  var raw = String(error && (error.code || error.message) || 'SOURCE_READ_FAILED').toUpperCase();
  if (PPG_PHASE1_SOURCE_ERROR_CODES_.indexOf(raw) >= 0) return raw;
  if (raw.indexOf('HEADER') >= 0 || raw.indexOf('SCHEMA') >= 0) return 'HEADER_MISMATCH';
  if (raw.indexOf('NOT_FOUND') >= 0 || /(^|[_\s-])MISSING([_\s-]|$)/.test(raw) || /(^|[_\s-])(?:SHEET|TAB)(?:[_\s-]|$)/.test(raw)) return 'SHEET_NOT_FOUND';
  if (raw.indexOf('TIMEOUT') >= 0 || raw.indexOf('TIMED_OUT') >= 0 || /TIMED[\s_-]+OUT/.test(raw) || raw.indexOf('DEADLINE') >= 0) return 'SOURCE_TIMEOUT';
  if (raw.indexOf('PERMISSION') >= 0 || raw.indexOf('ACCESS') >= 0 || raw.indexOf('DENIED') >= 0 || raw.indexOf('AUTHORIZATION') >= 0) return 'SOURCE_PERMISSION_DENIED';
  return 'SOURCE_READ_FAILED';
}

function PPG_PHASE1_normalizeHeader_(value) {
  return String(value == null ? '' : value).trim();
}

function PPG_PHASE1_headersMatch_(expected, actual) {
  if (!Array.isArray(actual) || expected.length !== actual.length) return false;
  for (var index = 0; index < expected.length; index += 1) {
    if (expected[index] !== PPG_PHASE1_normalizeHeader_(actual[index])) return false;
  }
  return true;
}

function PPG_PHASE1_readTable_(sheetName) {
  if (PPG_PHASE1_viewTabs_().indexOf(sheetName) < 0) {
    throw PPG_PHASE1_error_('SOURCE_TAB_NOT_APPROVED');
  }
  var repo = PPG_RPC_repo_();
  var reader = PPG_RPC_DEPS_.readPhase1Sheet;
  var result;
  try {
    if (typeof reader === 'function') {
      result = reader(sheetName);
    } else if (repo && typeof repo.readTable === 'function') {
      result = repo.readTable(sheetName);
    } else if (repo && typeof repo.readWithHeaders === 'function') {
      result = repo.readWithHeaders(sheetName);
    } else if (repo && typeof repo.read === 'function') {
      if (repo.tables && !Object.prototype.hasOwnProperty.call(repo.tables, sheetName)) {
        throw PPG_PHASE1_error_('SHEET_NOT_FOUND');
      }
      result = { headers: null, rows: repo.read(sheetName) };
    } else {
      throw PPG_PHASE1_error_('SOURCE_READ_FAILED');
    }
  } catch (error) {
    if (error && error.code) throw error;
    throw PPG_PHASE1_error_(PPG_PHASE1_errorCode_(error));
  }
  if (Array.isArray(result)) result = { headers: null, rows: result };
  if (!result || !Array.isArray(result.rows)) throw PPG_PHASE1_error_('SOURCE_READ_FAILED');
  if (result.headers !== undefined && result.headers !== null && !Array.isArray(result.headers)) throw PPG_PHASE1_error_('HEADER_MISMATCH');
  if (Array.isArray(result.headers) && !PPG_PHASE1_headersMatch_(PPG_PHASE1_VIEW_HEADERS_[sheetName], result.headers)) {
    throw PPG_PHASE1_error_('HEADER_MISMATCH');
  }
  var rows = result.rows;
  if (rows.some(function(row) { return !row || typeof row !== 'object'; })) throw PPG_PHASE1_error_('HEADER_MISMATCH');
  if (rows.some(function(row) { return Array.isArray(row) !== (rows.length && Array.isArray(rows[0])); })) throw PPG_PHASE1_error_('HEADER_MISMATCH');
  if (rows.length && Array.isArray(rows[0])) {
    if (!Array.isArray(result.headers) || !result.headers.length) throw PPG_PHASE1_error_('HEADER_MISMATCH');
    rows = rows.map(function(row) {
      var objectRow = {};
      result.headers.forEach(function(header, index) { objectRow[header] = row[index]; });
      return objectRow;
    });
  }
  return { headers: result.headers || null, rows: rows };
}

function PPG_PHASE1_rowValue_(row, field) {
  if (!row || typeof row !== 'object') return undefined;
  if (Object.prototype.hasOwnProperty.call(row, field)) return row[field];
  var wanted = String(field).toLowerCase();
  var keys = Object.keys(row);
  for (var index = 0; index < keys.length; index += 1) {
    if (String(keys[index]).trim().toLowerCase() === wanted) return row[keys[index]];
  }
  return undefined;
}

function PPG_PHASE1_text_(value) {
  if (value === undefined || value === null) return null;
  var text = String(value).trim();
  return text ? text : null;
}

function PPG_PHASE1_number_(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') return isFinite(value) ? value : null;
  var text = String(value).trim();
  if (!text || !/\d/.test(text)) return null;
  text = text.replace(/[,$%]/g, '').replace(/^\s*(?:THB|USD|BAHT)\s*/i, '').replace(/^\s*\u0e3f\s*/, '').replace(/\s*(?:\u0e1a\u0e32\u0e17|x)\s*$/i, '').trim();
  var number = Number(text);
  return isFinite(number) ? number : null;
}

function PPG_PHASE1_date_(value) {
  if (value === undefined || value === null || value === '') return null;
  if (Object.prototype.toString.call(value) === '[object Date]') {
    if (isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }
  var text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    var iso = text.slice(0, 10);
    return PPG_CORE_validateIsoDate_(iso) ? iso : null;
  }
  return null;
}

function PPG_PHASE1_platform_(value) {
  var normalized = PPG_CORE_normalizePlatform_(value);
  return normalized ? normalized.toLowerCase() : null;
}

function PPG_PHASE1_transformRow_(sheetName, source) {
  var row = source || {};
  var common = {
    record_key: PPG_PHASE1_text_(PPG_PHASE1_rowValue_(row, 'record_key')),
    batch_id: PPG_PHASE1_text_(PPG_PHASE1_rowValue_(row, 'batch_id')),
    platform: PPG_PHASE1_platform_(PPG_PHASE1_rowValue_(row, 'platform')),
    period_start: PPG_PHASE1_date_(PPG_PHASE1_rowValue_(row, 'period_start')),
    period_end: PPG_PHASE1_date_(PPG_PHASE1_rowValue_(row, 'period_end')),
    source_file: PPG_PHASE1_text_(PPG_PHASE1_rowValue_(row, 'source_file'))
  };
  if (sheetName === 'Daily_Sales') {
    return {
      record_key: common.record_key, batch_id: common.batch_id, platform: common.platform,
      sales_date: PPG_PHASE1_date_(PPG_PHASE1_rowValue_(row, 'sales_date')),
      period_start: common.period_start, period_end: common.period_end,
      metric_scope: PPG_PHASE1_text_(PPG_PHASE1_rowValue_(row, 'metric_scope')),
      gross_gmv: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'gross_gmv')),
      confirmed_gmv: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'confirmed_gmv')),
      orders: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'orders')),
      units: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'units')),
      visitors: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'visitors')),
      refund_gmv: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'refund_gmv')),
      cancelled_gmv: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'cancelled_gmv')),
      source_file: common.source_file
    };
  }
  if (sheetName === 'Product_Period') {
    return {
      record_key: common.record_key, batch_id: common.batch_id, platform: common.platform,
      sku: PPG_PHASE1_text_(PPG_PHASE1_rowValue_(row, 'sku')),
      product_name: PPG_PHASE1_text_(PPG_PHASE1_rowValue_(row, 'product_name')),
      period_start: common.period_start, period_end: common.period_end,
      sales_gmv: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'sales_gmv')),
      ordered_gmv: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'ordered_gmv')),
      orders: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'orders')),
      units: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'units')),
      buyers: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'buyers')),
      views: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'views')),
      clicks: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'clicks')),
      ctr: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'ctr')),
      conversion_rate: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'conversion_rate')),
      aov: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'aov')),
      source_file: common.source_file
    };
  }
  if (sheetName === 'Ads_Period') {
    return {
      record_key: common.record_key, batch_id: common.batch_id, platform: common.platform,
      campaign_name: PPG_PHASE1_text_(PPG_PHASE1_rowValue_(row, 'campaign_name')),
      period_start: common.period_start, period_end: common.period_end,
      spend: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'spend')),
      attributed_sales: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'attributed_sales')),
      roas: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'roas')),
      impressions: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'impressions')),
      clicks: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'clicks')),
      orders: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'orders')),
      source_file: common.source_file
    };
  }
  if (sheetName === 'Traffic_Period') {
    return {
      record_key: common.record_key, batch_id: common.batch_id, platform: common.platform,
      traffic_source: PPG_PHASE1_text_(PPG_PHASE1_rowValue_(row, 'traffic_source')),
      period_start: common.period_start, period_end: common.period_end,
      sales_gmv: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'sales_gmv')),
      visitors: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'visitors')),
      clicks: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'clicks')),
      views: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'views')),
      source_file: common.source_file
    };
  }
  return {
    record_key: common.record_key, batch_id: common.batch_id, platform: common.platform,
    creator_name: PPG_PHASE1_text_(PPG_PHASE1_rowValue_(row, 'creator_name')),
    period_start: common.period_start, period_end: common.period_end,
    gmv: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'gmv')),
    orders: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'orders')),
    units: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'units')),
    refunds: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'refunds')),
    commission: PPG_PHASE1_number_(PPG_PHASE1_rowValue_(row, 'commission')),
    source_file: common.source_file
  };
}

function PPG_PHASE1_datesForSource_(sheetName, rows) {
  var dates = [];
  (rows || []).forEach(function(row) {
    var start = sheetName === 'Daily_Sales' ? row.sales_date : row.period_start;
    var end = sheetName === 'Daily_Sales' ? row.sales_date : row.period_end;
    if (start && dates.indexOf(start) < 0) dates.push(start);
    if (end && dates.indexOf(end) < 0) dates.push(end);
  });
  return dates.sort();
}

function PPG_PHASE1_availability_(sheetName, rows) {
  var dates = PPG_PHASE1_datesForSource_(sheetName, rows);
  var source = {
    available: true,
    rowCount: rows.length,
    minDate: dates.length ? dates[0] : null,
    maxDate: dates.length ? dates[dates.length - 1] : null,
    dataThrough: dates.length ? dates[dates.length - 1] : null,
    error: null
  };
  return source;
}

function PPG_PHASE1_emptyAvailability_(code) {
  return { available: false, rowCount: 0, minDate: null, maxDate: null, dataThrough: null, error: code };
}

function PPG_PHASE1_buildCoverage_(rowsBySource, dataThroughHint) {
  var availability = {};
  var allDates = [];
  PPG_PHASE1_viewTabs_().forEach(function(sheetName) {
    var rows = rowsBySource[sheetName] || [];
    availability[sheetName] = PPG_PHASE1_availability_(sheetName, rows);
    PPG_PHASE1_datesForSource_(sheetName, rows).forEach(function(date) {
      if (allDates.indexOf(date) < 0) allDates.push(date);
    });
  });
  allDates.sort();
  var dailyAvailability = availability.Daily_Sales || PPG_PHASE1_emptyAvailability_('SOURCE_READ_FAILED');
  var hint = PPG_PHASE1_date_(dataThroughHint);
  // Data Through describes the latest coverage in the authorized dataset,
  // not the selected query and not only the Daily_Sales view.
  var dataThrough = allDates.length ? allDates[allDates.length - 1] : (dailyAvailability.dataThrough || hint);
  var minDate = dailyAvailability.minDate || (allDates.length ? allDates[0] : dataThrough);
  var maxDate = dailyAvailability.maxDate || (allDates.length ? allDates[allDates.length - 1] : dataThrough);
  return {
    minDate: minDate || null,
    maxDate: maxDate || null,
    dataThrough: dataThrough || null,
    dates: allDates,
    platforms: PPG_PHASE1_platforms_(rowsBySource),
    bySource: availability
  };
}

function PPG_PHASE1_platforms_(rowsBySource) {
  var platforms = [];
  PPG_PHASE1_viewTabs_().forEach(function(sheetName) {
    (rowsBySource[sheetName] || []).forEach(function(row) {
      if (row.platform && platforms.indexOf(row.platform) < 0) platforms.push(row.platform);
    });
  });
  return platforms.sort();
}

function PPG_PHASE1_expectedPlatforms_(platforms) {
  var expected = [];
  (Array.isArray(platforms) ? platforms : []).forEach(function(platform) {
    var normalized = PPG_PHASE1_platform_(platform);
    if (normalized && expected.indexOf(normalized) < 0) expected.push(normalized);
  });
  return expected.sort();
}

function PPG_PHASE1_addDays_(isoDate, offset) {
  var date = new Date(isoDate + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function PPG_PHASE1_daysBetween_(start, end) {
  return Math.round((new Date(end + 'T00:00:00Z') - new Date(start + 'T00:00:00Z')) / 86400000) + 1;
}

function PPG_PHASE1_buildPeriods_(minDate, maxDate) {
  if (!minDate || !maxDate) return [];
  var start7 = PPG_PHASE1_addDays_(maxDate, -6);
  var start30 = PPG_PHASE1_addDays_(maxDate, -29);
  if (start7 < minDate) start7 = minDate;
  if (start30 < minDate) start30 = minDate;
  var periods = [
    { id: 'last7', label: start7 + '\u2013' + maxDate, start: start7, end: maxDate },
    { id: 'last30', label: '30 \u0e27\u0e31\u0e19\u0e25\u0e48\u0e32\u0e2a\u0e38\u0e14 (' + start30 + '\u2013' + maxDate + ')', start: start30, end: maxDate }
  ];
  var cursor = new Date(maxDate.slice(0, 7) + '-01T00:00:00Z');
  var floor = new Date(minDate.slice(0, 7) + '-01T00:00:00Z');
  while (cursor >= floor) {
    var year = cursor.getUTCFullYear();
    var month = String(cursor.getUTCMonth() + 1);
    if (month.length < 2) month = '0' + month;
    var monthStart = year + '-' + month + '-01';
    var monthEndDate = new Date(Date.UTC(year, cursor.getUTCMonth() + 1, 0));
    var monthEnd = monthEndDate.toISOString().slice(0, 10);
    if (monthStart < minDate) monthStart = minDate;
    if (monthEnd > maxDate) monthEnd = maxDate;
    periods.push({ id: year + '-' + month, label: month + '/' + year, start: monthStart, end: monthEnd });
    cursor.setUTCMonth(cursor.getUTCMonth() - 1);
  }
  periods.push({ id: 'all', label: '\u0e23\u0e27\u0e21\u0e17\u0e38\u0e01\u0e0a\u0e48\u0e27\u0e07\u0e40\u0e27\u0e25\u0e32 (' + minDate + '\u2013' + maxDate + ')', start: minDate, end: maxDate });
  return periods;
}

function PPG_PHASE1_summary_(rows) {
  var fields = ['confirmed_gmv', 'orders', 'units'];
  var summary = {}, availability = {};
  fields.forEach(function(field) {
    summary[field] = null;
    availability[field] = false;
  });
  (rows || []).forEach(function(row) {
    fields.forEach(function(field) {
      if (typeof row[field] === 'number' && isFinite(row[field])) {
        summary[field] = summary[field] === null ? row[field] : summary[field] + row[field];
        availability[field] = true;
      }
    });
  });
  return { summary: summary, summaryAvailability: availability };
}

function PPG_PHASE1_periodCoverage_(rows, start, end, expectedPlatforms) {
  var hasExpectedPlatforms = Array.isArray(expectedPlatforms);
  var normalizedExpectedPlatforms = hasExpectedPlatforms ? PPG_PHASE1_expectedPlatforms_(expectedPlatforms) : null;
  var byDate = {};
  (rows || []).forEach(function(row) {
    var date = row && row.sales_date;
    if (!date || date < start || date > end) return;
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(row);
  });
  var expectedDates = [];
  var coveredDates = [];
  var missingDates = [];
  var usableConfirmedGmvDates = [];
  var missingConfirmedGmvDates = [];
  var missingPlatformCoverage = [];
  var coveredPlatforms = [];
  var expectedDays = PPG_PHASE1_daysBetween_(start, end);
  for (var index = 0; index < expectedDays; index += 1) {
    var date = PPG_PHASE1_addDays_(start, index);
    expectedDates.push(date);
    var dayRows = byDate[date] || [];
    if (!dayRows.length) {
      missingDates.push(date);
      if (hasExpectedPlatforms) {
        normalizedExpectedPlatforms.forEach(function(platform) {
          missingPlatformCoverage.push({ date: date, platform: platform });
        });
      }
      continue;
    }
    coveredDates.push(date);
    var dayPlatforms = [];
    dayRows.forEach(function(row) {
      if (row.platform && dayPlatforms.indexOf(row.platform) < 0) dayPlatforms.push(row.platform);
      if (row.platform && coveredPlatforms.indexOf(row.platform) < 0) coveredPlatforms.push(row.platform);
    });
    if (hasExpectedPlatforms) {
      normalizedExpectedPlatforms.forEach(function(platform) {
        if (dayPlatforms.indexOf(platform) < 0) missingPlatformCoverage.push({ date: date, platform: platform });
      });
    }
    var metricRows = hasExpectedPlatforms ? dayRows.filter(function(row) {
      return normalizedExpectedPlatforms.indexOf(row.platform) >= 0;
    }) : dayRows;
    var usable = metricRows.length > 0 && metricRows.every(function(row) {
      return typeof row.confirmed_gmv === 'number' && isFinite(row.confirmed_gmv);
    });
    if (usable) usableConfirmedGmvDates.push(date);
    else if (metricRows.length) missingConfirmedGmvDates.push(date);
  }
  return {
    start: start,
    end: end,
    expectedDays: expectedDays,
    expectedDates: expectedDates,
    coveredDays: coveredDates.length,
    coveredDates: coveredDates,
    missingDates: missingDates,
    expectedPlatforms: normalizedExpectedPlatforms,
    coveredPlatforms: coveredPlatforms.sort(),
    missingPlatforms: missingPlatformCoverage.reduce(function(platforms, missing) {
      if (platforms.indexOf(missing.platform) < 0) platforms.push(missing.platform);
      return platforms;
    }, []).sort(),
    missingPlatformCoverage: missingPlatformCoverage,
    completePlatformCoverage: missingPlatformCoverage.length === 0,
    usableConfirmedGmvDays: usableConfirmedGmvDates.length,
    usableConfirmedGmvDates: usableConfirmedGmvDates,
    missingConfirmedGmvDates: missingConfirmedGmvDates,
    completeCoverage: missingDates.length === 0 && missingPlatformCoverage.length === 0,
    confirmedGmvComplete: missingDates.length === 0 && missingPlatformCoverage.length === 0 && missingConfirmedGmvDates.length === 0,
    coverageReason: missingDates.length ? 'MISSING_DATE' : (missingPlatformCoverage.length ? 'MISSING_PLATFORM_COVERAGE' : (missingConfirmedGmvDates.length ? 'MISSING_CONFIRMED_GMV' : null))
  };
}

function PPG_PHASE1_completeDates_(rows, start, end) {
  return PPG_PHASE1_periodCoverage_(rows, start, end).completeCoverage;
}

function PPG_PHASE1_comparisonSide_(rows, start, end, expectedPlatforms) {
  var coverage = PPG_PHASE1_periodCoverage_(rows, start, end, expectedPlatforms);
  var summary = PPG_PHASE1_summary_(rows);
  if (!coverage.confirmedGmvComplete) {
    Object.keys(summary.summary).forEach(function(field) {
      summary.summary[field] = null;
      summary.summaryAvailability[field] = false;
    });
  }
  return {
    start: start,
    end: end,
    completeCoverage: coverage.completeCoverage,
    confirmedGmvComplete: coverage.confirmedGmvComplete,
    coverageReason: coverage.coverageReason,
    reason: coverage.coverageReason,
    expectedDays: coverage.expectedDays,
    coveredDays: coverage.coveredDays,
    missingDates: coverage.missingDates,
    missingConfirmedGmvDates: coverage.missingConfirmedGmvDates,
    expectedPlatforms: coverage.expectedPlatforms,
    coveredPlatforms: coverage.coveredPlatforms,
    missingPlatforms: coverage.missingPlatforms,
    missingPlatformCoverage: coverage.missingPlatformCoverage,
    coverage: coverage,
    summary: summary.summary,
    summaryAvailability: summary.summaryAvailability
  };
}

function PPG_PHASE1_comparison_(dailyRows, start, end, expectedPlatforms) {
  var days = PPG_PHASE1_daysBetween_(start, end);
  var previousStart = PPG_PHASE1_addDays_(start, -days);
  var previousEnd = PPG_PHASE1_addDays_(start, -1);
  var current = (dailyRows || []).filter(function(row) { return row.sales_date >= start && row.sales_date <= end; });
  var previous = (dailyRows || []).filter(function(row) { return row.sales_date >= previousStart && row.sales_date <= previousEnd; });
  var currentSide = PPG_PHASE1_comparisonSide_(current, start, end, expectedPlatforms);
  var previousSide = PPG_PHASE1_comparisonSide_(previous, previousStart, previousEnd, expectedPlatforms);
  var available = currentSide.confirmedGmvComplete && previousSide.confirmedGmvComplete;
  var reasons = [];
  if (currentSide.coverage.missingDates.length) reasons.push('MISSING_CURRENT_DATE');
  if (previousSide.coverage.missingDates.length) reasons.push('MISSING_PREVIOUS_DATE');
  if (currentSide.coverage.missingPlatformCoverage.length) reasons.push('MISSING_CURRENT_PLATFORM');
  if (previousSide.coverage.missingPlatformCoverage.length) reasons.push('MISSING_PREVIOUS_PLATFORM');
  if (currentSide.coverage.missingConfirmedGmvDates.length) reasons.push('MISSING_CURRENT_GMV');
  if (previousSide.coverage.missingConfirmedGmvDates.length) reasons.push('MISSING_PREVIOUS_GMV');
  if (!reasons.length && !available) reasons.push('NO_COMPARABLE_COVERAGE');
  var hasDateIssue = reasons.some(function(reason) { return reason.indexOf('_DATE') >= 0; });
  var hasPlatformIssue = reasons.some(function(reason) { return reason.indexOf('_PLATFORM') >= 0; });
  var hasGmvIssue = reasons.some(function(reason) { return reason.indexOf('_GMV') >= 0; });
  var issueKinds = [hasDateIssue, hasPlatformIssue, hasGmvIssue].filter(function(hasIssue) { return hasIssue; }).length;
  var reason = null;
  if (!available) {
    if (issueKinds > 1) reason = 'INCOMPLETE_COVERAGE';
    else if (hasDateIssue) reason = reasons.length === 1 ? reasons[0] : 'INCOMPLETE_COVERAGE';
    else if (hasPlatformIssue) reason = 'MISSING_PLATFORM_COVERAGE';
    else if (hasGmvIssue) reason = 'MISSING_CONFIRMED_GMV';
    else reason = reasons[0];
  }
  return {
    available: available,
    reason: reason,
    reasons: reasons,
    metric: 'confirmed_gmv',
    coverage: { current: currentSide.coverage, previous: previousSide.coverage },
    current: currentSide,
    previous: previousSide
  };
}

function PPG_PHASE1_platformRows_(rows, platform) {
  if (!platform) return (rows || []).slice();
  return (rows || []).filter(function(row) { return row.platform === platform; });
}

function PPG_PHASE1_buildLiveModel_(tables, user) {
  var rowsBySource = {};
  PPG_PHASE1_viewTabs_().forEach(function(sheetName) {
    var sourceRows = tables[sheetName] || [];
    rowsBySource[sheetName] = sourceRows.map(function(row) { return PPG_PHASE1_transformRow_(sheetName, row); });
  });
  var coverage = PPG_PHASE1_buildCoverage_(rowsBySource);
  var periods = PPG_PHASE1_buildPeriods_(coverage.minDate, coverage.maxDate);
  coverage.periods = periods;
  return {
    mode: 'LIVE',
    readOnly: true,
    user: { userId: user.userId, workspaceId: user.workspaceId, email: user.email, role: user.role, isActive: true },
    approvedViewTabs: PPG_PHASE1_viewTabs_(),
    sourceAvailability: coverage.bySource,
    coverage: coverage,
    dataThrough: coverage.dataThrough,
    periods: periods,
    rows: rowsBySource,
    source: { mode: 'LIVE', label: 'Secured Read Model', source: 'approved view tabs', snapshotDate: null },
    warnings: []
  };
}

function PPG_PHASE1_snapshotValue_(snapshot) {
  var value = snapshot;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  if (value.ok === true && value.data && typeof value.data === 'object') {
    var envelope = value;
    var nested = value.data;
    value = {};
    Object.keys(nested).forEach(function(key) { value[key] = nested[key]; });
    if (!value.meta && envelope.meta) value.meta = envelope.meta;
    if (!value.source && envelope.source) value.source = envelope.source;
    if (!value.snapshotDate && envelope.snapshotDate) value.snapshotDate = envelope.snapshotDate;
    if (!value.captureDate && envelope.captureDate) value.captureDate = envelope.captureDate;
    if (!value.capturedAt && envelope.capturedAt) value.capturedAt = envelope.capturedAt;
  }
  if (value && value.data && typeof value.data === 'object' && !value.daily && !value.products && !value.rows) {
    var wrapper = value;
    var wrapped = value.data;
    value = {};
    Object.keys(wrapped).forEach(function(key) { value[key] = wrapped[key]; });
    if (!value.meta && wrapper.meta) value.meta = wrapper.meta;
    if (!value.source && wrapper.source) value.source = wrapper.source;
    if (!value.snapshotDate && wrapper.snapshotDate) value.snapshotDate = wrapper.snapshotDate;
    if (!value.captureDate && wrapper.captureDate) value.captureDate = wrapper.captureDate;
    if (!value.capturedAt && wrapper.capturedAt) value.capturedAt = wrapper.capturedAt;
  }
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function PPG_PHASE1_snapshotRows_(value) {
  var rows = value.rows && typeof value.rows === 'object' && !Array.isArray(value.rows) ? value.rows : {};
  var aliases = {
    Daily_Sales: ['daily', 'Daily_Sales', 'dailySales'],
    Product_Period: ['products', 'Product_Period', 'productPeriod'],
    Ads_Period: ['ads', 'Ads_Period', 'adsPeriod'],
    Traffic_Period: ['traffic', 'Traffic_Period', 'trafficPeriod'],
    Creator_Period: ['creators', 'Creator_Period', 'creatorPeriod']
  };
  var result = {};
  var valid = true;
  PPG_PHASE1_viewTabs_().forEach(function(sheetName) {
    var sourceRows = null;
    aliases[sheetName].some(function(alias) {
      if (Array.isArray(value[alias])) {
        sourceRows = value[alias];
        return true;
      }
      if (Array.isArray(rows[alias])) {
        sourceRows = rows[alias];
        return true;
      }
      return false;
    });
    if (!Array.isArray(sourceRows)) {
      valid = false;
      return;
    }
    if (sourceRows.some(function(row) { return !row || typeof row !== 'object' || Array.isArray(row); })) {
      valid = false;
      return;
    }
    result[sheetName] = sourceRows.map(function(row) { return PPG_PHASE1_transformRow_(sheetName, row); });
  });
  return valid ? result : null;
}

function PPG_PHASE1_snapshotMetadata_(value) {
  var meta = value.meta && typeof value.meta === 'object' ? value.meta : {};
  var fallback = value.fallback && typeof value.fallback === 'object' ? value.fallback : {};
  var rawSource = value.source || meta.source || fallback.source;
  if (rawSource && typeof rawSource === 'object') {
    rawSource = rawSource.source || rawSource.name || rawSource.label;
  }
  var source = PPG_PHASE1_text_(rawSource);
  var rawSnapshotDate = value.snapshotDate || value.snapshot_date || value.captureDate || value.capture_date || value.capturedAt || value.captured_at || meta.snapshotDate || meta.snapshot_date || meta.captureDate || meta.capture_date || meta.capturedAt || meta.captured_at || fallback.snapshotDate || fallback.captureDate || fallback.capturedAt;
  var snapshotDate = PPG_PHASE1_date_(rawSnapshotDate);
  var coverage = value.coverage && typeof value.coverage === 'object' ? value.coverage : {};
  var dataThrough = PPG_PHASE1_date_(value.dataThrough || value.data_through || meta.dataThrough || meta.data_through || fallback.dataThrough || coverage.dataThrough || coverage.data_through || coverage.maxDate || coverage.max_date);
  if (!source || !snapshotDate) return null;
  return {
    source: source,
    snapshotDate: snapshotDate,
    capturedAt: snapshotDate,
    captureDate: snapshotDate,
    dataThrough: dataThrough
  };
}

function PPG_PHASE1_snapshotSourceErrors_(sourceErrors) {
  return (sourceErrors || []).map(function(sourceError) {
    var source = PPG_PHASE1_viewTabs_().indexOf(sourceError && sourceError.source) >= 0 ? sourceError.source : 'approved view';
    return {
      source: source,
      code: PPG_PHASE1_errorCode_(sourceError),
      reason: 'SOURCE_UNAVAILABLE'
    };
  });
}

function PPG_PHASE1_snapshotModel_(snapshot, user, sourceErrors) {
  var value = PPG_PHASE1_snapshotValue_(snapshot);
  var metadata = PPG_PHASE1_snapshotMetadata_(value);
  var snapshotRows = PPG_PHASE1_snapshotRows_(value);
  if (!metadata || !snapshotRows) throw PPG_PHASE1_error_('SOURCE_READ_FAILED');
  var coverage = PPG_PHASE1_buildCoverage_(snapshotRows, metadata.dataThrough);
  var availability = coverage.bySource;
  PPG_PHASE1_viewTabs_().forEach(function(sheetName) {
    availability[sheetName].mode = 'HISTORICAL_SNAPSHOT';
  });
  coverage.periods = PPG_PHASE1_buildPeriods_(coverage.minDate, coverage.maxDate);
  var fallback = {
    mode: 'HISTORICAL_SNAPSHOT',
    label: 'Historical Snapshot',
    source: metadata.source,
    snapshotDate: metadata.snapshotDate,
    capturedAt: metadata.capturedAt,
    captureDate: metadata.captureDate,
    dataThrough: coverage.dataThrough,
    sourceErrors: PPG_PHASE1_snapshotSourceErrors_(sourceErrors)
  };
  return {
    mode: 'HISTORICAL_SNAPSHOT',
    readOnly: true,
    user: { userId: user.userId, workspaceId: user.workspaceId, email: user.email, role: user.role, isActive: true },
    approvedViewTabs: PPG_PHASE1_viewTabs_(),
    sourceAvailability: availability,
    coverage: coverage,
    dataThrough: coverage.dataThrough,
    periods: coverage.periods,
    rows: snapshotRows,
    source: fallback,
    snapshot: fallback,
    warnings: ['HISTORICAL_SNAPSHOT']
  };
}

function PPG_PHASE1_readModel_(user) {
  var tables = {}, errors = [], availability = {};
  PPG_PHASE1_viewTabs_().forEach(function(sheetName) {
    try {
      var table = PPG_PHASE1_readTable_(sheetName);
      tables[sheetName] = table.rows;
      availability[sheetName] = { available: true, rowCount: table.rows.length, error: null };
    } catch (error) {
      var code = PPG_PHASE1_errorCode_(error);
      errors.push({ source: sheetName, code: code, reason: 'SOURCE_UNAVAILABLE' });
      availability[sheetName] = PPG_PHASE1_emptyAvailability_(code);
    }
  });
  if (!errors.length) return PPG_PHASE1_buildLiveModel_(tables, user);
  var snapshotProvider = PPG_RPC_DEPS_.historicalSnapshot;
  if (snapshotProvider !== undefined && snapshotProvider !== null) {
    try {
      var snapshot = typeof snapshotProvider === 'function' ? snapshotProvider() : snapshotProvider;
      if (snapshot) return PPG_PHASE1_snapshotModel_(snapshot, user, errors);
    } catch (snapshotError) {
      // Snapshot failures are intentionally collapsed into the original source error.
    }
  }
  var failure = PPG_PHASE1_error_(errors[0].code, { sources: errors });
  failure.sourceAvailability = availability;
  throw failure;
}

function PPG_PHASE1_filterRows_(sheetName, rows, query) {
  var platform = query.platform || null;
  return (rows || []).filter(function(row) {
    if (platform && row.platform !== platform) return false;
    if (sheetName === 'Daily_Sales') {
      return row.sales_date && row.sales_date >= query.start && row.sales_date <= query.end;
    }
    return row.period_start && row.period_end && row.period_start >= query.start && row.period_end <= query.end;
  });
}

function PPG_PHASE1_data_(model, query) {
  var rows = model.rows || {};
  var daily = PPG_PHASE1_filterRows_('Daily_Sales', rows.Daily_Sales, query);
  var products = PPG_PHASE1_filterRows_('Product_Period', rows.Product_Period, query);
  var ads = PPG_PHASE1_filterRows_('Ads_Period', rows.Ads_Period, query);
  var traffic = PPG_PHASE1_filterRows_('Traffic_Period', rows.Traffic_Period, query);
  var creators = PPG_PHASE1_filterRows_('Creator_Period', rows.Creator_Period, query);
  // Sales comparison authority comes from Daily_Sales only. A platform that
  // exists solely in another source family must not create false Sales gaps.
  var expectedPlatforms = query.platform ? null : PPG_PHASE1_platforms_({ Daily_Sales: rows.Daily_Sales || [] });
  var salesSummary = PPG_PHASE1_summary_(daily);
  var salesCoverage = PPG_PHASE1_periodCoverage_(daily, query.start, query.end, expectedPlatforms);
  if (!salesCoverage.confirmedGmvComplete) {
    salesSummary.summary.confirmed_gmv = null;
    salesSummary.summaryAvailability.confirmed_gmv = false;
  }
  var dataThrough = model.dataThrough || (model.coverage && model.coverage.dataThrough) || null;
  var activeSource = model.source || {
    mode: model.mode,
    label: model.mode === 'HISTORICAL_SNAPSHOT' ? 'Historical Snapshot' : 'Secured Read Model',
    source: model.mode === 'HISTORICAL_SNAPSHOT' ? 'approved server-side snapshot' : 'approved view tabs',
    snapshotDate: null
  };
  var data = {
    mode: model.mode,
    readOnly: true,
    range: { start: query.start, end: query.end },
    platform: query.platform || 'all',
    daily: daily,
    products: products,
    ads: ads,
    traffic: traffic,
    creators: creators,
    source: activeSource,
    sourceAvailability: model.sourceAvailability,
    coverage: model.coverage,
    dataThrough: dataThrough,
    comparison: PPG_PHASE1_comparison_(PPG_PHASE1_platformRows_(model.rows.Daily_Sales || [], query.platform), query.start, query.end, expectedPlatforms),
    sales: {
      summary: salesSummary.summary,
      summaryAvailability: salesSummary.summaryAvailability,
      coverage: salesCoverage,
      reason: salesCoverage.coverageReason,
      dailyTrend: daily.map(function(row) { return { date: row.sales_date, confirmed_gmv: row.confirmed_gmv, orders: row.orders, units: row.units }; })
    },
    meta: {
      dataThrough: dataThrough,
      sourceMode: model.mode,
      readOnly: true,
      generatedAt: new Date().toISOString(),
      snapshotSource: model.snapshot ? model.snapshot.source : null,
      snapshotDate: model.snapshot ? model.snapshot.snapshotDate : null
    }
  };
  if (model.snapshot) data.fallback = model.snapshot;
  return data;
}
