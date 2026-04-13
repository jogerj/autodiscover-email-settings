import type { Settings } from "../types";

export interface MobileconfigParams {
  email: string;
  username: string;
  domain: string;
  imapssl: string;
  popssl: string;
  smtpssl: string;
  ldapssl: string;
}

export function mobileconfigXml(p: MobileconfigParams, s: Settings): string {
  const hasEmail = !!(s.imap.host || s.pop.host);
  const incomingHost = s.imap.host || s.pop.host;
  const incomingPort = s.imap.host ? s.imap.port : s.pop.port;
  const incomingSSL = s.imap.host ? p.imapssl : p.popssl;
  const accountType = s.imap.host ? "EmailTypeIMAP" : "EmailTypePOP";

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>HasRemovalPasscode</key>
  <false/>
  <key>PayloadContent</key>
  <array>
${hasEmail ? `    <dict>
      <key>EmailAccountDescription</key>
      <string>${p.email}</string>
      <key>EmailAccountName</key>
      <string>${p.email}</string>
      <key>EmailAccountType</key>
      <string>${accountType}</string>
      <key>EmailAddress</key>
      <string>${p.email}</string>
      <key>IncomingMailServerAuthentication</key>
      <string>EmailAuthPassword</string>
      <key>IncomingMailServerHostName</key>
      <string>${incomingHost}</string>
      <key>IncomingMailServerPortNumber</key>
      <integer>${incomingPort}</integer>
      <key>IncomingMailServerUseSSL</key>
      <${incomingSSL}/>
      <key>IncomingMailServerUsername</key>
      <string>${p.email}</string>
      <key>OutgoingPasswordSameAsIncomingPassword</key>
      <true/>
      <key>OutgoingMailServerAuthentication</key>
      <string>EmailAuthPassword</string>
      <key>OutgoingMailServerHostName</key>
      <string>${s.smtp.host}</string>
      <key>OutgoingMailServerPortNumber</key>
      <integer>${s.smtp.port}</integer>
      <key>OutgoingMailServerUseSSL</key>
      <${p.smtpssl}/>
      <key>OutgoingMailServerUsername</key>
      <string>${p.email}</string>
      <key>SMIMEEnabled</key>
      <false/>
      <key>SMIMEEnablePerMessageSwitch</key>
      <false/>
      <key>SMIMEEnableEncryptionPerMessageSwitch</key>
      <false/>
      <key>disableMailRecentsSyncing</key>
      <false/>
      <key>PayloadDescription</key>
      <string>${s.info.name} Email</string>
      <key>PayloadDisplayName</key>
      <string>${p.email}</string>
      <key>PayloadIdentifier</key>
      <string>${s.mobile.identifier}.com.apple.mail.managed.${s.mobile.mail.uuid}</string>
      <key>PayloadType</key>
      <string>com.apple.mail.managed</string>
      <key>PayloadUUID</key>
      <string>${s.mobile.mail.uuid}</string>
      <key>PayloadVersion</key>
      <real>1</real>
    </dict>` : ""}
${s.ldap.host ? `    <dict>
      <key>LDAPAccountDescription</key>
      <string>${s.info.name} LDAP</string>
      <key>LDAPAccountHostName</key>
      <string>${s.ldap.host}</string>
      <key>LDAPAccountUseSSL</key>
      <${p.ldapssl}/>
      <key>LDAPAccountUserName</key>
      <string>${s.ldap.userfield}=${p.username},${s.ldap.usersbase}</string>
      <key>LDAPSearchSettings</key>
      <array>
        <dict>
          <key>LDAPSearchSettingDescription</key>
          <string>${s.info.name} Contacts</string>
          <key>LDAPSearchSettingSearchBase</key>
          <string>${s.ldap.base}</string>
          <key>LDAPSearchSettingScope</key>
          <string>LDAPSearchSettingScopeSubtree</string>
        </dict>
      </array>
      <key>PayloadDescription</key>
      <string>${s.info.name} LDAP</string>
      <key>PayloadDisplayName</key>
      <string>${s.info.name} Contacts</string>
      <key>PayloadIdentifier</key>
      <string>${s.mobile.identifier}.com.apple.ldap.account.${s.mobile.ldap.uuid}</string>
      <key>PayloadType</key>
      <string>com.apple.ldap.account</string>
      <key>PayloadUUID</key>
      <string>${s.mobile.ldap.uuid}</string>
      <key>PayloadVersion</key>
      <real>1</real>
    </dict>` : ""}
  </array>
  <key>PayloadDescription</key>
  <string>${s.info.name}</string>
  <key>PayloadDisplayName</key>
  <string>${s.info.name}</string>
  <key>PayloadIdentifier</key>
  <string>${s.mobile.identifier}</string>
  <key>PayloadOrganization</key>
  <string>${p.domain}</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${s.mobile.uuid}</string>
  <key>PayloadVersion</key>
  <integer>2</integer>
</dict>
</plist>`;
}
