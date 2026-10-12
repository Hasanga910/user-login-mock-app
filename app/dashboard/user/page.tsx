import LogoutButton from '@/components/LogoutButton';
import RecoveryEmailBanner from '@/components/RecoveryEmailBanner';
import { requireRole } from '@/lib/auth';
import { ROLES } from '@/lib/roles';
import { formatDate, fullName, identifier, loginMethodLabel } from '@/lib/format';

export const dynamic = 'force-dynamic';

const TASKS = [
  { title: 'Review Q3 project brief', due: 'Today', done: false },
  { title: 'Submit timesheet', due: 'Tomorrow', done: false },
  { title: 'Update team wiki page', due: 'Fri', done: true },
  { title: 'Prepare demo for client sync', due: 'Next Mon', done: false },
];

const ACTIVITY = [
  { time: '10:42 AM', text: 'You commented on “Onboarding checklist”' },
  { time: 'Yesterday', text: 'You completed “Update team wiki page”' },
  { time: '2 days ago', text: 'You joined the “Design Review” channel' },
];

const ANNOUNCEMENTS = [
  { title: 'Office closed on Friday', body: 'The office will be closed for maintenance. Remote work is encouraged.' },
  { title: 'New expense tool', body: 'Starting next month, submit expenses through the new portal.' },
];

export default async function UserDashboard() {
  const me = await requireRole('user');

  const profile: [string, string][] = [
    ['Name', fullName(me)],
    [me.username ? 'Username' : 'Email', identifier(me)],
    ...(me.auth_provider === 'password' ? [['Email', me.email ?? '—'] as [string, string]] : []),
    ['Company', me.company ?? '—'],
    ['Role', me.role ? ROLES[me.role].label : '—'],
    ['Login method', loginMethodLabel(me.auth_provider)],
    ['Member since', formatDate(me.created_at)],
    ['Last login', formatDate(me.last_login_at)],
  ];

  return (
    <div className="min-h-screen bg-emerald-50/40">
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-emerald-900">Welcome, {me.first_name}</h1>
            <p className="text-sm text-emerald-700">{me.company}</p>
          </div>
          <LogoutButton className="rounded-md border border-emerald-600 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50" />
        </div>
      </header>
      <RecoveryEmailBanner user={me} />

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-3">
        <section className="rounded-xl border border-emerald-100 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-lg font-semibold text-white">
              {(me.first_name?.[0] ?? '?').toUpperCase()}
              {(me.last_name?.[0] ?? '').toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{fullName(me)}</h2>
              <p className="text-xs text-gray-500">via {loginMethodLabel(me.auth_provider)}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            {profile.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-gray-500">{k}</dt>
                <dd className="truncate text-right font-medium text-gray-900">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-xl border border-emerald-100 bg-white p-6 shadow-xs lg:col-span-2">
          <h2 className="font-semibold text-gray-900">My tasks</h2>
          <ul className="mt-4 divide-y divide-gray-100">
            {TASKS.map((t) => (
              <li key={t.title} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-sm border text-xs ${
                      t.done ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300'
                    }`}
                  >
                    {t.done ? '✓' : ''}
                  </span>
                  <span className={`text-sm ${t.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{t.title}</span>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">{t.due}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-emerald-100 bg-white p-6 shadow-xs lg:col-span-2">
          <h2 className="font-semibold text-gray-900">Recent activity</h2>
          <ol className="mt-4 space-y-4 border-l-2 border-emerald-100 pl-4">
            {ACTIVITY.map((a) => (
              <li key={a.text}>
                <p className="text-sm text-gray-800">{a.text}</p>
                <p className="text-xs text-gray-500">{a.time}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-xl border border-emerald-200 bg-emerald-600 p-6 text-white shadow-xs">
          <h2 className="font-semibold">Announcements</h2>
          <ul className="mt-4 space-y-4">
            {ANNOUNCEMENTS.map((a) => (
              <li key={a.title}>
                <p className="text-sm font-semibold">{a.title}</p>
                <p className="text-sm text-emerald-50">{a.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
