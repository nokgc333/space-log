import { useEffect, useState } from "react";

export const IDLE_TIMEOUT_MS = 1000;

export function useAfterIdle(): boolean {
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    const start = () => setIsIdle(true);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(start, {
        timeout: IDLE_TIMEOUT_MS,
      });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(start, IDLE_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, []);

  return isIdle;
}
