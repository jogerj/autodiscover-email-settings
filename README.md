# ![Autodiscover](icon.svg) Autodiscover Email Settings <!-- omit from toc -->

[![Docker Pulls](https://img.shields.io/docker/pulls/jogerj/autodiscover-email-settings.svg)](https://hub.docker.com/r/jogerj/autodiscover-email-settings/)
![Docker Image Size (latest by date)](https://img.shields.io/docker/image-size/jogerj/autodiscover-email-settings)

A fork of [Monogramm/autodiscover-email-settings](https://github.com/Monogramm/autodiscover-email-settings), rewritten in TypeScript on [Hono](https://hono.dev/) for serverless and container deployments.

Provides email client auto-configuration for:

- **Microsoft Outlook / Apple Mail** — Autodiscover XML (`/autodiscover/autodiscover.xml`)
- **Mozilla Thunderbird** — Autoconfig XML (`/mail/config-v1.1.xml`)
- **iOS / Apple Mail** — Configuration Profile download (`/email.mobileconfig`)
- **Browser** — Support page with manual settings and iOS profile form (`/`)

## Screenshots

![General settings](docs/screenshot_01.png)

![iOS profile form](docs/screenshot_02.png)

## Table of contents <!-- omit from toc -->

- [Screenshots](#screenshots)
- [Deployment](#deployment)
  - [Cloudflare Workers via GitHub Actions (recommended)](#cloudflare-workers-via-github-actions-recommended)
    - [1. Configure `wrangler.toml`](#1-configure-wranglertoml)
    - [2. Add repository secret](#2-add-repository-secret)
    - [3. Create a workflow](#3-create-a-workflow)
  - [Cloudflare Workers (self deployment)](#cloudflare-workers-self-deployment)
  - [Cloudflare Workers (manual upload)](#cloudflare-workers-manual-upload)
  - [Docker (self-hosted)](#docker-self-hosted)
    - [Docker Compose](#docker-compose)
    - [Docker standalone](#docker-standalone)
  - [Nginx reverse proxy](#nginx-reverse-proxy)
  - [Caddy reverse proxy](#caddy-reverse-proxy)
- [Configuration reference](#configuration-reference)
- [DNS records](#dns-records)
- [Development](#development)
  - [1. Clone and install dependencies](#1-clone-and-install-dependencies)
  - [2. Configure `wrangler.toml`](#2-configure-wranglertoml)
  - [3. Run locally](#3-run-locally)
  - [4. Test](#4-test)
  - [5. Deploy (CLI)](#5-deploy-cli)
- [Notes](#notes)
- [Links](#links)
- [Credits](#credits)
- [License](#license)

## Deployment

### Cloudflare Workers via GitHub Actions (recommended)

Deploys to the Cloudflare edge globally with no infrastructure to manage. No local tooling required — the action handles building and deploying.

#### 1. Configure `wrangler.toml`

In your own repository, copy the example config and fill in your values. The action supplies `name`, `compatibility_date`, and `main` itself, so you only need the `[vars]` section.

```bash
cp wrangler.toml.example wrangler.toml
# edit [vars] with your mail server settings
```

Generate unique UUIDs for `PROFILE_UUID`, `MAIL_UUID`, and `LDAP_UUID` with `uuidgen` (or any UUID generator).

#### 2. Add repository secret

Create a Cloudflare API token with the following permissions:

| Resource | Permission |
| --- | --- |
| Account - Workers Scripts | Edit |
| User - Memberships | Read |
| User - User Details | Read |

When creating the token, under **Account Resources** select **Include → Specific account** and choose only the account you want to deploy to. This lets wrangler resolve the account automatically — without it you would need to set `account_id` in every `wrangler.toml`.

Then add it to your repository under **Settings → Secrets and variables → Actions**:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | The Cloudflare API token created above |

#### 3. Create a workflow

**Simplest** — deploys on every push to `main`, using `wrangler.toml` at the repo root:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - name: Deploy to Cloudflare Workers
        uses: jogerj/autodiscover-email-settings@v2
        with:
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

**Multi-environment** — manually triggered, one `wrangler.toml` per environment at `<environment>/wrangler.toml` in your repo:

```yaml
name: CI/CD
run-name: CI/CD (${{ github.event.inputs.environment_name }})

on:
  workflow_dispatch:
    inputs:
      environment_name:
        description: 'Select environment'
        required: true
        type: choice
        options:
          - my-domain-com
          - other-domain-com

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment_name }}
    steps:
      - uses: actions/checkout@v6

      - name: Deploy to Cloudflare Workers
        uses: jogerj/autodiscover-email-settings@v2
        with:
          config_path: ${{ github.event.inputs.environment_name }}/wrangler.toml
          worker_name: autodiscover-${{ github.event.inputs.environment_name }}
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

**Action inputs:**

| Input | Description | Default |
| --- | --- | --- |
| `cloudflare_api_token` | Cloudflare API token (**required**) | — |
| `config_path` | Path to `wrangler.toml` relative to repo root | `wrangler.toml` |
| `worker_name` | Name to deploy the worker under | `autodiscover-email-settings` |

### Cloudflare Workers (self deployment)

See [Development](#5-deploy-cli) for deploying with the Wrangler CLI. This is an option if you do not want to use GitHub Actions.

### Cloudflare Workers (manual upload)

Each [release](https://github.com/jogerj/autodiscover-email-settings/releases) includes a pre-built `worker.js`. You can upload it directly in the Cloudflare dashboard without any local tooling or CI setup.

1. Download `worker.js` from the [latest release](https://github.com/jogerj/autodiscover-email-settings/releases/latest).
2. In the Cloudflare dashboard go to **Workers & Pages → Create → Upload a Worker**.
3. Upload `worker.js` and give the worker a name, then click **Deploy**.
4. Open the worker's **Settings → Variables and Secrets** and add each variable from the [Configuration reference](#configuration-reference). You can modify the `wrangler.toml.example` file and copy-paste the whole text under `[vars]` into the Cloudflare dashboard to quickly add or edit variables (The syntax would be equivalent to a `.env` file).

---

### Docker (self-hosted)

Self-hosted alternative using the [Bun](https://bun.sh/) runtime. It's recommended to run behind a reverse proxy (e.g. Nginx or Caddy) for TLS termination and domain routing.

#### Docker Compose

```yaml
services:
  autodiscover:
    image: jogerj/autodiscover-email-settings:latest
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
      - POP_HOST=pop3.example.com
      - POP_PORT=995
      - POP_SOCKET=SSL
      # SMTP (leave SMTP_HOST empty to disable)
      - SMTP_HOST=smtp.example.com
      - SMTP_PORT=587
      - SMTP_SOCKET=STARTTLS
      # ActiveSync (leave MOBILESYNC_URL empty to disable)
      - MOBILESYNC_URL=https://sync.example.com
      - MOBILESYNC_NAME=sync.example.com
      # LDAP (leave LDAP_HOST empty to disable)
      - LDAP_HOST=ldap.example.com
      - LDAP_PORT=636
      - LDAP_SOCKET=SSL
      - LDAP_BASE=dc=ldap,dc=example,dc=com
      - LDAP_USER_FIELD=uid
      - LDAP_USER_BASE=ou=People,dc=ldap,dc=example,dc=com
      - LDAP_SEARCH=(|(objectClass=PostfixBookMailAccount))
      # iOS profile (leave PROFILE_IDENTIFIER empty to disable)
      - PROFILE_IDENTIFIER=com.example.autodiscover
      - PROFILE_UUID=92943D26-CAB3-4086-897D-DC6C0D8B1E86
      - MAIL_UUID=7A981A9E-D5D0-4EF8-87FE-39FD6A506FAC
      - LDAP_UUID=6ECB6BA9-2208-4ABF-9E60-4E9F4CD7309E
    restart: unless-stopped
```

#### Docker standalone

```bash
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
  jogerj/autodiscover-email-settings:latest
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

### Caddy reverse proxy

```caddy
autoconfig.example.com, autodiscover.example.com {
    reverse_proxy autodiscover:8000
}
```

Put Caddy on the same docker network as the `autodiscover` service. Caddy handles TLS automatically via Let's Encrypt — no certificate paths needed.

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
You might also want to disable the `workers.dev` subdomain since your account name will be visible there.

---

## Development

### 1. Clone and install dependencies

```bash
git clone https://github.com/jogerj/autodiscover-email-settings.git
cd autodiscover-email-settings
bun install
```

### 2. Configure `wrangler.toml`

```bash
cp wrangler.toml.example wrangler.toml
# edit [vars] with your mail server settings
```

### 3. Run locally

```bash
bun run dev         # Cloudflare Workers local dev (http://localhost:8787, uses wrangler.toml [vars])
bun run server      # Bun HTTP server (http://localhost:8000, uses process.env)
```

Override individual vars during Workers dev without editing `wrangler.toml` by creating a `.dev.vars` file (gitignored):

```ini
IMAP_HOST=imap.example.com
DOMAIN=example.com
```

### 4. Test

```bash
bun test            # unit tests (Vitest)
bun run type-check  # TypeScript type checking
bash test/smoke.sh  # smoke tests against a running local server
```

### 5. Deploy (CLI)

```bash
bun run deploy
```

---

## Notes

- If an email address is submitted without `@`, the configured `DOMAIN` is appended automatically.
- The iOS profile section (`/email.mobileconfig` and the form on the support page) is only shown when `PROFILE_IDENTIFIER` is set.
  The generated config is unsigned.
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
