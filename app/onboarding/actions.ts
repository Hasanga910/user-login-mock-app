'use server';

import { redirect } from 'next/navigation';
import { onboardingSchema, passwordOnboardingSchema, fieldErrors, type FieldErrors } from '@/lib/validation';
import { completeProfile, EmailTakenError, passwordEmailInUse } from '@/lib/users';
import { requireUser, setSessionCookie } from '@/lib/auth';
import { dashboardFor, type Role } from '@/lib/roles';

export type OnboardingState = {
  errors?: FieldErrors;
  values?: { firstName: string; lastName: string; company: string; email: string; role: string };
};

const EMAIL_TAKEN = 'This email is already in use';

export async function onboardingAction(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const user = await requireUser();
  if (user.profile_completed && user.role) redirect(dashboardFor(user.role));

  const raw = {
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    company: String(formData.get('company') ?? ''),
    email: String(formData.get('email') ?? ''),
    role: String(formData.get('role') ?? ''),
  };
  // Only password users give a recovery email; decided from the DB, not the submitted form.
  const schema = user.auth_provider === 'password' ? passwordOnboardingSchema : onboardingSchema;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };
  const email = 'email' in parsed.data ? (parsed.data.email as string) : undefined;

  // MOCK ONLY: the user picks their own role here. A real app must assign roles
  // server-side (e.g. admin approval, invitation, or Entra ID group/app-role claims)
  // and never trust a role chosen by the client.
  let role: Role;
  try {
    if (email && (await passwordEmailInUse(email, user.id))) {
      return { errors: { email: EMAIL_TAKEN }, values: raw };
    }
    const updated = await completeProfile(user.id, { ...parsed.data, email });
    // Refresh the session so middleware sees the new role and completed profile.
    await setSessionCookie(updated);
    role = updated.role ?? parsed.data.role;
  } catch (err) {
    if (err instanceof EmailTakenError) return { errors: { email: EMAIL_TAKEN }, values: raw };
    console.error('Onboarding failed', err);
    return { errors: { form: 'Something went wrong. Please try again.' }, values: raw };
  }

  redirect(dashboardFor(role));
}
