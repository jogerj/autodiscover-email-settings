import { describe, it, expect } from "vitest";
import { parseEmail } from "../src/email";

describe("parseEmail", () => {
  it("handles a full email address", () => {
    expect(parseEmail("user@example.com", "default.com")).toEqual({
      email: "user@example.com",
      username: "user",
      domain: "example.com",
    });
  });

  it("appends the default domain when input has no @", () => {
    expect(parseEmail("john", "example.com")).toEqual({
      email: "john@example.com",
      username: "john",
      domain: "example.com",
    });
  });

  it("returns empty parts for empty input", () => {
    expect(parseEmail("", "example.com")).toEqual({
      email: "",
      username: "",
      domain: "example.com",
    });
  });

  it("returns empty parts for whitespace-only input", () => {
    expect(parseEmail("   ", "example.com")).toEqual({
      email: "",
      username: "",
      domain: "example.com",
    });
  });

  it("trims whitespace from the input", () => {
    expect(parseEmail("  user@example.com  ", "default.com")).toEqual({
      email: "user@example.com",
      username: "user",
      domain: "example.com",
    });
  });

  it("uses the part after the first @ as the domain (ignores subsequent @)", () => {
    const result = parseEmail("user@sub.example.com", "default.com");
    expect(result.username).toBe("user");
    expect(result.domain).toBe("sub.example.com");
    expect(result.email).toBe("user@sub.example.com");
  });
});
