import Link from 'next/link';
import { redirect } from 'next/navigation';
import AuthCard from '@/components/AuthCard';
import { homeFor, requireUser } from '@/lib/auth';
import EmailForm from './EmailForm';

export default async function AccountEmailPage() {
  const user = await requireUser();
  // Microsoft users' email comes from Microsoft and they reset their password there.
  if (user.auth_provider !== 'password') redirect(homeFor(user));

  return (
    <AuthCard
      title={user.email ? 'Recovery email' : 'Add a recovery email'}
      subtitle="We'll send a password reset link to this address if you forget your password."
    >
      <EmailForm currentEmail={user.email ?? ''} />
      <p className="mt-6 text-center text-sm">
        <Link href={homeFor(user)} className="text-gray-500 hover:underline">Back to dashboard</Link>
      </p>
    </AuthCard>
  );
}
