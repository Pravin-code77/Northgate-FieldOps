export interface User {
  id: number;
  employee_code: string;
  full_name: string;
  role: string;
  biometric_enrolled: number; // 0 or 1
  created_at: string;
}
