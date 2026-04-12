import type { EmailParts } from "./types";

export function parseEmail(input: string, defaultDomain: string): EmailParts {
  if (!input || input.trim() === "") {
    return { email: "", username: "", domain: defaultDomain };
  }

  const trimmed = input.trim();

  if (trimmed.includes("@")) {
    const atIndex = trimmed.indexOf("@");
    const username = trimmed.slice(0, atIndex);
    const domain = trimmed.slice(atIndex + 1);
    return { email: trimmed, username, domain };
  }

  // No @ — treat whole string as username, append default domain
  return {
    email: `${trimmed}@${defaultDomain}`,
    username: trimmed,
    domain: defaultDomain,
  };
}
