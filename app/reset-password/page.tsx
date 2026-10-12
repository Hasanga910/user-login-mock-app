import type { Metadata } from 'next';
import AuthCard from '@/components/AuthCard';
import { getResetTokenUser, isValidResetToken } from '@/lib/passwordReset';
import { strengthUserInputs } from '@/lib/passwordStrength';
import InvalidLink from './InvalidLink';
import ResetPasswordForm from './ResetPasswordForm';

// The token is in the URL; don't leak it to other sites via the Referer header.
export const metadata: Metadata = { referrer: 'no-referrer' };

async function checkToken(token: string | undefined): Promise<boolean> {
  if (!token || token.length > 200) return false;
  try {
    return await isValidResetToken(token);
  } catch (err) {
    console.error('Reset token check failed', err);
    return false;
  }
}

// The account's username/email, so the strength bar can penalise passwords that contain them.
async function userInputsFor(token: string): Promise<string[]> {
  try {
    const user = await getResetTokenUser(token);
    return strengthUserInputs(user?.username, user?.email);
  } catch (err) {
    console.error('Reset token user lookup failed', err);
    return [];
  }
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token: raw } = await searchParams;
  const token = typeof raw === 'string' ? raw : undefined;
  const valid = await checkToken(token);
  const userInputs = valid && token ? await userInputsFor(token) : [];

  return (
    <AuthCard title="Reset your password" subtitle={valid ? 'Choose a new password for your account.' : undefined}>
      {valid && token ? <ResetPasswordForm token={token} userInputs={userInputs} /> : <InvalidLink />}
    </AuthCard>
  );
}
