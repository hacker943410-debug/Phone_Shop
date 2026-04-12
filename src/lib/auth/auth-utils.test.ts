import {
  canAccessPath,
  getNavigationItemsForRole,
  normalizeRedirectPath,
  resolvePostLoginPath,
} from "@/lib/auth/access";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session-token";

describe("auth utilities", () => {
  const originalSecret = process.env.SESSION_SECRET;

  beforeEach(() => {
    process.env.SESSION_SECRET = "phoneshop-test-secret";
  });

  afterAll(() => {
    process.env.SESSION_SECRET = originalSecret;
  });

  it("hashes and verifies passwords", () => {
    const hash = hashPassword("admin1234!");

    expect(hash).toContain("scrypt$");
    expect(verifyPassword("admin1234!", hash)).toBe(true);
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("creates and validates signed session tokens", () => {
    const token = createSessionToken({
      userId: "user-admin",
      role: "ADMIN",
      username: "admin",
    });

    expect(verifySessionToken(token)).toMatchObject({
      userId: "user-admin",
      role: "ADMIN",
      username: "admin",
    });

    const [payload, signature] = token.split(".");
    expect(verifySessionToken(`${payload}.tampered${signature}`)).toBeNull();
  });

  it("applies role-based navigation and path rules", () => {
    expect(canAccessPath("/settings/base", "ADMIN")).toBe(true);
    expect(canAccessPath("/settings/base", "STAFF")).toBe(false);

    expect(
      getNavigationItemsForRole("STAFF").some(
        (item) => item.href === "/settings/base",
      ),
    ).toBe(false);

    expect(normalizeRedirectPath("https://example.com")).toBe("/");
    expect(resolvePostLoginPath("STAFF", "/settings/base")).toBe("/");
    expect(resolvePostLoginPath("ADMIN", "/settings/base")).toBe(
      "/settings/base",
    );
  });
});
