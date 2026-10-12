import LogoutButton from '@/components/LogoutButton';
import RecoveryEmailBanner from '@/components/RecoveryEmailBanner';
import StatCard from '@/components/StatCard';
import { requireRole } from '@/lib/auth';
import { getUserStats, listUsersForAdmin } from '@/lib/admin';
import { ROLES } from '@/lib/roles';
import { formatDate, fullName, identifier, loginMethodLabel } from '@/lib/format';

export const dynamic = 'force-dynamic';

const SYSTEM_ACTIVITY = [
  { time: '2 min ago', text: 'Nightly backup completed successfully', level: 'ok' },
  { time: '18 min ago', text: 'Microsoft Entra ID token signing keys refreshed', level: 'ok' },
  { time: '1 hr ago', text: 'Elevated login failures from 203.0.113.42', level: 'warn' },
  { time: '3 hr ago', text: 'Deployed v1.4.2 to production', level: 'ok' },
  { time: 'Yesterday', text: 'Database CPU above 80% for 5 minutes', level: 'warn' },
] as const;

export default async function AdminDashboard() {
  const me = await requireRole('admin');
  const [stats, users] = await Promise.all([getUserStats(), listUsersForAdmin()]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-sm text-slate-400">
              {fullName(me)} · <span className="text-indigo-300">{me.company}</span>
            </p>
          </div>
          <LogoutButton className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500" />
        </div>
      </header>
      <RecoveryEmailBanner user={me} />

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total users" value={stats.total} />
          <StatCard label="Admins vs. users" value={`${stats.admins} / ${stats.users}`} detail="admins / users" />
          <StatCard label="Microsoft vs. password" value={`${stats.microsoft} / ${stats.password}`} detail="sign-up method" />
          <StatCard label="Onboarding incomplete" value={stats.onboardingIncomplete} />
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <section className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800 lg:col-span-2">
            <h2 className="border-b border-slate-700 px-5 py-3 font-semibold text-white">All users</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-900/60 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Username / Email</th>
                    <th className="px-5 py-3">Company</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Login method</th>
                    <th className="px-5 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-700/40">
                      <td className="px-5 py-3 text-white">{fullName(u)}</td>
                      <td className="px-5 py-3 text-slate-300">
                        {identifier(u)}
                        {u.auth_provider === 'password' && (
                          <span className={`block text-xs ${u.email ? 'text-slate-400' : 'italic text-slate-500'}`}>
                            {u.email ?? 'no email'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-300">{u.company ?? '—'}</td>
                      <td className="px-5 py-3">
                        {u.role ? (
                          <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-300">
                            {ROLES[u.role].label}
                          </span>
                        ) : (
                          <span className="text-xs text-amber-400">Pending</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-300">{loginMethodLabel(u.auth_provider)}</td>
                      <td className="px-5 py-3 text-slate-400">{formatDate(u.created_at)}</td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-6 text-center text-slate-400">No users yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-800">
            <h2 className="border-b border-slate-700 px-5 py-3 font-semibold text-white">System activity</h2>
            <ul className="divide-y divide-slate-700">
              {SYSTEM_ACTIVITY.map((a) => (
                <li key={a.text} className="flex gap-3 px-5 py-3">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${a.level === 'warn' ? 'bg-amber-400' : 'bg-indigo-400'}`}
                  />
                  <div>
                    <p className="text-sm text-slate-200">{a.text}</p>
                    <p className="text-xs text-slate-500">{a.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
