import Link from 'next/link';
import AuthCard from '@/components/AuthCard';
import SignupForm from './SignupForm';

export default function SignupPage() {
  return (
    <AuthCard title="Create an account" subtitle="Sign up with a username and password.">
      <SignupForm />
      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">Log in</Link>
      </p>
    </AuthCard>
  );
}
