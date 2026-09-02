var PPG_CONFIG = {
  schemaVersion: 1,
  timezone: 'Asia/Bangkok',
  currency: 'THB',
  phaseMode: 'READ_ONLY',
  allowlistTab: 'Users',
  expectedWorkspaceProperty: 'PPG_EXPECTED_WORKSPACE_ID',
  approvedViewTabs: ['Daily_Sales', 'Product_Period', 'Ads_Period', 'Traffic_Period', 'Creator_Period'],
  historicalSnapshotScope: 'HISTORICAL_SNAPSHOT',
  roles: ['EXECUTIVE', 'ANALYST', 'OPERATOR', 'ADMIN'],
  acceptedBatchStatuses: ['ACCEPTED'],
  batchLifecycleStatuses: ['PENDING', 'VALIDATED', 'ACCEPTED', 'REJECTED', 'FINALIZED', 'SUPERSEDED'],
  finalBatchStatuses: ['FINALIZED', 'SUPERSEDED']
};
