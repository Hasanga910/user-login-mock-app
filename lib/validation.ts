// Single source of truth for form validation. Client-safe (no server-only imports): server
// actions use these schemas, and the forms reuse them in the browser on blur and on submit.
import { z } from 'zod';
import { ROLE_VALUES } from './roles';
import { PASSWORD_RULES } from './passwordRules';

export const USERNAME_MAX = 30;
export const USERNAME_HINT = '3–30 characters: letters, numbers, underscores.';
export const EMAIL_MAX = 254;
export const NAME_MAX = 50;
export const COMPANY_MAX = 100;
export const IDENTIFIER_MAX = 254;
export const LOGIN_PASSWORD_MAX = 128;

export const EMAIL_INVALID = 'Enter a valid email address, like name@example.com';
export const PASSWORDS_DONT_MATCH = "Passwords don't match";

const username = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(USERNAME_MAX, `Username must be at most ${USERNAME_MAX} characters`)
  .regex(/^[A-Za-z0-9_]+$/, 'Username may only contain letters, numbers, and underscores');

/** New passwords only (signup and reset). Login deliberately does not use this. */
const password = z.string().superRefine((value, ctx) => {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(value)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: rule.message });
  }
});

const passwordsMatch = {
  check: (d: { password: string; confirmPassword: string }) => d.password === d.confirmPassword,
  error: { message: PASSWORDS_DONT_MATCH, path: ['confirmPassword'] },
};

// One @ with text before it, no spaces, and a domain with a dot and 2+ letters after the last dot.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

export const email = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .max(EMAIL_MAX, EMAIL_INVALID)
  .regex(EMAIL_PATTERN, EMAIL_INVALID)
  .transform((v) => v.toLowerCase());

// Letters from any language (plus combining marks), spaces, hyphens and apostrophes; at least one letter.
const NAME_PATTERN = /^(?=.*\p{L})[\p{L}\p{M} '’-]+$/u;

const personName = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(NAME_MAX, `${label} must be at most ${NAME_MAX} characters`)
    .regex(NAME_PATTERN, `${label} can only contain letters, spaces, hyphens and apostrophes`);

const company = z
  .string()
  .trim()
  .min(1, 'Company is required')
  .min(2, 'Company must be at least 2 characters')
  .max(COMPANY_MAX, `Company must be at most ${COMPANY_MAX} characters`);

const role = z.enum(ROLE_VALUES, { errorMap: () => ({ message: 'Select a valid role' }) });

const identifier = z.string().trim().min(1, 'Enter your username or email').max(IDENTIFIER_MAX);

const loginUsername = z.string().trim().min(1, 'Enter your username').max(USERNAME_MAX);
const loginPassword = z.string().min(1, 'Enter your password').max(LOGIN_PASSWORD_MAX);

export const signupSchema = z
  .object({ username, password, confirmPassword: z.string() })
  .refine(passwordsMatch.check, passwordsMatch.error);

// Only checks the fields are filled in: existing users may have older passwords that
// don't meet the new-password rules.
export const loginSchema = z.object({ username: loginUsername, password: loginPassword });

export const onboardingSchema = z.object({
  firstName: personName('First name'),
  lastName: personName('Last name'),
  company,
  role,
});

/** Password users also provide a recovery email during onboarding. */
export const passwordOnboardingSchema = onboardingSchema.extend({ email });

export const emailSchema = z.object({ email });

export const forgotPasswordSchema = z.object({ identifier });

export const resetPasswordSchema = z
  .object({ token: z.string().min(1).max(200), password, confirmPassword: z.string() })
  .refine(passwordsMatch.check, passwordsMatch.error);

/** Single-field schemas, for validating a field in the browser when it loses focus. */
export const fieldSchemas = {
  username,
  password,
  email,
  firstName: personName('First name'),
  lastName: personName('Last name'),
  company,
  role,
  identifier,
  loginUsername,
  loginPassword,
};

export type FieldErrors = Partial<Record<string, string>>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** The first error message for a single value, or undefined if it is valid. */
export function validateField(schema: z.ZodTypeAny, value: unknown): string | undefined {
  const result = schema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
}
