import 'server-only';
import { z } from 'zod';

// Treats blank values (e.g. `RESEND_API_KEY=` copied from .env.example) as unset.
const optional = z.preprocess((v) => (v === '' ? undefined : v), z.string().min(1).optional());

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  AZURE_AD_TENANT_ID: z.string().min(1),
  AZURE_AD_CLIENT_ID: z.string().min(1),
  AZURE_AD_CLIENT_SECRET: z.string().min(1),
  APP_URL: z.string().url(),
  RESEND_API_KEY: optional,
  EMAIL_FROM: optional,
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

// Validated lazily so `next build` works without a populated .env.
export function env(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}
