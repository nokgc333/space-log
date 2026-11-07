import ReactThreeTestRenderer from "@react-three/test-renderer";
import type { BufferAttribute, BufferGeometry, Object3D } from "three";
import { describe, expect, it } from "vitest";

import type { FrameLoop } from "../scene-settings";
import { NetworkCloud } from "./network-cloud";

const SECOND = 1;

const attributeOf = (instance: Object3D, name: string) =>
  geometryOf(instance).attributes[name] as BufferAttribute;
const geometryOf = (instance: Object3D) =>
  (instance as Object3D & { geometry: BufferGeometry }).geometry;

async function renderCloud(frameLoop: FrameLoop, isDark = false) {
  const eventSource = { current: document.createElement("div") };
  const renderer = await ReactThreeTestRenderer.create(
    <NetworkCloud
      isDark={isDark}
      frameLoop={frameLoop}
      eventSource={eventSource}
    />,
  );
  const group = renderer.scene.children[0];
  return { renderer, group, eventSource };
}

describe("NetworkCloud", () => {
  it("draws the particles as points and the links between them as line segments, in one group", async () => {
    const { group } = await renderCloud("always");

    expect(group.type).toBe("Group");
    expect(group.children.map((child) => child.type)).toEqual([
      "LineSegments",
      "Points",
    ]);
  });

  it("gives the points and the lines the same positions, so a link follows its particles", async () => {
    const { group } = await renderCloud("always");
    const [lines, points] = group.children;

    expect(geometryOf(lines.instance).attributes.position).toBe(
      geometryOf(points.instance).attributes.position,
    );
  });

  it("turns the whole cloud slowly while the scene is running", async () => {
    const { renderer, group } = await renderCloud("always");

    await renderer.advanceFrames(30, SECOND / 30);

    expect(group.instance.rotation.y).toBeGreaterThan(0);
  });

  it("keeps the cloud still while the scene is paused", async () => {
    const { renderer, group } = await renderCloud("demand");

    await renderer.advanceFrames(30, SECOND / 30);

    expect(group.instance.rotation.y).toBe(0);
  });

  it("tells the graphics card to take the new positions and colors every frame", async () => {
    const { renderer, group } = await renderCloud("always");
    const [lines, points] = group.children;
    const position = attributeOf(points.instance, "position");
    const color = attributeOf(points.instance, "color");
    const lineColor = attributeOf(lines.instance, "color");
    const before = [position.version, color.version, lineColor.version];

    await renderer.advanceFrames(1, SECOND / 60);

    expect([position.version, color.version, lineColor.version]).toEqual(
      before.map((version) => version + 1),
    );
  });

  it("starts with the node color of the theme that is shown", async () => {
    const light = await renderCloud("demand", false);
    const dark = await renderCloud("demand", true);
    const colorOf = ({ group }: Awaited<ReturnType<typeof renderCloud>>) =>
      geometryOf(group.children[1].instance).attributes.color.array.slice(0, 3);

    await light.renderer.advanceFrames(1, SECOND / 60);
    await dark.renderer.advanceFrames(1, SECOND / 60);

    expect(Array.from(colorOf(dark))).not.toEqual(Array.from(colorOf(light)));
  });
});
