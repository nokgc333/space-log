import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest does not expose globals, so Testing Library cannot register this itself.
afterEach(() => {
  cleanup();
});
