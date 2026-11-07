// @vitest-environment node
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const SCENE = path.join(process.cwd(), "src", "components", "scene");
const FRAMEWORKS =
  /from\s+"(react|react-dom|three|@react-three\/[^"]+|next[^"]*)"/;

function logicFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return logicFiles(full);
    const isLogic =
      entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".test.ts") &&
      !entry.name.startsWith("use-");
    return isLogic ? [full] : [];
  });
}

describe("3D scene logic", () => {
  const files = logicFiles(SCENE);

  it("finds the logic files, so this check cannot pass by looking at nothing", () => {
    const names = files.map((file) => path.basename(file));

    expect(names).toEqual(
      expect.arrayContaining([
        "network-graph.ts",
        "network-frame.ts",
        "network-activity.ts",
        "network-palette.ts",
        "network-pointer.ts",
        "particle-physics.ts",
        "scene-settings.ts",
      ]),
    );
  });

  it.each(logicFiles(SCENE).map((file) => [path.relative(SCENE, file), file]))(
    "%s does not depend on React, three or Next.js, so it runs and is tested on its own",
    (_name, file) => {
      expect(fs.readFileSync(file, "utf-8")).not.toMatch(FRAMEWORKS);
    },
  );
});
