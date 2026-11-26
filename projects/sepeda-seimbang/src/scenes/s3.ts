import { COLORS } from "../bike";
import { clamp } from "../stage";
import { ov } from "../overlay";
import { buildMyth } from "./s2";

export const duration = 4.0;

const OFFSET = 6.0;

type NodeHandle = {
  setRotation: (x: number, y: number, z: number) => NodeHandle;
  setPosition: (x: number, y: number, z: number) => NodeHandle;
  setScale: (scale: number | [number, number, number]) => NodeHandle;
  setVisible: (visible: boolean) => NodeHandle;
};
type AppLike = { nodes: { require: (id: string) => NodeHandle }; camera?: { setPose: (p: object) => void } };

export function build() {
  const base = buildMyth();
  const mythView = base.views[0]!;

  function update(t: number, app: AppLike) {
    // Continue the myth shot exactly where S2 stopped: the counter-wheel is
    // nearly in, the arrows are about to collapse.
    mythView.update(t + OFFSET, app);
  }

  function overlay(t: number) {
    ov.corner("MITOS GIROSKOP", clamp((t - 0.2) / 0.4) * 0.8);
    ov.divider(0);
    ov.hud("left", "", 0);
    ov.hud("right", "", 0);
    ov.scope([], 0);
    ov.callout("b", "", 0, 0, 0);

    ov.sub(
      [["Namun "], ["bukan itu jawabannya", COLORS.amber]],
      clamp((t - 0.4) / 0.3) * clamp((3.7 - t) / 0.25),
    );

    const net = clamp((t - 1.5) / 0.4) * clamp((3.6 - t) / 0.3);
    ov.callout("a", "Net L ≈ 0", net, 60, 1440);
    const chk = clamp((t - 2.1) / 0.4) * clamp((3.6 - t) / 0.3);
    ov.callout("c", "✓  tetap seimbang", chk, 60, 1540);
  }

  return {
    views: [{ selector: mythView.selector, scene: mythView.scene, update }],
    overlay,
    duration,
  };
}
