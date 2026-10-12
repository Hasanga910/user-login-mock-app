'use server';

import { redirect } from 'next/navigation';
import { emailSchema, fieldErrors, type FieldErrors } from '@/lib/validation';
import { EmailTakenError, passwordEmailInUse, setPasswordUserEmail } from '@/lib/users';
import { homeFor, requireUser } from '@/lib/auth';

export type EmailState = { errors?: FieldErrors; values?: { email: string } };

const EMAIL_TAKEN = 'This email is already in use';

export async function updateEmailAction(_prev: EmailState, formData: FormData): Promise<EmailState> {
  const user = await requireUser();
  if (user.auth_provider !== 'password') redirect(homeFor(user));

  const values = { email: String(formData.get('email') ?? '') };
  const parsed = emailSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  try {
    if (await passwordEmailInUse(parsed.data.email, user.id)) return { errors: { email: EMAIL_TAKEN }, values };
    await setPasswordUserEmail(user.id, parsed.data.email);
  } catch (err) {
    if (err instanceof EmailTakenError) return { errors: { email: EMAIL_TAKEN }, values };
    console.error('Updating email failed', err);
    return { errors: { form: 'Something went wrong. Please try again.' }, values };
  }

  redirect(homeFor(user));
}
