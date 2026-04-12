import type { Settings } from "../types";

export interface AutodiscoverParams {
  schema: string;
  email: string;
  username: string;
  domain: string;
  imapenc: string;
  popenc: string;
  smtpenc: string;
  imapssl: string;
  popssl: string;
  smtpssl: string;
}

export function autodiscoverXml(p: AutodiscoverParams, s: Settings): string {
  return `<?xml version="1.0" encoding="utf-8" ?>
<Autodiscover xmlns="http://schemas.microsoft.com/exchange/autodiscover/responseschema/2006">
  <Response xmlns="${p.schema}">
    <User>
      <DisplayName>${s.info.name}</DisplayName>
    </User>
    <Account>
      <AccountType>email</AccountType>
      <Action>settings</Action>
      <ServiceHome>${s.info.url}</ServiceHome>
${s.imap.host ? `      <Protocol>
        <Type>IMAP</Type>
        <Server>${s.imap.host}</Server>
        <Port>${s.imap.port}</Port>
        <LoginName>${p.email}</LoginName>
        <DomainRequired>on</DomainRequired>
        <DomainName>${p.domain}</DomainName>
        <SPA>on</SPA>
        <SSL>${p.imapssl}</SSL>
        <Encryption>${p.imapenc}</Encryption>
        <AuthRequired>on</AuthRequired>
      </Protocol>` : ""}
${s.pop.host ? `      <Protocol>
        <Type>POP</Type>
        <Server>${s.pop.host}</Server>
        <Port>${s.pop.port}</Port>
        <LoginName>${p.email}</LoginName>
        <DomainRequired>on</DomainRequired>
        <DomainName>${p.domain}</DomainName>
        <SPA>on</SPA>
        <SSL>${p.popssl}</SSL>
        <Encryption>${p.popenc}</Encryption>
        <AuthRequired>on</AuthRequired>
      </Protocol>` : ""}
${s.smtp.host ? `      <Protocol>
        <Type>SMTP</Type>
        <Server>${s.smtp.host}</Server>
        <Port>${s.smtp.port}</Port>
        <LoginName>${p.email}</LoginName>
        <DomainRequired>on</DomainRequired>
        <DomainName>${p.domain}</DomainName>
        <SPA>on</SPA>
        <SSL>${p.smtpssl}</SSL>
        <Encryption>${p.smtpenc}</Encryption>
        <AuthRequired>on</AuthRequired>
      </Protocol>` : ""}
    </Account>
${s.mobilesync.url ? `    <Action>
      <Settings>
        <Server>
          <Type>MobileSync</Type>
          <Url>${s.mobilesync.url}</Url>
          ${s.mobilesync.name ? `<Name>${s.mobilesync.name}</Name>` : ""}
        </Server>
      </Settings>
    </Action>` : ""}
  </Response>
</Autodiscover>`;
}
