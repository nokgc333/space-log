# ADR-0001: The hero is a React Three Fiber point cloud that starts after the first paint

- Status: accepted (2026-10), amended (2026-10-26: idle start)
- Related: `src/components/scene/`, `src/components/scene/network/`, ADR-0006

## Context

The hero is the one place where the page shows what the studio does: a network of signals in space. It has to move with the pointer, follow the light and dark themes, and never get in the way of the text that sits on top of it. A 3D library costs real bytes and main-thread time, so the scene must not delay the first paint or hurt the measured performance.

## Decision

- The scene is a React Three Fiber `Canvas` with 2,800 points placed in a sphere (radius 3). Each point is linked to up to 3 near neighbors (distance up to 0.55, found with a grid so the cost stays low). The pointer pushes points away, a click starts a ripple that travels along the links, and the colors follow the theme.
- The drawing resolution goes up to a device pixel ratio of 2. WebGL lines are always 1 device pixel wide, so a lower ratio blurs them; their opacity is kept low instead of making them thicker.
- The scene is loaded with a dynamic import without server rendering, and it starts in an idle period after the first paint (the browser's idle callback with a 1 second deadline, a timer where it does not exist). The hero text is therefore painted before any three.js code runs.
- The frame loop only runs while the hero is on screen, the tab is visible and the visitor has not asked for reduced motion. Otherwise it draws on demand.
- If the scene cannot start (no WebGL), an error boundary shows a short text instead.
- All the logic (building the graph, moving the particles, spreading the signal, mixing the colors, mapping the pointer) lives in plain functions that do not import React, three or Next.js. A test enforces this. The React components only hand the results to the renderer.
- The components are tested with the React Three Fiber test renderer; the logic is tested directly.

## Consequences

- Good: the first paint does not wait for the scene; the logic can be tested and read without a renderer; reduced motion and hidden tabs cost nothing.
- Bad: three.js and React Three Fiber add about 245 KB (924 KB before compression) to the home page, and more than half of that is not used. In a headless browser without a GPU (the CI) the scene is drawn in software, so the blocking time of the home page is several seconds there; see ADR-0006 for how the budgets deal with that.

## Alternatives considered

- Plain three.js without React Three Fiber: less code to download, but the scene lifecycle, theme changes and resizing would have to be written by hand next to a React app.
- A 2D canvas or CSS: cheaper, but the depth and the rotating network are the point of the page.
- A video or a still image: the cheapest, but it removes the interaction.
- Lowering the particle count or the pixel ratio on weak devices: not done; it changes the chosen look, and the measured cost on real hardware is small.

## Revisit when

- The home page performance budgets cannot be met without changing the scene.
- A lighter renderer with the same features is available.
