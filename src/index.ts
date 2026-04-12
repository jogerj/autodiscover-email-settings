import { Hono, type Context } from "hono";
import type { Env } from "./types";
import { buildSettings } from "./settings";
import { parseEmail } from "./email";
import { parseAutodiscoverBody } from "./autodiscover";
import { autodiscoverXml } from "./templates/autodiscover";
import { autoconfigXml } from "./templates/autoconfig";
import { mobileconfigXml } from "./templates/mobileconfig";
import { indexHtml } from "./templates/index";

const app = new Hono<{ Bindings: Env }>();

async function handleAutodiscover(c: Context<{ Bindings: Env }>) {
  const settings = buildSettings(c.env);
  const rawBody = c.req.method === "POST" ? await c.req.text() : "";
  const { email: rawEmail, schema } = parseAutodiscoverBody(rawBody);
  const { email, domain } = parseEmail(rawEmail ?? "", settings.domain);

  const imapenc =
    settings.imap.socket === "STARTTLS" ? "TLS" : settings.imap.socket;
  const popenc =
    settings.pop.socket === "STARTTLS" ? "TLS" : settings.pop.socket;
  const smtpenc =
    settings.smtp.socket === "STARTTLS" ? "TLS" : settings.smtp.socket;

  const imapssl = settings.imap.socket === "SSL" ? "on" : "off";
  const popssl = settings.pop.socket === "SSL" ? "on" : "off";
  const smtpssl = settings.smtp.socket === "SSL" ? "on" : "off";

  const xml = autodiscoverXml(
    { schema, email, username: email.split("@")[0], domain, imapenc, popenc, smtpenc, imapssl, popssl, smtpssl },
    settings
  );

  return c.body(xml, 200, { "Content-Type": "application/xml; charset=utf-8" });
}

// Microsoft Outlook / Apple Mail
app.get("/autodiscover/autodiscover.xml", handleAutodiscover);
app.post("/autodiscover/autodiscover.xml", handleAutodiscover);
app.get("/Autodiscover/Autodiscover.xml", handleAutodiscover);
app.post("/Autodiscover/Autodiscover.xml", handleAutodiscover);

// Thunderbird
app.get("/mail/config-v1.1.xml", (c) => {
  const settings = buildSettings(c.env);
  return c.body(autoconfigXml(settings), 200, {
    "Content-Type": "application/xml; charset=utf-8",
  });
});

// iOS / Apple Mail
app.get("/email.mobileconfig", async (c) => {
  const settings = buildSettings(c.env);
  const rawEmail = c.req.query("email");

  if (!rawEmail) {
    return c.body("Missing email parameter", 400);
  }

  const { email, username, domain } = parseEmail(rawEmail, settings.domain);
  const filename = `${domain}.mobileconfig`;

  const imapssl =
    settings.imap.socket === "SSL" || settings.imap.socket === "STARTTLS"
      ? "true"
      : "false";
  const popssl =
    settings.pop.socket === "SSL" || settings.pop.socket === "STARTTLS"
      ? "true"
      : "false";
  const smtpssl =
    settings.smtp.socket === "SSL" || settings.smtp.socket === "STARTTLS"
      ? "true"
      : "false";
  const ldapssl =
    settings.ldap.socket === "SSL" || settings.ldap.port === "636"
      ? "true"
      : "false";

  const xml = mobileconfigXml(
    { email, username, domain, imapssl, popssl, smtpssl, ldapssl },
    settings
  );

  return c.body(xml, 200, {
    "Content-Type": "application/x-apple-aspen-config; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
  });
});

// Support page
app.get("/", (c) => {
  const settings = buildSettings(c.env);
  return c.html(indexHtml(settings));
});

// Favicon — return no content (email clients never request this)
app.get("/favicon.ico", () => new Response(null, { status: 204 }));

export default app;
