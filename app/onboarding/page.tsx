import { redirect } from 'next/navigation';
import AuthCard from '@/components/AuthCard';
import LogoutButton from '@/components/LogoutButton';
import { requireUser } from '@/lib/auth';
import { dashboardFor } from '@/lib/roles';
import OnboardingForm from './OnboardingForm';

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.profile_completed && user.role) redirect(dashboardFor(user.role));

  return (
    <AuthCard title="Complete your profile" subtitle="Tell us a bit about yourself to finish setting up your account.">
      <OnboardingForm
        defaults={{
          // Microsoft users get these pre-filled from their profile claims at first login.
          firstName: user.first_name ?? '',
          lastName: user.last_name ?? '',
          company: user.company ?? '',
        }}
        // Microsoft users already have their email from Microsoft; password users need a recovery email.
        showEmail={user.auth_provider === 'password'}
      />
      <div className="mt-6 flex justify-center">
        <LogoutButton className="text-sm text-gray-500 hover:underline" />
      </div>
    </AuthCard>
  );
}
