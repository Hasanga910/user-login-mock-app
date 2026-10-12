'use client';

import { useState, type ChangeEvent, type FocusEvent, type FormEvent } from 'react';
import type { ZodTypeAny } from 'zod';
import { fieldErrors, validateField, type FieldErrors } from '@/lib/validation';

type FieldElement = HTMLInputElement | HTMLSelectElement;

/**
 * Per-field errors for a form: server errors from the last action result, overridden by
 * browser checks run on blur and on submit with the same zod schemas.
 */
export function useFormErrors(serverErrors: FieldErrors | undefined) {
  const [client, setClient] = useState<FieldErrors>({});
  // A new action result replaces any browser-side errors.
  const [prevServer, setPrevServer] = useState(serverErrors);
  if (serverErrors !== prevServer) {
    setPrevServer(serverErrors);
    setClient({});
  }

  // Keys present in `client` win, even when undefined (the field was re-checked and passed).
  const errors: FieldErrors = { ...serverErrors, ...client };

  function validate(name: string, schema: ZodTypeAny, value: unknown) {
    setClient((c) => ({ ...c, [name]: validateField(schema, value) }));
  }

  /** Props wiring an input to its schema and its <FieldError>. */
  function field(name: string, schema: ZodTypeAny) {
    return {
      onBlur: (e: FocusEvent<FieldElement>) => validate(name, schema, e.currentTarget.value),
      // Once a field shows an error, re-check as the user fixes it.
      onChange: (e: ChangeEvent<FieldElement>) => {
        if (errors[name]) validate(name, schema, e.currentTarget.value);
      },
      'aria-invalid': errors[name] ? true : undefined,
      'aria-describedby': errors[name] ? `${name}-error` : undefined,
    };
  }

  /**
   * Validates the whole form before it is sent. On failure it cancels the submit, shows
   * every error and focuses the first invalid field. Returns true when the form is valid.
   */
  function checkForm(e: FormEvent<HTMLFormElement>, schema: ZodTypeAny, values?: Record<string, unknown>): boolean {
    const form = e.currentTarget;
    const data = values ?? Object.fromEntries(new FormData(form));
    const result = schema.safeParse(data);
    if (result.success) return true;

    e.preventDefault();
    const found = fieldErrors(result.error);
    const next: FieldErrors = {};
    for (const key of Object.keys(data)) next[key] = found[key];
    setClient({ ...next, ...found });

    const first = Object.keys(found)[0];
    if (first) form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    return false;
  }

  return { errors, field, validate, checkForm };
}
