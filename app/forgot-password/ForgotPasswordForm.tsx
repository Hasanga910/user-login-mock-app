'use client';

import { useActionState } from 'react';
import FieldError from '@/components/form/FieldError';
import { useFormErrors } from '@/components/form/useFormErrors';
import { fieldSchemas, forgotPasswordSchema, IDENTIFIER_MAX } from '@/lib/validation';
import { forgotPasswordAction, type ForgotPasswordState } from './actions';

export default function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<ForgotPasswordState, FormData>(forgotPasswordAction, {});
  const { errors: e, field, checkForm } = useFormErrors(state.errors);

  if (state.message) {
    return <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{state.message}</p>;
  }

  return (
    <form action={action} onSubmit={(ev) => checkForm(ev, forgotPasswordSchema)} className="space-y-4" noValidate>
      {e.form && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{e.form}</p>}
      <div>
        <label htmlFor="identifier" className="label">Username or email</label>
        <input
          id="identifier"
          name="identifier"
          autoComplete="username"
          defaultValue={state.values?.identifier}
          className="input"
          required
          maxLength={IDENTIFIER_MAX}
          {...field('identifier', fieldSchemas.identifier)}
        />
        <FieldError name="identifier" error={e.identifier} />
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  );
}
