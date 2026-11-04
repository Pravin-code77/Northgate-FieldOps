export const WorkOrderStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type WorkOrderStatusType = typeof WorkOrderStatus[keyof typeof WorkOrderStatus];

export const PriorityLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type PriorityLevelType = typeof PriorityLevel[keyof typeof PriorityLevel];

export const AssetStatus = {
  OPERATIONAL: 'operational',
  FAULT: 'fault',
  RETIRED: 'retired',
} as const;

export type AssetStatusType = typeof AssetStatus[keyof typeof AssetStatus];

export const SyncStatus = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  SUCCESS: 'success',
  FAILED: 'failed',
} as const;

export type SyncStatusType = typeof SyncStatus[keyof typeof SyncStatus];

export const PhotoKind = {
  BEFORE: 'before',
  AFTER: 'after',
} as const;

export type PhotoKindType = typeof PhotoKind[keyof typeof PhotoKind];
