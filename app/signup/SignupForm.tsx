'use client';

import { useActionState, useState } from 'react';
import FieldError from '@/components/form/FieldError';
import NewPasswordFields from '@/components/form/NewPasswordFields';
import { useFormErrors } from '@/components/form/useFormErrors';
import { useNewPassword } from '@/components/form/useNewPassword';
import { strengthUserInputs } from '@/lib/passwordStrength';
import { fieldSchemas, signupSchema, USERNAME_HINT, USERNAME_MAX } from '@/lib/validation';
import { signupAction, type SignupState } from './actions';

export default function SignupForm() {
  const [state, action, pending] = useActionState<SignupState, FormData>(signupAction, {});
  const { errors: e, field, checkForm } = useFormErrors(state.errors);
  // Controlled so the strength check can penalise passwords that contain the username.
  const [username, setUsername] = useState('');
  const pw = useNewPassword(strengthUserInputs(username), state);
  const usernameField = field('username', fieldSchemas.username);

  return (
    <form
      action={action}
      onSubmit={(ev) => {
        checkForm(ev, signupSchema, { username, password: pw.password, confirmPassword: pw.confirm });
        if (!pw.valid) {
          ev.preventDefault();
          pw.touchAll();
        }
      }}
      className="space-y-4"
      noValidate
    >
      {e.form && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{e.form}</p>}
      <div>
        <label htmlFor="username" className="label">Username</label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          value={username}
          className="input"
          required
          minLength={3}
          maxLength={USERNAME_MAX}
          {...usernameField}
          onChange={(ev) => {
            setUsername(ev.currentTarget.value);
            usernameField.onChange(ev);
          }}
        />
        <FieldError name="username" error={e.username} />
        <p className="mt-1 text-xs text-gray-500">{USERNAME_HINT}</p>
      </div>
      <NewPasswordFields pw={pw} errors={e} />
      <button type="submit" disabled={pending || !pw.valid} className="btn-primary">
        {pending ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}
