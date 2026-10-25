// @vitest-environment node
import { describe, expect, it } from "vitest";

import { hero } from "@/lib/content";

import AppleIcon, { size as appleSize } from "./apple-icon";
import Icon, { size as iconSize } from "./icon";
import OpengraphImage, {
  alt,
  contentType,
  size as ogSize,
} from "./opengraph-image";

async function pngOf(response: Response) {
  const bytes = new Uint8Array(await response.arrayBuffer());
  const view = new DataView(bytes.buffer);
  return {
    isPng: [137, 80, 78, 71].every((byte, i) => bytes[i] === byte),
    width: view.getUint32(16),
    height: view.getUint32(20),
  };
}

describe("generated images", () => {
  it.each([
    ["the favicon", Icon, iconSize],
    ["the Apple touch icon", AppleIcon, appleSize],
    ["the link preview image", OpengraphImage, ogSize],
  ])("%s is a PNG of its declared size", async (_name, render, size) => {
    const response = await render();

    expect(response.headers.get("content-type")).toBe("image/png");
    expect(await pngOf(response)).toEqual({
      isPng: true,
      width: size.width,
      height: size.height,
    });
  });

  it("makes the link preview the standard 1200 x 630 size", () => {
    expect(ogSize).toEqual({ width: 1200, height: 630 });
    expect(contentType).toBe("image/png");
  });

  it("describes the link preview image for people who cannot see it", () => {
    expect(alt.length).toBeGreaterThan(0);
  });

  it("draws only text that the default image font can show, so no glyph is missing", () => {
    expect(hero.heading.title).toMatch(/^[\x20-\x7e\n]+$/);
  });
});
