import 'server-only';
import { db } from './supabase';
import { requireRole } from './auth';
import { PUBLIC_USER_COLUMNS, type PublicUser } from './types';

// Admin-only data. Each function re-checks the role itself, independent of middleware.

export type UserStats = {
  total: number;
  admins: number;
  users: number;
  microsoft: number;
  password: number;
  onboardingIncomplete: number;
};

async function countWhere(column?: string, value?: string | boolean): Promise<number> {
  let query = db().from('users').select('id', { count: 'exact', head: true });
  if (column !== undefined) query = query.eq(column, value);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function getUserStats(): Promise<UserStats> {
  await requireRole('admin');
  const [total, admins, users, microsoft, password, onboardingIncomplete] = await Promise.all([
    countWhere(),
    countWhere('role', 'admin'),
    countWhere('role', 'user'),
    countWhere('auth_provider', 'microsoft'),
    countWhere('auth_provider', 'password'),
    countWhere('profile_completed', false),
  ]);
  return { total, admins, users, microsoft, password, onboardingIncomplete };
}

export async function listUsersForAdmin(): Promise<PublicUser[]> {
  await requireRole('admin');
  const { data, error } = await db()
    .from('users')
    .select(PUBLIC_USER_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as PublicUser[];
}
