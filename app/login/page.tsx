import Link from 'next/link';
import AuthCard from '@/components/AuthCard';
import MicrosoftButton from '@/components/MicrosoftButton';
import LoginForm from './LoginForm';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ signup?: string; reset?: string; error?: string }>;
}) {
  const { signup, reset, error } = await searchParams;

  return (
    <AuthCard title="Log in" subtitle="Use your username and password, or your Microsoft account.">
      {signup === 'success' && (
        <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Account created. Please log in.
        </p>
      )}
      {reset === 'success' && (
        <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Your password has been reset. Please log in with your new password.
        </p>
      )}
      {error === 'microsoft' && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Microsoft sign-in failed. Please try again.
        </p>
      )}
      <LoginForm />
      <div className="my-6 flex items-center gap-3 text-xs uppercase text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />
        or
        <span className="h-px flex-1 bg-gray-200" />
      </div>
      <MicrosoftButton />
      <p className="mt-2 text-center text-xs text-gray-500">
        Forgot your Microsoft password?{' '}
        <a href="https://account.live.com/password/reset" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          Personal account
        </a>
        {' · '}
        <a href="https://passwordreset.microsoftonline.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          Work or school account
        </a>
      </p>
      <p className="mt-6 text-center text-sm text-gray-600">
        No account?{' '}
        <Link href="/signup" className="font-medium text-blue-600 hover:underline">Sign up</Link>
      </p>
    </AuthCard>
  );
}
