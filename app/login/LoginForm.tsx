'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import FieldError from '@/components/form/FieldError';
import PasswordInput from '@/components/form/PasswordInput';
import { useFormErrors } from '@/components/form/useFormErrors';
import { fieldSchemas, LOGIN_PASSWORD_MAX, loginSchema, USERNAME_MAX } from '@/lib/validation';
import { loginAction, type LoginState } from './actions';

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  // Login only checks the fields are filled in; wrong credentials show as one message above.
  const { errors: e, field, checkForm } = useFormErrors(undefined);

  return (
    <form action={action} onSubmit={(ev) => checkForm(ev, loginSchema)} className="space-y-4" noValidate>
      {state.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div>
        <label htmlFor="username" className="label">Username</label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          defaultValue={state.values?.username}
          className="input"
          required
          maxLength={USERNAME_MAX}
          {...field('username', fieldSchemas.loginUsername)}
        />
        <FieldError name="username" error={e.username} />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          maxLength={LOGIN_PASSWORD_MAX}
          {...field('password', fieldSchemas.loginPassword)}
        />
        <FieldError name="password" error={e.password} />
        <p className="mt-1 text-right text-xs">
          <Link href="/forgot-password" className="text-blue-600 hover:underline">Forgot password?</Link>
        </p>
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
