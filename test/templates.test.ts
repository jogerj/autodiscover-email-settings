import { describe, it, expect } from "vitest";
import type { Settings } from "../src/types";
import { autoconfigXml } from "../src/templates/autoconfig";
import { autodiscoverXml } from "../src/templates/autodiscover";
import { mobileconfigXml } from "../src/templates/mobileconfig";

const baseSettings: Settings = {
  info: { name: "Acme Corp", url: "https://mail.acme.com" },
  domain: "acme.com",
  imap: { host: "imap.acme.com", port: "993", socket: "SSL" },
  pop: { host: "", port: "", socket: "" },
  smtp: { host: "smtp.acme.com", port: "587", socket: "STARTTLS" },
  mobilesync: { url: "", name: "" },
  ldap: {
    host: "",
    port: "",
    socket: "",
    base: "",
    userfield: "",
    usersbase: "",
    searchfilter: "",
  },
  mobile: {
    identifier: "com.acme.mail",
    uuid: "aaaa-bbbb",
    mail: { uuid: "cccc-dddd" },
    ldap: { uuid: "eeee-ffff" },
  },
};

// ── autoconfig ────────────────────────────────────────────────────────────────

describe("autoconfigXml", () => {
  it("includes clientConfig root and domain", () => {
    const xml = autoconfigXml(baseSettings);
    expect(xml).toContain('<clientConfig version="1.1">');
    expect(xml).toContain("<domain>acme.com</domain>");
  });

  it("includes IMAP block when imap.host is set", () => {
    const xml = autoconfigXml(baseSettings);
    expect(xml).toContain('<incomingServer type="imap">');
    expect(xml).toContain("<hostname>imap.acme.com</hostname>");
  });

  it("omits IMAP block when imap.host is empty", () => {
    const s = { ...baseSettings, imap: { host: "", port: "", socket: "" } };
    expect(autoconfigXml(s)).not.toContain('type="imap"');
  });

  it("includes SMTP block when smtp.host is set", () => {
    expect(autoconfigXml(baseSettings)).toContain('<outgoingServer type="smtp">');
  });

  it("omits SMTP block when smtp.host is empty", () => {
    const s = { ...baseSettings, smtp: { host: "", port: "", socket: "" } };
    expect(autoconfigXml(s)).not.toContain("outgoingServer");
  });

  it("keeps literal Thunderbird placeholders verbatim", () => {
    const xml = autoconfigXml(baseSettings);
    expect(xml).toContain("%EMAILADDRESS%");
    expect(xml).toContain("%EMAILLOCALPART%");
  });
});

// ── autodiscover ──────────────────────────────────────────────────────────────

describe("autodiscoverXml", () => {
  const params = {
    schema:
      "http://schemas.microsoft.com/exchange/autodiscover/outlook/responseschema/2006a",
    email: "user@acme.com",
    username: "user",
    domain: "acme.com",
    imapenc: "SSL",
    popenc: "SSL",
    smtpenc: "TLS",
    imapssl: "on",
    popssl: "off",
    smtpssl: "off",
  };

  it("includes the Autodiscover root element", () => {
    const xml = autodiscoverXml(params, baseSettings);
    expect(xml).toContain("<Autodiscover");
    expect(xml).toContain("</Autodiscover>");
  });

  it("uses the provided schema in the Response xmlns", () => {
    const xml = autodiscoverXml(params, baseSettings);
    expect(xml).toContain(`xmlns="${params.schema}"`);
  });

  it("includes IMAP Protocol block", () => {
    const xml = autodiscoverXml(params, baseSettings);
    expect(xml).toContain("<Type>IMAP</Type>");
    expect(xml).toContain("<Server>imap.acme.com</Server>");
  });

  it("omits IMAP Protocol block when host is empty", () => {
    const s = { ...baseSettings, imap: { host: "", port: "", socket: "" } };
    expect(autodiscoverXml(params, s)).not.toContain("<Type>IMAP</Type>");
  });

  it("includes SMTP Protocol block", () => {
    expect(autodiscoverXml(params, baseSettings)).toContain("<Type>SMTP</Type>");
  });

  it("includes email and domain in LoginName/DomainName", () => {
    const xml = autodiscoverXml(params, baseSettings);
    expect(xml).toContain("<LoginName>user@acme.com</LoginName>");
    expect(xml).toContain("<DomainName>acme.com</DomainName>");
  });

  it("includes MobileSync Action block when url is set", () => {
    const s = {
      ...baseSettings,
      mobilesync: { url: "https://eas.acme.com", name: "Acme EAS" },
    };
    const xml = autodiscoverXml(params, s);
    expect(xml).toContain("<Type>MobileSync</Type>");
    expect(xml).toContain("<Url>https://eas.acme.com</Url>");
  });

  it("omits MobileSync block when url is empty", () => {
    expect(autodiscoverXml(params, baseSettings)).not.toContain("MobileSync");
  });
});

// ── mobileconfig ─────────────────────────────────────────────────────────────

describe("mobileconfigXml", () => {
  const params = {
    email: "user@acme.com",
    username: "user",
    domain: "acme.com",
    imapssl: "true",
    popssl: "false",
    smtpssl: "true",
    ldapssl: "false",
  };

  it("produces a valid plist document", () => {
    const xml = mobileconfigXml(params, baseSettings);
    expect(xml).toContain('<!DOCTYPE plist');
    expect(xml).toContain('<plist version="1.0">');
    expect(xml).toContain("</plist>");
  });

  it("uses IMAP account type when imap.host is set", () => {
    const xml = mobileconfigXml(params, baseSettings);
    expect(xml).toContain("<string>EmailTypeIMAP</string>");
  });

  it("uses POP account type when only pop.host is set", () => {
    const s = {
      ...baseSettings,
      imap: { host: "", port: "", socket: "" },
      pop: { host: "pop.acme.com", port: "995", socket: "SSL" },
    };
    expect(mobileconfigXml(params, s)).toContain("<string>EmailTypePOP</string>");
  });

  it("omits email payload when neither imap nor pop host is set", () => {
    const s = {
      ...baseSettings,
      imap: { host: "", port: "", socket: "" },
      pop: { host: "", port: "", socket: "" },
    };
    expect(mobileconfigXml(params, s)).not.toContain("EmailTypeIMAP");
    expect(mobileconfigXml(params, s)).not.toContain("EmailTypePOP");
  });

  it("includes the LDAP payload when ldap.host is set", () => {
    const s = {
      ...baseSettings,
      ldap: {
        host: "ldap.acme.com",
        port: "389",
        socket: "",
        base: "dc=acme,dc=com",
        userfield: "uid",
        usersbase: "ou=people,dc=acme,dc=com",
        searchfilter: "",
      },
    };
    const xml = mobileconfigXml(params, s);
    expect(xml).toContain("com.apple.ldap.account");
    expect(xml).toContain("<string>ldap.acme.com</string>");
  });

  it("omits LDAP payload when ldap.host is empty", () => {
    expect(mobileconfigXml(params, baseSettings)).not.toContain(
      "com.apple.ldap.account"
    );
  });

  it("includes profile UUID and identifier in the outer payload", () => {
    const xml = mobileconfigXml(params, baseSettings);
    expect(xml).toContain("<string>com.acme.mail</string>");
    expect(xml).toContain("<string>aaaa-bbbb</string>");
  });
});
