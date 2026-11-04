export interface Session {
  id: number;
  user_id: number;
  started_at: string;
  last_active_at: string;
  expires_at: string;
  status: 'active' | 'expired' | 'terminated';
}
