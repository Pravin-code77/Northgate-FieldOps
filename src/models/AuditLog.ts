export interface AuditLog {
  id: number;
  user_id: number | null;
  event_type: string;
  detail: string;
  created_at: string;
}

export interface DashboardCache {
  metric_key: string;
  metric_value: string;
  computed_at: string;
}

export interface SettingItem {
  key: string;
  value: string;
}

export interface DashboardMetrics {
  completedJobs: number;
  pendingJobs: number;
  inProgressJobs: number;
  overdueJobs: number;
  todayCompletedJobs: number;
  totalAssets: number;
  pendingAssets: number;
  failedSyncs: number;
  pendingSyncQueue: number;
  lastSuccessfulSync: string | null;
  recentActivity: Array<{
    id: string;
    type: 'audit' | 'outbound';
    title: string;
    detail: string;
    timestamp: string;
    status?: string;
  }>;
  statusChart: {
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
}
