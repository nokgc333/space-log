// @vitest-environment node
import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";

const read = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf-8");
const json = (file: string) => JSON.parse(read(file));

describe("pinned Node and npm", () => {
  const nvmrcMajor = Number(
    read(".nvmrc").trim().replace(/^v/, "").split(".")[0],
  );
  const { engines, packageManager } = json("package.json");

  it("pins a Node major version in .nvmrc", () => {
    expect(Number.isInteger(nvmrcMajor)).toBe(true);
  });

  it("declares the same minimum Node major version in package.json engines", () => {
    expect(Number(/>=\s*(\d+)/.exec(engines.node)?.[1])).toBe(nvmrcMajor);
  });

  it("declares the npm version that CI uses, in engines and packageManager", () => {
    const pinned = /^npm@(\d+\.\d+\.\d+)$/.exec(packageManager)?.[1];

    expect(pinned).toBeDefined();
    expect(engines.npm).toBe(`>=${pinned}`);
  });

  it("makes npm refuse to install with an unsupported Node or npm", () => {
    expect(read(".npmrc")).toMatch(/^engine-strict=true$/m);
  });

  it("runs the tests on the pinned Node major version", () => {
    expect(Number(process.versions.node.split(".")[0])).toBe(nvmrcMajor);
  });

  it("reads the Node version from .nvmrc in every workflow instead of hard-coding it", () => {
    const dir = path.join(process.cwd(), ".github", "workflows");
    const files = fs.readdirSync(dir).filter((file) => file.endsWith(".yml"));

    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const text = fs.readFileSync(path.join(dir, file), "utf-8");
      expect(text, file).not.toMatch(/^\s*node-version:\s/m);
      expect(text, file).not.toMatch(/NODE_VERSION/);
      if (text.includes("actions/setup-node")) {
        expect(text, file).toContain("node-version-file: .nvmrc");
      }
    }
  });
});

describe("Dependabot", () => {
  const config = read(".github/dependabot.yml");

  it("watches npm and GitHub Actions weekly", () => {
    expect(config).toContain("package-ecosystem: npm");
    expect(config).toContain("package-ecosystem: github-actions");
    expect(config.match(/interval: weekly/g)).toHaveLength(2);
  });

  it("groups minor and patch updates to keep the number of pull requests down", () => {
    expect(config).toMatch(/minor-and-patch:/);
  });

  it("does not propose major versions that upstream constraints block", () => {
    for (const name of ["eslint", "typescript", "@types/node"]) {
      expect(config, name).toContain(name);
    }
    expect(config).toContain("version-update:semver-major");
  });
});

describe("pre-commit checks", () => {
  it("runs lint-staged from the husky pre-commit hook", () => {
    expect(read(".husky/pre-commit")).toContain("lint-staged");
  });

  it("enables the hooks on install", () => {
    expect(json("package.json").scripts.prepare).toBe("husky");
  });

  it("checks every staged file for secrets and formats code", () => {
    const config = json(".lintstagedrc.json");
    const code = config["*.{ts,tsx,mjs,mts,cjs}"].join(" ");

    expect(config["*"]).toContain("secretlint");
    expect(code).toContain("eslint");
    expect(code).toContain("prettier");
  });

  it("uses the recommended secretlint rules and skips generated files", () => {
    expect(json(".secretlintrc.json").rules[0].id).toBe(
      "@secretlint/secretlint-rule-preset-recommend",
    );
    expect(read(".secretlintignore")).toContain("package-lock.json");
  });
});

describe("branch protection policy", () => {
  const jobNames = fs
    .readdirSync(path.join(process.cwd(), ".github", "workflows"))
    .filter((file) => file.endsWith(".yml"))
    .flatMap((file) =>
      [
        ...read(`.github/workflows/${file}`).matchAll(/^\s{4}name: (.+)$/gm),
      ].map((m) => m[1].trim()),
    );

  it("requires only checks that really exist as jobs", () => {
    const required = json(".github/branch-protection/main.json")
      .required_status_checks.contexts;

    expect(required.length).toBeGreaterThan(0);
    for (const name of required) {
      expect(jobNames, name).toContain(name);
    }
  });

  it("forbids force pushes and deletions on both branches", () => {
    for (const branch of ["main", "develop"]) {
      const policy = json(`.github/branch-protection/${branch}.json`);

      expect(policy.allow_force_pushes, branch).toBe(false);
      expect(policy.allow_deletions, branch).toBe(false);
    }
  });
});

describe("Security workflow", () => {
  const security = read(".github/workflows/security.yml");

  it("fails the build on high severity production vulnerabilities", () => {
    expect(security).toContain("npm audit --omit=dev --audit-level=high");
  });

  it("reviews the dependencies added by a pull request", () => {
    expect(security).toContain("actions/dependency-review-action");
    expect(security).toMatch(/fail-on-severity: high/);
  });

  it("scans the source with CodeQL and runs weekly to notice new advisories", () => {
    expect(security).toContain("github/codeql-action/init");
    expect(security).toContain("github/codeql-action/analyze");
    expect(security).toContain("security-events: write");
    expect(security).toMatch(/schedule:\s*\n\s+- cron:/);
  });
});
