# ![Autodiscover](icon.svg) Autodiscover Email Settings

[![Docker Pulls](https://img.shields.io/docker/pulls/jogerj/autodiscover-email-settings.svg)](https://hub.docker.com/r/jogerj/autodiscover-email-settings/)
![Docker Image Size (latest by date)](https://img.shields.io/docker/image-size/jogerj/autodiscover-email-settings)

A fork of [Monogramm/autodiscover-email-settings](https://github.com/Monogramm/autodiscover-email-settings), rewritten in TypeScript on [Hono](https://hono.dev/) for serverless and container deployments.

Provides email client auto-configuration for:

- **Microsoft Outlook / Apple Mail** — Autodiscover XML (`/autodiscover/autodiscover.xml`)
- **Mozilla Thunderbird** — Autoconfig XML (`/mail/config-v1.1.xml`)
- **iOS / Apple Mail** — Configuration Profile download (`/email.mobileconfig`)
- **Browser** — Support page with manual settings and iOS profile form (`/`)

![General settings](docs/screenshot_01.png)

![iOS profile form](docs/screenshot_02.png)

---

## Deployment

Two runtimes are supported. Both read the same environment variables.

### Cloudflare Workers (recommended)

Runs at the edge globally with no infrastructure to manage.

#### Clone and install dependencies

```bash
git clone https://github.com/jogerj/autodiscover-email-settings.git
cd autodiscover-email-settings
npm install
```

#### 2. Configure `wrangler.toml`

Edit the `[vars]` section with your values. Leave unused service hosts empty to disable them.

```toml
[vars]
COMPANY_NAME = "My Company"
SUPPORT_URL  = "https://autodiscover.example.com"
DOMAIN       = "example.com"

IMAP_HOST   = "imap.example.com"
IMAP_PORT   = "993"
IMAP_SOCKET = "SSL"

SMTP_HOST   = "smtp.example.com"
SMTP_PORT   = "587"
SMTP_SOCKET = "STARTTLS"
```

For secrets (UUIDs, etc.) use `wrangler secret put` instead of `[vars]`:

```bash
wrangler secret put PROFILE_UUID
wrangler secret put MAIL_UUID
wrangler secret put LDAP_UUID
```

#### 3. Test locally

```bash
npm run dev          # starts http://localhost:8787
bash test/smoke.sh   # run smoke tests against the local server
```

Override individual vars without editing `wrangler.toml` by creating a `.dev.vars` file (gitignored):

```ini
IMAP_HOST=imap.mycompany.com
DOMAIN=mycompany.com
```

#### 4. Deploy

```bash
npm run deploy
# or: npx wrangler deploy --env production
```

---

### Docker (Bun)

Self-hosted alternative using the [Bun](https://bun.sh/) runtime.

#### Build and run

```bash
docker build -t autodiscover .

docker run -p 8000:8000 \
  -e COMPANY_NAME="My Company" \
  -e SUPPORT_URL="https://autodiscover.example.com" \
  -e DOMAIN=example.com \
  -e IMAP_HOST=imap.example.com \
  -e IMAP_PORT=993 \
  -e IMAP_SOCKET=SSL \
  -e SMTP_HOST=smtp.example.com \
  -e SMTP_PORT=587 \
  -e SMTP_SOCKET=STARTTLS \
  autodiscover
```

#### Docker Compose example

```yaml
services:
  autodiscover:
    build: .
    ports:
      - "8000:8000"
    environment:
      - COMPANY_NAME=My Company
      - SUPPORT_URL=https://autodiscover.example.com
      - DOMAIN=example.com
      # IMAP (leave IMAP_HOST empty to disable)
      - IMAP_HOST=imap.example.com
      - IMAP_PORT=993
      - IMAP_SOCKET=SSL
      # POP3 (leave POP_HOST empty to disable)
      - POP_HOST=
      - POP_PORT=
      - POP_SOCKET=
      # SMTP (leave SMTP_HOST empty to disable)
      - SMTP_HOST=smtp.example.com
      - SMTP_PORT=587
      - SMTP_SOCKET=STARTTLS
      # ActiveSync (leave MOBILESYNC_URL empty to disable)
      - MOBILESYNC_URL=
      - MOBILESYNC_NAME=
      # LDAP (leave LDAP_HOST empty to disable)
      - LDAP_HOST=
      - LDAP_PORT=
      - LDAP_SOCKET=
      - LDAP_BASE=
      - LDAP_USER_FIELD=
      - LDAP_USER_BASE=
      - LDAP_SEARCH=
      # iOS profile (leave PROFILE_IDENTIFIER empty to disable)
      - PROFILE_IDENTIFIER=com.example.autodiscover
      - PROFILE_UUID=92943D26-CAB3-4086-897D-DC6C0D8B1E86
      - MAIL_UUID=7A981A9E-D5D0-4EF8-87FE-39FD6A506FAC
      - LDAP_UUID=6ECB6BA9-2208-4ABF-9E60-4E9F4CD7309E
    restart: unless-stopped
```

### Nginx reverse proxy

```nginx
server {
    listen 80;
    server_name autoconfig.example.com autodiscover.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name autoconfig.example.com autodiscover.example.com;

    ssl_certificate     /etc/letsencrypt/live/autoconfig.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/autoconfig.example.com/privkey.pem;

    location / {
        proxy_set_header Host              $http_host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass http://127.0.0.1:8000;
    }
}
```

---

## Configuration reference

All settings are passed as environment variables. A service is disabled when its primary host/URL variable is left empty.

| Variable             | Description                                         | Required |
|----------------------|-----------------------------------------------------|----------|
| `COMPANY_NAME`       | Display name used in templates and the support page | Yes      |
| `SUPPORT_URL`        | URL of this autodiscover service                    | Yes      |
| `DOMAIN`             | Default email domain                                | Yes      |
| `IMAP_HOST`          | IMAP server hostname                                |          |
| `IMAP_PORT`          | IMAP port (e.g. `993`)                              |          |
| `IMAP_SOCKET`        | `SSL` or `STARTTLS`                                 |          |
| `POP_HOST`           | POP3 server hostname                                |          |
| `POP_PORT`           | POP3 port (e.g. `995`)                              |          |
| `POP_SOCKET`         | `SSL` or `STARTTLS`                                 |          |
| `SMTP_HOST`          | SMTP server hostname                                |          |
| `SMTP_PORT`          | SMTP port (e.g. `587`)                              |          |
| `SMTP_SOCKET`        | `SSL` or `STARTTLS`                                 |          |
| `MOBILESYNC_URL`     | ActiveSync server URL                               |          |
| `MOBILESYNC_NAME`    | ActiveSync display name                             |          |
| `LDAP_HOST`          | LDAP server hostname                                |          |
| `LDAP_PORT`          | LDAP port (e.g. `636`)                              |          |
| `LDAP_SOCKET`        | `SSL` or `STARTTLS`                                 |          |
| `LDAP_BASE`          | LDAP base DN                                        |          |
| `LDAP_USER_FIELD`    | Username attribute (e.g. `uid`)                     |          |
| `LDAP_USER_BASE`     | User search base DN                                 |          |
| `LDAP_SEARCH`        | LDAP search filter                                  |          |
| `PROFILE_IDENTIFIER` | iOS profile bundle identifier (enables iOS profile) |          |
| `PROFILE_UUID`       | iOS profile UUID                                    |          |
| `MAIL_UUID`          | iOS mail payload UUID                               |          |
| `LDAP_UUID`          | iOS LDAP payload UUID                               |          |

---

## DNS records

Point `autoconfig` and `autodiscover` subdomains at your service, then add SRV records so clients can locate mail servers automatically.

```plaintext
autoconfig          IN  A      <service-ip>
autodiscover        IN  A      <service-ip>
imap                IN  CNAME  <mx-domain>.
smtp                IN  CNAME  <mx-domain>.
@                   IN  MX 10  <mx-domain>.
@                   IN  TXT    "mailconf=https://autoconfig.<domain>/mail/config-v1.1.xml"
_imaps._tcp         IN  SRV    0 0 <IMAP_PORT>  <mx-domain>.
_pop3s._tcp         IN  SRV    0 0 <POP_PORT>   <mx-domain>.
_submission._tcp    IN  SRV    0 0 <SMTP_PORT>  <mx-domain>.
_autodiscover._tcp  IN  SRV    0 0 443          autodiscover.<domain>.
_ldap._tcp          IN  SRV    0 0 <LDAP_PORT>  <LDAP_HOST>.
```

For Cloudflare Workers, `<service-ip>` is not needed — point the subdomains at the Worker route instead (Settings → Triggers → Routes in the CF dashboard).

---

## Development

```bash
npm install

npm run dev         # CF Workers local dev (http://localhost:8787, uses wrangler.toml [vars])
npm test            # unit tests (Vitest)
npm run type-check  # TypeScript — checks both source and test tsconfigs

npm run server      # Bun local server (http://localhost:8000, uses process.env)
```

---

## Notes

- If an email address is submitted without `@`, the configured `DOMAIN` is appended automatically.
- The iOS profile section (`/email.mobileconfig` and the form on the support page) is only shown when `PROFILE_IDENTIFIER` is set.
- IMAP takes precedence over POP3 in the iOS profile when both are configured.

---

## Links

- Mozilla [Autoconfig format](https://developer.mozilla.org/en-US/docs/Mozilla/Thunderbird/Autoconfiguration/FileFormat/HowTo)
- Microsoft [Autodiscover protocol](https://docs.microsoft.com/en-us/openspecs/exchange_server_protocols/ms-ascmd/1a3490f1-afe1-418a-aa92-6f630036d65a)
- Apple [Configuration Profile reference](https://developer.apple.com/library/archive/featuredarticles/iPhoneConfigurationProfileRef/index.html)
- [DNS SRV records for LDAP autodiscover](https://github.com/doctorjbeam/LDAPAutoDiscover)

---

## Credits

Originally inspired by [sylvaindumont/autodiscover.xml](https://github.com/sylvaindumont/autodiscover.xml) and [johansmitsnl/docker-email-autodiscover](https://github.com/johansmitsnl/docker-email-autodiscover). Based on the work of [Monogramm/autodiscover-email-settings](https://github.com/Monogramm/autodiscover-email-settings).

Thanks to [@HLFH](https://github.com/HLFH) for the original Nginx configuration example.

This fork is a full rewrite in TypeScript on [Hono](https://hono.dev/), targeting Cloudflare Workers and Bun.

## License

[MIT](LICENSE) — © 2021 Monogramm, © 2026 jogerj
