import { describe, it, expect } from "vitest";
import { parseAutodiscoverBody } from "../src/autodiscover";

const DEFAULT_SCHEMA =
  "http://schemas.microsoft.com/exchange/autodiscover/responseschema/2006";

const OUTLOOK_SCHEMA =
  "http://schemas.microsoft.com/exchange/autodiscover/outlook/responseschema/2006a";

describe("parseAutodiscoverBody", () => {
  it("returns null email and default schema for empty body", () => {
    expect(parseAutodiscoverBody("")).toEqual({
      email: null,
      schema: DEFAULT_SCHEMA,
    });
  });

  it("returns null email and default schema for whitespace body", () => {
    expect(parseAutodiscoverBody("   ")).toEqual({
      email: null,
      schema: DEFAULT_SCHEMA,
    });
  });

  it("extracts email and schema from a typical Outlook POST body", () => {
    const body = `<?xml version="1.0" encoding="utf-8"?>
<Autodiscover xmlns="http://schemas.microsoft.com/exchange/autodiscover/responseschema/2006">
  <Request>
    <EMailAddress>user@example.com</EMailAddress>
    <AcceptableResponseSchema>${OUTLOOK_SCHEMA}</AcceptableResponseSchema>
  </Request>
</Autodiscover>`;

    expect(parseAutodiscoverBody(body)).toEqual({
      email: "user@example.com",
      schema: OUTLOOK_SCHEMA,
    });
  });

  it("falls back to default schema when AcceptableResponseSchema is absent", () => {
    const body = `<Autodiscover><Request><EMailAddress>user@example.com</EMailAddress></Request></Autodiscover>`;
    const result = parseAutodiscoverBody(body);
    expect(result.email).toBe("user@example.com");
    expect(result.schema).toBe(DEFAULT_SCHEMA);
  });

  it("is case-insensitive for EMailAddress tag", () => {
    const body = `<autodiscover><request><emailaddress>user@example.com</emailaddress></request></autodiscover>`;
    expect(parseAutodiscoverBody(body).email).toBe("user@example.com");
  });

  it("returns null email when EMailAddress element is absent", () => {
    const body = `<Autodiscover><Request></Request></Autodiscover>`;
    expect(parseAutodiscoverBody(body).email).toBeNull();
  });

  it("trims whitespace from extracted values", () => {
    const body = `<EMailAddress>  user@example.com  </EMailAddress>`;
    expect(parseAutodiscoverBody(body).email).toBe("user@example.com");
  });
});
