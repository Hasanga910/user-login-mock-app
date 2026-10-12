'use client';

import { useActionState } from 'react';
import FieldError from '@/components/form/FieldError';
import { useFormErrors } from '@/components/form/useFormErrors';
import { EMAIL_MAX, emailSchema, fieldSchemas } from '@/lib/validation';
import { updateEmailAction, type EmailState } from './actions';

export default function EmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, action, pending] = useActionState<EmailState, FormData>(updateEmailAction, {});
  const { errors: e, field, checkForm } = useFormErrors(state.errors);

  return (
    <form action={action} onSubmit={(ev) => checkForm(ev, emailSchema)} className="space-y-4" noValidate>
      {e.form && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{e.form}</p>}
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email ?? currentEmail}
          className="input"
          required
          maxLength={EMAIL_MAX}
          {...field('email', fieldSchemas.email)}
        />
        <FieldError name="email" error={e.email} />
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? 'Saving…' : 'Save email'}
      </button>
    </form>
  );
}
