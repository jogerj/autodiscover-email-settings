const DEFAULT_SCHEMA =
  "http://schemas.microsoft.com/exchange/autodiscover/responseschema/2006";

export interface AutodiscoverParseResult {
  email: string | null;
  schema: string;
}

export function parseAutodiscoverBody(body: string): AutodiscoverParseResult {
  if (!body || body.trim() === "") {
    return { email: null, schema: DEFAULT_SCHEMA };
  }

  const schemaMatch = body.match(
    /<AcceptableResponseSchema[^>]*>([\s\S]*?)<\/AcceptableResponseSchema>/i
  );
  const schema = schemaMatch ? schemaMatch[1].trim() : DEFAULT_SCHEMA;

  const emailMatch = body.match(
    /<EMailAddress[^>]*>([\s\S]*?)<\/EMailAddress>/i
  );
  const email = emailMatch ? emailMatch[1].trim() : null;

  return { email, schema };
}
