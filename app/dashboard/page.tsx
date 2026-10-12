import { redirect } from 'next/navigation';
import { homeFor, requireUser } from '@/lib/auth';

export default async function DashboardIndex() {
  const user = await requireUser();
  redirect(homeFor(user));
}
