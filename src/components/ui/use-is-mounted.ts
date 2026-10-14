import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function useIsMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
