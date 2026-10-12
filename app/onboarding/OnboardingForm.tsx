'use client';

import { useActionState } from 'react';
import FieldError from '@/components/form/FieldError';
import { useFormErrors } from '@/components/form/useFormErrors';
import { ROLES, ROLE_VALUES } from '@/lib/roles';
import {
  COMPANY_MAX,
  EMAIL_MAX,
  fieldSchemas,
  NAME_MAX,
  onboardingSchema,
  passwordOnboardingSchema,
} from '@/lib/validation';
import { onboardingAction, type OnboardingState } from './actions';

export default function OnboardingForm({
  defaults,
  showEmail,
}: {
  defaults: { firstName: string; lastName: string; company: string };
  showEmail: boolean;
}) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(onboardingAction, {});
  const { errors: e, field, checkForm } = useFormErrors(state.errors);
  const v = state.values ?? { ...defaults, email: '', role: '' };

  return (
    <form
      action={action}
      onSubmit={(ev) => checkForm(ev, showEmail ? passwordOnboardingSchema : onboardingSchema)}
      className="space-y-4"
      noValidate
    >
      {e.form && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{e.form}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="label">First name</label>
          <input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            defaultValue={v.firstName}
            className="input"
            required
            maxLength={NAME_MAX}
            {...field('firstName', fieldSchemas.firstName)}
          />
          <FieldError name="firstName" error={e.firstName} />
        </div>
        <div>
          <label htmlFor="lastName" className="label">Last name</label>
          <input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            defaultValue={v.lastName}
            className="input"
            required
            maxLength={NAME_MAX}
            {...field('lastName', fieldSchemas.lastName)}
          />
          <FieldError name="lastName" error={e.lastName} />
        </div>
      </div>
      <div>
        <label htmlFor="company" className="label">Company</label>
        <input
          id="company"
          name="company"
          autoComplete="organization"
          defaultValue={v.company}
          className="input"
          required
          minLength={2}
          maxLength={COMPANY_MAX}
          {...field('company', fieldSchemas.company)}
        />
        <FieldError name="company" error={e.company} />
      </div>
      {showEmail && (
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={v.email}
            className="input"
            required
            maxLength={EMAIL_MAX}
            {...field('email', fieldSchemas.email)}
          />
          <FieldError name="email" error={e.email} />
          <p className="mt-1 text-xs text-gray-500">Used to reset your password if you forget it.</p>
        </div>
      )}
      <div>
        <label htmlFor="role" className="label">Role</label>
        <select id="role" name="role" defaultValue={v.role} className="input" required {...field('role', fieldSchemas.role)}>
          <option value="" disabled>Select a role…</option>
          {ROLE_VALUES.map((r) => (
            <option key={r} value={r}>{ROLES[r].label}</option>
          ))}
        </select>
        <FieldError name="role" error={e.role} />
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? 'Saving…' : 'Complete profile'}
      </button>
    </form>
  );
}
