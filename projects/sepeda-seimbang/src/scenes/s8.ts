import { COLORS } from "../bike";
import { leanHud, LEAN, makeLeanStage, STEER } from "../lean";
import { clamp, lerp, smoothstep } from "../stage";
import { ov } from "../overlay";

export const duration = 8.0;

type NodeHandle = {
  setRotation: (x: number, y: number, z: number) => NodeHandle;
  setPosition: (x: number, y: number, z: number) => NodeHandle;
  setScale: (scale: number | [number, number, number]) => NodeHandle;
  setVisible: (visible: boolean) => NodeHandle;
};
type AppLike = {
  nodes: { require: (id: string) => NodeHandle };
  camera?: { setPose: (p: object) => void };
};

export function build() {
  const stage = makeLeanStage({ name: "leanR", prefix: "R8" });

  function update(t: number, app: AppLike) {
    const right = smoothstep(clamp(t / 1.1));
    const straight = smoothstep(clamp((t - 3.3) / 0.7));
    const lean = -LEAN * right * (1 - straight);
    const steer = -STEER * smoothstep(clamp(t / 1.25)) * (1 - straight);
    const travel = 2.4 * Math.max(0, t - 4.0);
    stage.pose(app, lean, steer, travel);

    const push = smoothstep(clamp((t - 3.6) / 3.2));
    app.camera?.setPose({
      position: [
        lerp(2.45, 2.8, push),
        lerp(1.95, 2.15, push),
        lerp(2.95, 3.55, push),
      ],
      target: [0.06, lerp(0.7, 0.66, push), lerp(-0.15, -0.05, push)],
      fov: 40,
    });

    const p = clamp((t - 0.4) / 0.4) * clamp((7.7 - t) / 0.25);
    ov.hud(
      "left",
      leanHud((lean * 180) / Math.PI, (steer * 180) / Math.PI, "KANAN", travel > 0.05),
      p,
    );
  }

  function overlay(t: number) {
    ov.corner("MIRING KANAN", clamp((t - 0.3) / 0.4) * 0.8);
    ov.divider(0);
    ov.hud("right", "", 0);
    ov.scope([], 0);
    ov.callout("a", "", 0, 0, 0);
    ov.callout("b", "", 0, 0, 0);
    ov.callout("c", "", 0, 0, 0);

    if (t < 3.3) {
      ov.sub(
        [["Miringkan ke kanan, ban depannya akan "], ["berbelok ke kanan.", COLORS.cyan]],
        clamp((t - 0.5) / 0.3) * clamp((3.3 - t) / 0.2),
      );
    } else {
      ov.sub(
        [["Syaratnya cuma satu: "], ["tetaplah bergerak maju.", COLORS.green]],
        clamp((t - 3.3) / 0.3) * clamp((7.6 - t) / 0.25),
      );
    }
  }

  return { views: [{ selector: "#app", scene: stage.sceneB, update }], overlay, duration };
}
