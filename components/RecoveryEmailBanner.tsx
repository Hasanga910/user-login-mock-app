import Link from 'next/link';
import type { PublicUser } from '@/lib/types';

/** Prompts password users who onboarded before recovery emails existed to add one. */
export default function RecoveryEmailBanner({ user }: { user: Pick<PublicUser, 'auth_provider' | 'email'> }) {
  if (user.auth_provider !== 'password' || user.email) return null;
  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <p className="mx-auto max-w-7xl px-6 py-2 text-sm text-amber-800">
        <Link href="/account/email" className="font-medium underline hover:text-amber-900">
          Add a recovery email so you can reset your password
        </Link>
      </p>
    </div>
  );
}
