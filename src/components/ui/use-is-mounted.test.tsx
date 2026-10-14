import { renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { useIsMounted } from "./use-is-mounted";

function Probe() {
  return <span>{String(useIsMounted())}</span>;
}

describe("useIsMounted", () => {
  it("is false while rendering on the server", () => {
    expect(renderToString(<Probe />)).toContain("false");
  });

  it("is true once the component runs in the browser", () => {
    const { result } = renderHook(() => useIsMounted());
    expect(result.current).toBe(true);
  });
});
