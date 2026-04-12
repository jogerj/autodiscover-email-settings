# Agent Instructions

## Project overview

Stateless email auto-configuration service. Given a domain's mail server settings via environment variables, it generates XML and plist responses that let email clients (Outlook, Thunderbird, Apple Mail, iOS) configure themselves automatically.

No database. No external API calls. Every request reads config → renders a template → returns a string.

## Tech stack

- **TypeScript** — strict mode, `moduleResolution: Bundler`, `target: ES2022`
- **Hono v4** — routing and request handling
- **Cloudflare Workers** — primary deployment target (`src/index.ts`)
- **Bun** — secondary deployment target via Docker (`src/server.ts`)
- **Vitest** — unit tests
- **Wrangler** — CF Workers local dev and deployment

## Project structure

```text
src/
  types.ts          — Env, Settings, EmailParts interfaces. No logic.
  settings.ts       — buildSettings(env: Env): Settings. Pure function.
  email.ts          — parseEmail(input, domain): EmailParts. Pure function.
  autodiscover.ts   — parseAutodiscoverBody(body): { email, schema }. Regex parser.
  index.ts          — CF Workers entry. Hono app with Bindings: Env.
  server.ts         — Bun/Docker entry. Reads process.env, calls app.fetch(req, env).
  templates/
    autodiscover.ts — autodiscoverXml(params, settings): string
    autoconfig.ts   — autoconfigXml(settings): string
    mobileconfig.ts — mobileconfigXml(params, settings): string
    index.ts        — indexHtml(settings): string

test/
  email.test.ts         — parseEmail unit tests
  autodiscover.test.ts  — parseAutodiscoverBody unit tests
  templates.test.ts     — template function unit tests
  smoke.sh              — curl smoke tests against a running server
```

## Key commands

```bash
bun run dev         # CF Workers local dev on http://localhost:8787
bun run server      # Bun local server on http://localhost:8000
bun run test        # Vitest unit tests
bun run type-check  # tsc --noEmit (source) && tsc -p tsconfig.test.json --noEmit (tests)
bun run deploy      # wrangler deploy
```

## Code style

- Strict TypeScript — no `any`, no type assertions unless truly necessary
- Pure functions wherever possible — side-effect-free, easily testable
- Template functions return plain strings — no template engines, no file I/O

## Architecture notes

### Two entry points, one app

`src/index.ts` exports a `Hono<{ Bindings: Env }>` app as the default CF Workers handler. CF Workers runtime injects env bindings into `c.env` per-request.

`src/server.ts` is the Bun entry. It imports the same Hono app and calls `app.fetch(req, env)` directly, passing an `Env` object built from `process.env`. This means `c.env` in every handler is populated identically regardless of runtime — no route logic is duplicated.

### Settings flow

Every route handler calls `buildSettings(c.env)` at the start of the request. Settings are not cached at module level because CF Workers isolates may share module scope across requests with different env bindings.

### Template functions

Each template is a plain TypeScript function returning a string. Swig `{% if %}` blocks become ternary template expressions. There are no template files — everything is inline TypeScript.

### Enabling/disabling services

A service is enabled when its host (or URL for MobileSync) env var is non-empty. Templates check `settings.imap.host`, `settings.pop.host`, etc. and conditionally include the relevant XML blocks.

## Patterns

**Route handler:**
```ts
app.get("/path", async (c) => {
  const settings = buildSettings(c.env);
  // parse input from c.req.query() or await c.req.text()
  // call template function
  return c.body(xml, 200, { "Content-Type": "application/xml; charset=utf-8" });
});
```

**Template function:**
```ts
export function fooXml(params: FooParams, s: Settings): string {
  return `<?xml version="1.0"?>
<Root>
  ${s.imap.host ? `<Imap>${s.imap.host}</Imap>` : ""}
</Root>`;
}
```

## TypeScript configuration

Two tsconfigs exist for a reason — they must not be collapsed into one:

- `tsconfig.json` — checks `src/` only. Uses `@cloudflare/workers-types` as the sole type package, which provides CF Workers globals but NOT Node.js globals.
- `tsconfig.test.json` — checks `src/` + `test/`. Uses `@types/node` + DOM lib. No CF Workers types. Vitest requires Node.js types.

`src/server.ts` uses `process.env` and includes a local `declare const process` so it type-checks under `tsconfig.json` without needing `@types/node` in the CF Workers config.

Do not add `skipLibCheck: true`. The dual-tsconfig setup exists specifically to avoid it.

## What to avoid

- Do not add `skipLibCheck: true` to either tsconfig
- Do not import `process` without a local `declare const process` in files checked by `tsconfig.json`
- Do not cache `buildSettings()` at module level — call it per-request inside handlers
- Do not add route logic to `src/server.ts` — it is a thin entry point only
- Do not use template engines or file I/O — templates are TypeScript template literals
- Do not mock `buildSettings` or template functions in tests — they are pure functions and are tested directly

## Adding a new environment variable

1. Add the field to `Env` in `src/types.ts`
2. Add the field to `Settings` in `src/types.ts` (if it maps to a new settings field)
3. Map it in `buildSettings()` in `src/settings.ts`
4. Add it to `src/server.ts` in the `env` object
5. Add it to `wrangler.toml` under `[vars]`
6. Use it in the relevant template function in `src/templates/`

## Adding a new route

Add the handler directly in `src/index.ts`. Keep business logic in separate pure functions or template files — handlers should only parse input, call helpers, and return responses.

## Tests

Unit tests cover pure functions only (`parseEmail`, `parseAutodiscoverBody`, template functions). They run via Vitest and do not require Wrangler.

Route-level testing is done with `test/smoke.sh` against a live `wrangler dev` or `bun run src/server.ts` instance.
