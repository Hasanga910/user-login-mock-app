import 'server-only';
import { Resend } from 'resend';
import { env } from './env';
import { RESET_TOKEN_TTL_MINUTES } from './passwordReset';

const APP_NAME = 'Mock Login App';
const DEFAULT_FROM = `${APP_NAME} <onboarding@resend.dev>`;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function resetEmailHtml(link: string): string {
  const href = escapeHtml(link);
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;">
      <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">${APP_NAME}</p>
      <h1 style="margin:0 0 16px;font-size:22px;">Reset your password</h1>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.5;">We received a request to reset your password. Click the button below to choose a new one.</p>
      <a href="${href}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 20px;border-radius:6px;">Reset your password</a>
      <p style="margin:24px 0 8px;font-size:13px;color:#6b7280;">Or copy and paste this link into your browser:</p>
      <p style="margin:0 0 24px;font-size:13px;word-break:break-all;"><a href="${href}" style="color:#2563eb;">${href}</a></p>
      <p style="margin:0;font-size:13px;color:#6b7280;">This link expires in ${RESET_TOKEN_TTL_MINUTES} minutes. If you didn't request this, ignore this email.</p>
    </div>
  </body>
</html>`;
}

function resetEmailText(link: string): string {
  return [
    `${APP_NAME}`,
    '',
    'Reset your password:',
    link,
    '',
    `This link expires in ${RESET_TOKEN_TTL_MINUTES} minutes. If you didn't request this, ignore this email.`,
  ].join('\n');
}

/** Sends the reset email via Resend, or logs the link to the console when RESEND_API_KEY is not set. */
export async function sendPasswordResetEmail(to: string, link: string): Promise<void> {
  const { RESEND_API_KEY, EMAIL_FROM } = env();

  if (!RESEND_API_KEY) {
    console.log(`\n[DEV ONLY] RESEND_API_KEY is not set, so no email was sent.\n[DEV ONLY] Password reset link for ${to}: ${link}\n`);
    return;
  }

  const { error } = await new Resend(RESEND_API_KEY).emails.send({
    from: EMAIL_FROM ?? DEFAULT_FROM,
    to,
    subject: `Reset your ${APP_NAME} password`,
    html: resetEmailHtml(link),
    text: resetEmailText(link),
  });
  if (error) console.error('Failed to send password reset email', error);
}
