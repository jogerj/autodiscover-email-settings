/**
 * Bun / Node.js entry point.
 *
 * Passes process.env to the shared Hono app so that c.env inside every
 * route handler is populated the same way as when running on CF Workers.
 * No route logic lives here — all routes stay in src/index.ts.
 */
import app from "./index";
import type { Env } from "./types";

// Declare process locally so this file type-checks under the CF Workers
// tsconfig (which does not include @types/node).
declare const process: { env: Record<string, string | undefined> };

const e = (k: string): string => process.env[k] ?? "";

const env: Env = {
  COMPANY_NAME: e("COMPANY_NAME"),
  SUPPORT_URL: e("SUPPORT_URL"),
  DOMAIN: e("DOMAIN"),
  IMAP_HOST: e("IMAP_HOST"),
  IMAP_PORT: e("IMAP_PORT"),
  IMAP_SOCKET: e("IMAP_SOCKET"),
  POP_HOST: e("POP_HOST"),
  POP_PORT: e("POP_PORT"),
  POP_SOCKET: e("POP_SOCKET"),
  SMTP_HOST: e("SMTP_HOST"),
  SMTP_PORT: e("SMTP_PORT"),
  SMTP_SOCKET: e("SMTP_SOCKET"),
  MOBILESYNC_URL: e("MOBILESYNC_URL"),
  MOBILESYNC_NAME: e("MOBILESYNC_NAME"),
  LDAP_HOST: e("LDAP_HOST"),
  LDAP_PORT: e("LDAP_PORT"),
  LDAP_SOCKET: e("LDAP_SOCKET"),
  LDAP_BASE: e("LDAP_BASE"),
  LDAP_USER_FIELD: e("LDAP_USER_FIELD"),
  LDAP_USER_BASE: e("LDAP_USER_BASE"),
  LDAP_SEARCH: e("LDAP_SEARCH"),
  PROFILE_IDENTIFIER: e("PROFILE_IDENTIFIER"),
  PROFILE_UUID: e("PROFILE_UUID"),
  MAIL_UUID: e("MAIL_UUID"),
  LDAP_UUID: e("LDAP_UUID"),
};

const port = Number(process.env.PORT) || 8000;

export default {
  port,
  fetch: (req: Request) => app.fetch(req, env),
};
