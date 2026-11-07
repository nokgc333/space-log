import type { Page } from "@playwright/test";

const DESKTOP = { width: 1440, height: 900 };

export async function openAt(
  page: Page,
  width: number,
  height: number,
  path = "/",
) {
  await page.setViewportSize({ width, height });
  await page.goto(path);
}

export const openDesktop = (page: Page, path = "/") =>
  openAt(page, DESKTOP.width, DESKTOP.height, path);
