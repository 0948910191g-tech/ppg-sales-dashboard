function PPG_SCHEMA_manifest_() {
  return {
    Settings: ['Workspace_ID', 'Setting_Key', 'Setting_Value', 'Value_Type', 'Is_Active', 'Created_At', 'Updated_At'],
    Users: ['User_ID', 'Workspace_ID', 'Email', 'Display_Name', 'Role', 'Is_Active', 'Created_At', 'Updated_At'],
    Lists: ['List_ID', 'Workspace_ID', 'List_Type', 'List_Code', 'List_Name', 'Sort_Order', 'Is_Active', 'Created_At', 'Updated_At'],
    Schema_Versions: ['Schema_Version', 'Applied_At', 'Applied_By', 'Notes'],
    DB_Import_Batches: ['Workspace_ID', 'Batch_ID', 'Platform', 'Period_Start', 'Period_End', 'Imported_At', 'Batch_Status', 'Final_Status', 'Created_At', 'Updated_At'],
    DB_Import_Files: ['Workspace_ID', 'Batch_ID', 'Source_File_ID', 'Source_File_Name', 'Source_File_Hash', 'Source_File_Modified_At', 'Source_File_Imported_At', 'Created_At'],
    DB_Import_Errors: ['Workspace_ID', 'Batch_ID', 'Source_File_ID', 'Row_Number', 'Error_Code', 'Error_Message', 'Raw_Record', 'Created_At'],
    Product_Master: ['Workspace_ID', 'Product_ID', 'Platform_Product_ID', 'SKU_ID', 'Product_Name', 'Brand', 'Category', 'Is_Active', 'Created_At', 'Updated_At'],
    DB_Canonical_Daily: ['Workspace_ID', 'Batch_ID', 'Source_File_ID', 'Platform', 'Source_System', 'Metric_Date', 'Metric_Scope', 'Period_Start', 'Period_End', 'Provenance_Captured_At', 'Imported_At', 'Canonical_Eligible', 'GMV', 'Orders', 'Units', 'Buyers', 'Visitors', 'Refund_Value', 'AOV', 'Conversion_Rate', 'Currency', 'Created_At', 'Updated_At'],
    DB_Product_Period: ['Workspace_ID', 'Batch_ID', 'Source_File_ID', 'Platform', 'Source_System', 'Period_Start', 'Period_End', 'Provenance_Captured_At', 'Imported_At', 'Product_ID', 'GMV', 'Orders', 'Units', 'Buyers', 'Refund_Value', 'Created_At', 'Updated_At'],
    DB_Ads_Period: ['Workspace_ID', 'Batch_ID', 'Source_File_ID', 'Platform', 'Source_System', 'Period_Start', 'Period_End', 'Provenance_Captured_At', 'Imported_At', 'Campaign_ID', 'Campaign_Name', 'Spend', 'GMV', 'Orders', 'Impressions', 'Clicks', 'Created_At', 'Updated_At'],
    DB_Traffic_Period: ['Workspace_ID', 'Batch_ID', 'Source_File_ID', 'Platform', 'Source_System', 'Period_Start', 'Period_End', 'Provenance_Captured_At', 'Imported_At', 'Visitors', 'Page_Views', 'Add_To_Cart', 'Conversion_Rate', 'Created_At', 'Updated_At'],
    DB_Creator_Period: ['Workspace_ID', 'Batch_ID', 'Source_File_ID', 'Platform', 'Source_System', 'Period_Start', 'Period_End', 'Provenance_Captured_At', 'Imported_At', 'Creator_ID', 'Creator_Name', 'GMV', 'Orders', 'Units', 'Commission_Value', 'Created_At', 'Updated_At'],
    DB_Competitor_Brand_Period: ['Workspace_ID', 'Batch_ID', 'Source_File_ID', 'Platform', 'Source_System', 'Period_Start', 'Period_End', 'Provenance_Captured_At', 'Imported_At', 'Competitor_Brand', 'GMV', 'Orders', 'Units', 'Rank', 'Created_At', 'Updated_At'],
    DB_Competitor_SKU_Period: ['Workspace_ID', 'Batch_ID', 'Source_File_ID', 'Platform', 'Source_System', 'Period_Start', 'Period_End', 'Provenance_Captured_At', 'Imported_At', 'Competitor_Brand', 'Competitor_SKU', 'GMV', 'Orders', 'Units', 'Rank', 'Created_At', 'Updated_At'],
    Action_Tasks: ['Workspace_ID', 'Action_ID', 'Title', 'Description', 'Owner_User_ID', 'Status', 'Priority', 'Due_Date', 'Created_At', 'Updated_At'],
    Action_History: ['Workspace_ID', 'Action_History_ID', 'Action_ID', 'Event_Type', 'Previous_Value', 'New_Value', 'Actor_User_ID', 'Created_At'],
    Dashboard_Snapshots: ['Workspace_ID', 'Snapshot_ID', 'Period_Start', 'Period_End', 'Data_Through', 'Accepted_Batch_IDs', 'Snapshot_JSON', 'Created_At']
  };
}

function PPG_SCHEMA_plan_(existingHeaderMap) {
  var PPG_manifest = PPG_SCHEMA_manifest_();
  var PPG_existing = existingHeaderMap || {};
  var PPG_plan = { create: [], reuse: [], blocked: [] };
  var PPG_sheetNames = Object.keys(PPG_manifest);

  for (var PPG_index = 0; PPG_index < PPG_sheetNames.length; PPG_index += 1) {
    var PPG_sheetName = PPG_sheetNames[PPG_index];
    var PPG_expected = PPG_manifest[PPG_sheetName];
    if (!Object.prototype.hasOwnProperty.call(PPG_existing, PPG_sheetName)) {
      PPG_plan.create.push(PPG_sheetName);
    } else if (PPG_SCHEMA_headersMatch_(PPG_expected, PPG_existing[PPG_sheetName])) {
      PPG_plan.reuse.push(PPG_sheetName);
    } else {
      PPG_plan.blocked.push({
        sheetName: PPG_sheetName,
        expected: PPG_expected.slice(),
        actual: Array.isArray(PPG_existing[PPG_sheetName]) ? PPG_existing[PPG_sheetName].slice() : PPG_existing[PPG_sheetName]
      });
    }
  }
  return PPG_plan;
}

function PPG_SCHEMA_headersMatch_(PPG_expected, PPG_actual) {
  if (!Array.isArray(PPG_actual) || PPG_expected.length !== PPG_actual.length) return false;
  for (var PPG_index = 0; PPG_index < PPG_expected.length; PPG_index += 1) {
    if (PPG_expected[PPG_index] !== PPG_actual[PPG_index]) return false;
  }
  return true;
}
