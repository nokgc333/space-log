import { describe, expect, it } from "vitest";

import { securityHeaders } from "./headers";

const valueOf = (isDevelopment: boolean, key: string) =>
  securityHeaders({ isDevelopment }).find((header) => header.key === key)
    ?.value;

const directives = (isDevelopment: boolean) => {
  const csp = valueOf(isDevelopment, "Content-Security-Policy") ?? "";
  return new Map(
    csp.split("; ").map((part) => {
      const [name, ...values] = part.split(" ");
      return [name, values] as const;
    }),
  );
};

describe("securityHeaders", () => {
  it("sends each header once", () => {
    const keys = securityHeaders({ isDevelopment: false }).map(
      (header) => header.key,
    );
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.sort()).toEqual(
      [
        "Content-Security-Policy",
        "Permissions-Policy",
        "Referrer-Policy",
        "Strict-Transport-Security",
        "X-Content-Type-Options",
        "X-Frame-Options",
      ].sort(),
    );
  });

  describe("the basic hardening headers", () => {
    it("stops the browser from guessing a file's type", () => {
      expect(valueOf(false, "X-Content-Type-Options")).toBe("nosniff");
    });

    it("sends the origin only, and only to the same level of security", () => {
      expect(valueOf(false, "Referrer-Policy")).toBe(
        "strict-origin-when-cross-origin",
      );
    });

    it("refuses to be framed (for browsers that ignore frame-ancestors)", () => {
      expect(valueOf(false, "X-Frame-Options")).toBe("DENY");
    });

    it("keeps the page away from camera, microphone, location, payment and usb", () => {
      expect(valueOf(false, "Permissions-Policy")).toBe(
        "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
      );
    });

    it("asks browsers to use https for two years, subdomains included", () => {
      expect(valueOf(false, "Strict-Transport-Security")).toBe(
        "max-age=63072000; includeSubDomains",
      );
    });
  });

  describe("the content security policy", () => {
    it("allows only the site itself by default", () => {
      expect(directives(false).get("default-src")).toEqual(["'self'"]);
    });

    it("never allows eval in production", () => {
      expect(directives(false).get("script-src")).not.toContain(
        "'unsafe-eval'",
      );
    });

    it("allows eval only for the development server", () => {
      expect(directives(true).get("script-src")).toContain("'unsafe-eval'");
    });

    it("allows the scripts and styles the framework puts into the page itself", () => {
      expect(directives(false).get("script-src")).toEqual([
        "'self'",
        "'unsafe-inline'",
      ]);
      expect(directives(false).get("style-src")).toEqual([
        "'self'",
        "'unsafe-inline'",
      ]);
    });

    it("loads images and fonts only from the site, data: and blob:", () => {
      expect(directives(false).get("img-src")).toEqual([
        "'self'",
        "data:",
        "blob:",
      ]);
      expect(directives(false).get("font-src")).toEqual(["'self'", "data:"]);
    });

    it("talks only to the site (the contact form's Server Action included)", () => {
      expect(directives(false).get("connect-src")).toEqual(["'self'"]);
    });

    it("lets the 3D scene use workers from the site and from blob:", () => {
      expect(directives(false).get("worker-src")).toEqual(["'self'", "blob:"]);
    });

    it("forbids plug-ins and a changed base address", () => {
      expect(directives(false).get("object-src")).toEqual(["'none'"]);
      expect(directives(false).get("base-uri")).toEqual(["'self'"]);
    });

    it("sends forms only to the site", () => {
      expect(directives(false).get("form-action")).toEqual(["'self'"]);
    });

    it("forbids being framed by any site", () => {
      expect(directives(false).get("frame-ancestors")).toEqual(["'none'"]);
    });

    it("asks the browser to upgrade plain http requests", () => {
      expect(directives(false).has("upgrade-insecure-requests")).toBe(true);
    });

    it("differs between development and production only by unsafe-eval", () => {
      const production = directives(false);
      const development = directives(true);
      expect([...development.keys()]).toEqual([...production.keys()]);
      for (const [name, values] of production) {
        const expected =
          name === "script-src" ? [...values, "'unsafe-eval'"] : values;
        expect(development.get(name)).toEqual(expected);
      }
    });
  });
});
