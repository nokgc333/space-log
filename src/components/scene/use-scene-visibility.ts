"use client";

import { type RefObject, useEffect, useState } from "react";

export function useSceneVisibility(target: RefObject<HTMLElement | null>) {
  const [isInView, setIsInView] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);

  useEffect(() => {
    const element = target.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) =>
      setIsInView(entry.isIntersecting),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [target]);

  useEffect(() => {
    const update = () =>
      setIsDocumentVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  return { isInView, isDocumentVisible };
}
