import Link from 'next/link';
import AuthCard from '@/components/AuthCard';
import ForgotPasswordForm from './ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot password"
      subtitle="Enter your username or recovery email and we'll send you a link to reset your password."
    >
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-gray-500 hover:underline">Back to log in</Link>
      </p>
    </AuthCard>
  );
}
