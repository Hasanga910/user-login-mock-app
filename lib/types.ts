import type { Role } from './roles';

export type AuthProvider = 'password' | 'microsoft';

/** User shape safe to use anywhere on the server and render to the client. Never includes password_hash. */
export type PublicUser = {
  id: string;
  username: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  role: Role | null;
  auth_provider: AuthProvider;
  profile_completed: boolean;
  created_at: string;
  last_login_at: string | null;
  password_changed_at: string | null;
};

/** Explicit column list for selects — excludes password_hash and microsoft_oid. */
export const PUBLIC_USER_COLUMNS =
  'id, username, email, first_name, last_name, company, role, auth_provider, profile_completed, created_at, last_login_at, password_changed_at';
