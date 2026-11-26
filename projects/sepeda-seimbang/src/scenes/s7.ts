import { COLORS } from "../bike";
import { leanHud, LEAN, makeLeanStage, STEER } from "../lean";
import { clamp, lerp, rad, smoothstep } from "../stage";
import { ov } from "../overlay";

export const duration = 6.0;

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
  const stage = makeLeanStage({ name: "leanL", prefix: "L7" });

  function update(t: number, app: AppLike) {
    const leanEnv = smoothstep(clamp((t - 1.3) / 1.5));
    let lean = LEAN * leanEnv;
    let steer = STEER * smoothstep(clamp((t - 1.55) / 1.6));
    if (t > 2.9) {
      const d = t - 2.9;
      lean += rad(0.6) * Math.exp(-4.0 * d) * Math.sin(11 * d);
      steer += rad(0.4) * Math.exp(-4.0 * d) * Math.sin(11 * d);
    }
    stage.pose(app, lean, steer, 0);

    const push = smoothstep(clamp(t / 4.2));
    app.camera?.setPose({
      position: [lerp(2.45, 2.15, push), lerp(1.95, 1.82, push), lerp(2.95, 2.6, push)],
      target: [0.05, 0.68, -0.18],
      fov: 40,
    });

    const p = clamp((t - 0.4) / 0.4) * clamp((5.8 - t) / 0.3);
    ov.hud("left", leanHud((lean * 180) / Math.PI, (steer * 180) / Math.PI, "KIRI"), p);
  }

  function overlay(t: number) {
    ov.corner("MIRING KIRI", clamp((t - 0.3) / 0.4) * 0.8);
    ov.divider(0);
    ov.hud("right", "", 0);
    ov.scope([], 0);
    ov.callout("a", "", 0, 0, 0);
    ov.callout("b", "", 0, 0, 0);
    ov.callout("c", "", 0, 0, 0);

    if (t < 3.2) {
      ov.sub(
        [["Kamu pegang sadelnya lalu "], ["miringkan sepeda ke kiri,", COLORS.yellow]],
        clamp((t - 0.6) / 0.3) * clamp((3.2 - t) / 0.2),
      );
    } else {
      ov.sub(
        [["ban depannya juga akan "], ["berbelok ke kiri.", COLORS.cyan]],
        clamp((t - 3.2) / 0.3) * clamp((5.7 - t) / 0.25),
      );
    }
  }

  return { views: [{ selector: "#app", scene: stage.sceneB, update }], overlay, duration };
}
