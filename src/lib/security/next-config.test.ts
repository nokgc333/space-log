import { describe, expect, it } from "vitest";

import nextConfig from "../../../next.config";
import { securityHeaders } from "./headers";

describe("next.config", () => {
  it("does not announce which framework runs the site", () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it("sends the security headers with every path", async () => {
    const rules = (await nextConfig.headers?.()) ?? [];
    expect(rules).toEqual([
      {
        source: "/:path*",
        headers: securityHeaders({ isDevelopment: false }),
      },
    ]);
  });
});
