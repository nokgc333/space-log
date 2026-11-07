// @vitest-environment node
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const config = fs.readFileSync(
  path.join(process.cwd(), "next.config.ts"),
  "utf-8",
);

describe("next.config.ts", () => {
  it("publishes source maps of the production build, because the code is public anyway and the maps are only fetched by a developer tool", () => {
    expect(config).toMatch(/productionBrowserSourceMaps:\s*true/);
  });

  it("does not announce the framework in a response header", () => {
    expect(config).toMatch(/poweredByHeader:\s*false/);
  });
});
