import type { Env, Settings } from "./types";

export function buildSettings(env: Env): Settings {
  return {
    info: {
      name: env.COMPANY_NAME,
      url: env.SUPPORT_URL,
    },
    domain: env.DOMAIN,
    imap: {
      host: env.IMAP_HOST,
      port: env.IMAP_PORT,
      socket: env.IMAP_SOCKET,
    },
    pop: {
      host: env.POP_HOST,
      port: env.POP_PORT,
      socket: env.POP_SOCKET,
    },
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      socket: env.SMTP_SOCKET,
    },
    mobilesync: {
      url: env.MOBILESYNC_URL,
      name: env.MOBILESYNC_NAME,
    },
    ldap: {
      host: env.LDAP_HOST,
      port: env.LDAP_PORT,
      socket: env.LDAP_SOCKET,
      base: env.LDAP_BASE,
      userfield: env.LDAP_USER_FIELD,
      usersbase: env.LDAP_USER_BASE,
      searchfilter: env.LDAP_SEARCH,
    },
    mobile: {
      identifier: env.PROFILE_IDENTIFIER,
      uuid: env.PROFILE_UUID,
      mail: { uuid: env.MAIL_UUID },
      ldap: { uuid: env.LDAP_UUID },
    },
  };
}
