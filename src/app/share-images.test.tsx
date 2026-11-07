// @vitest-environment node
import { describe, expect, it } from "vitest";

import AppleIcon, { size as appleSize } from "./apple-icon";
import Icon, { size as iconSize } from "./icon";
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
  ])("%s is a PNG of its declared size", async (_name, render, size) => {
    const response = await render();

    expect(response.headers.get("content-type")).toBe("image/png");
    expect(await pngOf(response)).toEqual({
      isPng: true,
      width: size.width,
      height: size.height,
    });
  });
});
