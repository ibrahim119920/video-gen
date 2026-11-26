import "./style.css";
import { createAuraApp, looks, type AuraCameraController } from "@aura3d/engine";

const loaders = {
  "1": () => import("./scenes/s1"),
  "2": () => import("./scenes/s2"),
  "3": () => import("./scenes/s3"),
  "4": () => import("./scenes/s4"),
  "5": () => import("./scenes/s5"),
  "6": () => import("./scenes/s6"),
  "7": () => import("./scenes/s7"),
  "8": () => import("./scenes/s8"),
  "9": () => import("./scenes/s9"),
} as const;

type NodeHandle = {
  setRotation: (x: number, y: number, z: number) => unknown;
  setPosition: (x: number, y: number, z: number) => unknown;
  setScale: (scale: number | [number, number, number]) => unknown;
};

export type CaptureApp = {
  nodes: { require: (id: string) => NodeHandle };
  camera?: AuraCameraController;
};

export type CaptureView = {
  selector: string;
  scene: ReturnType<typeof import("@aura3d/engine").scene>;
  update: (t: number, app: CaptureApp) => void;
};

export type CaptureBuild = {
  views: CaptureView[];
  overlay: (t: number) => void;
  duration: number;
};

async function boot() {
  const params = new URLSearchParams(location.search);
  const id = params.get("scene") ?? "1";
  const panel = params.get("panel") ?? undefined;
  if (panel) document.body.dataset.panel = panel;
  const load = loaders[id as keyof typeof loaders] ?? loaders["1"];
  const mod = await load();
  const built = (mod.build as (panel?: string) => CaptureBuild)(panel);

  const host = document.getElementById("app")!;
  if (built.views.length > 1) {
    host.classList.add("split");
    host.innerHTML = built.views
      .map((v) => `<div id="${v.selector.replace("#", "")}" class="view"></div>`)
      .join("");
  }

  const apps: ReturnType<typeof createAuraApp>[] = [];
  for (const view of built.views) {
    const app = createAuraApp(view.selector, {
      autoStart: false,
      scene: view.scene,
      ...looks.appOptions("character-showcase"),
    });
    await app.ready();
    apps.push(app);
  }

  const renderAt = async (t: number) => {
    built.views.forEach((view, i) => view.update(t, apps[i] as CaptureApp));
    built.overlay(t);
    for (const app of apps) await app.stepAsync(1 / 30);
  };

  await renderAt(0);
  await renderAt(0);

  (window as unknown as Record<string, unknown>).__AURA_CAPTURE__ = {
    duration: built.duration,
    setTime: renderAt,
    diagnostics: () => apps.map((app) => app.diagnostics()),
  };
  document.body.dataset.ready = "1";
}

boot().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  document.body.dataset.error = message;
  console.error(error);
});
