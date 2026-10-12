import 'server-only';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { env } from './env';

export const MS_SCOPES = ['openid', 'profile', 'email', 'User.Read'];

let app: ConfidentialClientApplication | null = null;

export function msalClient(): ConfidentialClientApplication {
  if (!app) {
    const e = env();
    app = new ConfidentialClientApplication({
      auth: {
        clientId: e.AZURE_AD_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${e.AZURE_AD_TENANT_ID}`,
        clientSecret: e.AZURE_AD_CLIENT_SECRET,
      },
    });
  }
  return app;
}

export function msRedirectUri(): string {
  return new URL('/api/auth/microsoft/callback', env().APP_URL).toString();
}
