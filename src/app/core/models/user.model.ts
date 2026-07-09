export type UserRole = 'admin' | 'client';

export interface UserProfile {
  id: number;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone?: string;
}
