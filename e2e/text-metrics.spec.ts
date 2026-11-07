import { expect, test } from "@playwright/test";

import { openAt } from "./viewport";
import { stageFit, statementHeightInLines } from "./helpers";

test("the stage buttons and the INVERSION statements stay in place when every letter is about 10% wider, as when a platform rounds the width of each letter up", async ({
  page,
}) => {
  for (const width of [1440, 1100, 1024, 1023, 900, 767, 520, 375, 320]) {
    await openAt(page, width, 900);
    await page.addStyleTag({
      content:
        "#pipeline ol button span, #inversion p { letter-spacing: 0.055em !important; }",
    });
    const fit = await stageFit(page);
    expect(fit.scrolls).toBe(false);
    expect(fit.outside).toBe(0);
    expect(fit.clipped).toBe(0);
    expect(fit.wrapped).toBe(0);
    expect(await statementHeightInLines(page, 0)).toBe(1);
    expect(await statementHeightInLines(page, 1)).toBe(1);
    const sideways = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(sideways).toBe(false);
  }
});
