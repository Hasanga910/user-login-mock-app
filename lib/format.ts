import type { PublicUser } from './types';

export function fullName(u: Pick<PublicUser, 'first_name' | 'last_name'>): string {
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || '—';
}

export function identifier(u: Pick<PublicUser, 'username' | 'email'>): string {
  return u.username ?? u.email ?? '—';
}

export function loginMethodLabel(provider: PublicUser['auth_provider']): string {
  return provider === 'microsoft' ? 'Microsoft' : 'Password';
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
