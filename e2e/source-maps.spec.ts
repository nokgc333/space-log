import { expect, test } from "@playwright/test";

const MAP_COMMENT = /\/\/# sourceMappingURL=(\S+)\s*$/;

test("the scripts that run on the home page point to source maps that readers can open", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const scripts = await page
    .locator("script[src]:not([nomodule])")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("src")));
  const own = scripts.filter(
    (src): src is string => !!src && src.startsWith("/_next/static/"),
  );

  expect(own.length).toBeGreaterThan(3);
  for (const src of own) {
    const script = await (await request.get(src)).text();
    const target = MAP_COMMENT.exec(script)?.[1];
    expect(target, `${src} names its source map`).toBeDefined();

    const response = await request.get(
      new URL(target ?? "", `http://x${src}`).pathname,
    );
    expect(response.status(), src).toBe(200);
    const map = await response.json();
    expect(map.version, src).toBe(3);
    expect(map.sources.length, src).toBeGreaterThan(0);
  }
});
