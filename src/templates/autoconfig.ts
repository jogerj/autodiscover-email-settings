import type { Settings } from "../types";

export function autoconfigXml(s: Settings): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<clientConfig version="1.1">
  <emailProvider id="${s.domain}">
    <domain>${s.domain}</domain>
    <displayName>${s.info.name} Email</displayName>
    <displayShortName>%EMAILLOCALPART%</displayShortName>
${s.imap.host ? `    <incomingServer type="imap">
      <hostname>${s.imap.host}</hostname>
      <port>${s.imap.port}</port>
      <socketType>${s.imap.socket}</socketType>
      <authentication>password-cleartext</authentication>
      <username>%EMAILADDRESS%</username>
    </incomingServer>` : ""}
${s.pop.host ? `    <incomingServer type="pop3">
      <hostname>${s.pop.host}</hostname>
      <port>${s.pop.port}</port>
      <socketType>${s.pop.socket}</socketType>
      <authentication>password-cleartext</authentication>
      <username>%EMAILADDRESS%</username>
    </incomingServer>` : ""}
${s.smtp.host ? `    <outgoingServer type="smtp">
      <hostname>${s.smtp.host}</hostname>
      <port>${s.smtp.port}</port>
      <socketType>${s.smtp.socket}</socketType>
      <authentication>password-cleartext</authentication>
      <username>%EMAILADDRESS%</username>
    </outgoingServer>` : ""}
    <documentation url="${s.info.url}">
      <descr lang="en">Generic settings page</descr>
      <descr lang="fr">Paramètres généraux</descr>
      <descr lang="es">Configuraciones genéricas</descr>
      <descr lang="de">Allgemeine Beschreibung der Einstellungen</descr>
      <descr lang="ru">Страница общих настроек</descr>
    </documentation>
  </emailProvider>
</clientConfig>`;
}
