// Single source of truth for roles.
// To add a role: add an entry here, create app/dashboard/<role>/page.tsx,
// and extend the `role` check constraint in the database (new migration).

export const ROLES = {
  admin: { label: 'Admin', dashboard: '/dashboard/admin' },
  user: { label: 'User', dashboard: '/dashboard/user' },
} as const;

export type Role = keyof typeof ROLES;

export const ROLE_VALUES = Object.keys(ROLES) as [Role, ...Role[]];

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(ROLES, value);
}

export function dashboardFor(role: Role): string {
  return ROLES[role].dashboard;
}

/** Returns the role whose dashboard owns the given path, if any. */
export function roleForPath(pathname: string): Role | null {
  for (const role of ROLE_VALUES) {
    const base = ROLES[role].dashboard;
    if (pathname === base || pathname.startsWith(`${base}/`)) return role;
  }
  return null;
}
