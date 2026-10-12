// Password rules for new passwords (signup and reset). Pure and client-safe: used by the
// zod schemas in ./validation and by the live checklist in the browser.

/** bcrypt ignores everything after the first 72 bytes, so longer passwords are rejected. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;

export function passwordByteLength(password: string): number {
  return new TextEncoder().encode(password).length;
}

export type PasswordRule = {
  id: 'min' | 'maxBytes' | 'upper' | 'lower' | 'number' | 'symbol' | 'noSpaces';
  /** Checklist text. */
  label: string;
  /** Error shown under the field when the rule fails. */
  message: string;
  test: (password: string) => boolean;
};

export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    id: 'min',
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    test: (pw) => [...pw].length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: 'maxBytes',
    label: `At most ${PASSWORD_MAX_BYTES} characters`,
    message: `Password must be at most ${PASSWORD_MAX_BYTES} characters (fewer if it uses accented letters or emoji)`,
    test: (pw) => passwordByteLength(pw) <= PASSWORD_MAX_BYTES,
  },
  {
    id: 'upper',
    label: 'One uppercase letter (A-Z)',
    message: 'Password must contain an uppercase letter (A-Z)',
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    id: 'lower',
    label: 'One lowercase letter (a-z)',
    message: 'Password must contain a lowercase letter (a-z)',
    test: (pw) => /[a-z]/.test(pw),
  },
  {
    id: 'number',
    label: 'One number (0-9)',
    message: 'Password must contain a number (0-9)',
    test: (pw) => /[0-9]/.test(pw),
  },
  {
    id: 'symbol',
    label: 'One symbol (e.g. ! @ # ?)',
    message: 'Password must contain a symbol (e.g. ! @ # ?)',
    // Anything that is not a letter or number. Whitespace is excluded here; it fails the rule below.
    test: (pw) => /[^\p{L}\p{N}\s]/u.test(pw),
  },
  {
    id: 'noSpaces',
    label: 'No spaces',
    message: 'Password must not contain spaces',
    test: (pw) => !/\s/.test(pw),
  },
];

export function failedPasswordRules(password: string): PasswordRule[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(password));
}
