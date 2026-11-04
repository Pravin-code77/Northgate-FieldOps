import { DashboardMetrics } from '../models/AuditLog';
import { getDashboardMetrics } from '../repositories/dashboardRepository';

export async function fetchDashboardData(): Promise<DashboardMetrics> {
  return await getDashboardMetrics();
}
