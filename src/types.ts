export interface Env {
  COMPANY_NAME: string;
  SUPPORT_URL: string;
  DOMAIN: string;

  IMAP_HOST: string;
  IMAP_PORT: string;
  IMAP_SOCKET: string;

  POP_HOST: string;
  POP_PORT: string;
  POP_SOCKET: string;

  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_SOCKET: string;

  MOBILESYNC_URL: string;
  MOBILESYNC_NAME: string;

  LDAP_HOST: string;
  LDAP_PORT: string;
  LDAP_SOCKET: string;
  LDAP_BASE: string;
  LDAP_USER_FIELD: string;
  LDAP_USER_BASE: string;
  LDAP_SEARCH: string;

  PROFILE_IDENTIFIER: string;
  PROFILE_UUID: string;
  MAIL_UUID: string;
  LDAP_UUID: string;
}

export interface Settings {
  info: {
    name: string;
    url: string;
  };
  domain: string;
  imap: {
    host: string;
    port: string;
    socket: string;
  };
  pop: {
    host: string;
    port: string;
    socket: string;
  };
  smtp: {
    host: string;
    port: string;
    socket: string;
  };
  mobilesync: {
    url: string;
    name: string;
  };
  ldap: {
    host: string;
    port: string;
    socket: string;
    base: string;
    userfield: string;
    usersbase: string;
    searchfilter: string;
  };
  mobile: {
    identifier: string;
    uuid: string;
    mail: { uuid: string };
    ldap: { uuid: string };
  };
}

export interface EmailParts {
  email: string;
  username: string;
  domain: string;
}
