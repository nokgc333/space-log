# ADR-0001: The hero uses React Three Fiber for the network renderer

- Status: accepted (2026-10)
- Related: `src/components/scene/`, `src/components/scene/network/`

## Context

The hero shows a network of signals in space. The network has to move with the pointer and follow the light and dark themes. The regular page and the pure network calculations are in place before the renderer adds its dependencies.

## Decision

- Use React Three Fiber to render the network as points and line segments in one group.
- Place 2,800 points in a sphere with radius 3. Link each point to up to 3 near neighbors within distance 0.55.
- Share the position attribute between points and links so the links follow the particles.
- Keep graph construction, particle motion, signal propagation, color mixing and pointer mapping in plain functions without React, three or Next.js imports.
- Let the React component pass those results to the renderer and update the graphics buffers each frame.
- Use the React Three Fiber test renderer for geometry, frame updates and theme colors. Test the calculations directly.

## Consequences

- Good: the network calculations can be read and tested without a renderer; the scene uses the existing React lifecycle.
- Bad: three.js and React Three Fiber add dependencies and rendering cost to the page.

## Alternatives considered

- Plain three.js: less integration code to download, but lifecycle and theme changes would need a separate implementation.
- A 2D canvas or CSS: cheaper, but it would change the depth and rotating network.
- A still image: cheaper, but it would remove pointer interaction.

## Revisit when

- A lighter renderer can provide the same interaction.
