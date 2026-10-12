'use client';

import { useActionState } from 'react';
import NewPasswordFields from '@/components/form/NewPasswordFields';
import { useFormErrors } from '@/components/form/useFormErrors';
import { useNewPassword } from '@/components/form/useNewPassword';
import { resetPasswordSchema } from '@/lib/validation';
import { resetPasswordAction, type ResetPasswordState } from './actions';
import InvalidLink from './InvalidLink';

export default function ResetPasswordForm({ token, userInputs }: { token: string; userInputs: string[] }) {
  const [state, action, pending] = useActionState<ResetPasswordState, FormData>(resetPasswordAction, {});
  const { errors: e, checkForm } = useFormErrors(state.errors);
  const pw = useNewPassword(userInputs, state);

  if (state.invalidToken) return <InvalidLink />;

  return (
    <form
      action={action}
      onSubmit={(ev) => {
        checkForm(ev, resetPasswordSchema, { token, password: pw.password, confirmPassword: pw.confirm });
        if (!pw.valid) {
          ev.preventDefault();
          pw.touchAll();
        }
      }}
      className="space-y-4"
      noValidate
    >
      {e.form && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{e.form}</p>}
      <input type="hidden" name="token" value={token} />
      <NewPasswordFields pw={pw} errors={e} passwordLabel="New password" />
      <button type="submit" disabled={pending || !pw.valid} className="btn-primary">
        {pending ? 'Saving…' : 'Set new password'}
      </button>
    </form>
  );
}
