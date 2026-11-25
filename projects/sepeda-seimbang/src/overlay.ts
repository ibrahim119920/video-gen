const $ = (id: string) => document.getElementById(id) as HTMLElement;

function set(id: string, text: string, p: number, color?: string) {
  const el = $(id);
  if (el.textContent !== text) el.textContent = text;
  if (color) el.style.color = color;
  el.style.opacity = String(p);
}

export const ov = {
  reset() {
    for (const id of ["tag-left", "tag-right", "title", "sub", "hud-left", "hud-right", "callout-a", "callout-b", "callout-c"]) {
      const el = $(id);
      el.style.opacity = "0";
      el.textContent = "";
    }
    $("wipe").style.opacity = "0";
    $("fade").style.opacity = "0";
    $("divider").style.opacity = "0";
    $("scope").style.opacity = "0";
  },

  tag(side: "left" | "right", text: string, color: string, p = 1) {
    set(`tag-${side}`, text, p, color);
  },

  corner(text: string, p = 1) {
    set("corner", text, p);
  },

  title(text: string, p = 1, { color = "#F2F6FF", size = 64, y = 0 } = {}) {
    const el = $("title");
    set("title", text, p, color);
    el.style.fontSize = `${size}px`;
    el.style.transform = `translateY(${(1 - p) * 18 + y}px)`;
  },

  sub(parts: readonly (readonly [string, string?])[], p = 1) {
    const el = $("sub");
    const html = parts
      .map(([text, color]) => (color ? `<span style="color:${color}">${text}</span>` : text))
      .join("");
    if (el.innerHTML !== html) el.innerHTML = html;
    el.style.opacity = String(p);
    el.style.transform = `translate(-50%, ${(1 - p) * 12}px)`;
  },

  hud(side: "left" | "right", html: string, p = 1) {
    const el = $(`hud-${side}`);
    if (el.innerHTML !== html) el.innerHTML = html;
    el.style.opacity = String(p);
  },

  speedo(value: number, p = 1, stable = true) {
    const v = Math.max(0, Math.min(8, value));
    const pct = (v / 8) * 100;
    const html =
      `<div class="speedo"><div class="speedo-track"><div class="speedo-zone"></div>` +
      `<div class="speedo-needle" style="left:${pct.toFixed(2)}%"></div></div>` +
      `<div class="speedo-read"><span>${v.toFixed(1)}</span> m/s ` +
      `<em style="color:${stable ? "#4ADE80" : "#FF4D5E"}">${stable ? "stabil" : "melambat"}</em></div></div>`;
    const el = $("hud-right");
    if (el.innerHTML !== html) el.innerHTML = html;
    el.style.opacity = String(p);
  },

  scope(points: readonly number[], p = 1, color = "#FF4D5E", label = "SUDUT MIRING") {
    const canvas = $("scope") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(5,12,22,0.72)";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(120,160,200,0.22)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
    ctx.beginPath();
    ctx.moveTo(8, h / 2);
    ctx.lineTo(w - 8, h / 2);
    ctx.strokeStyle = "rgba(120,160,200,0.28)";
    ctx.stroke();
    for (let i = 1; i < 6; i += 1) {
      const x = 8 + ((w - 16) * i) / 6;
      ctx.beginPath();
      ctx.moveTo(x, 10);
      ctx.lineTo(x, h - 10);
      ctx.strokeStyle = "rgba(120,160,200,0.12)";
      ctx.stroke();
    }
    if (points.length > 1) {
      ctx.beginPath();
      for (let i = 0; i < points.length; i += 1) {
        const x = 8 + ((w - 16) * i) / (points.length - 1);
        const y = h / 2 - Math.max(-1, Math.min(1, points[i]!)) * (h * 0.38);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = "rgba(190,215,235,0.65)";
    ctx.font = "600 12px Segoe UI, Arial, sans-serif";
    ctx.fillText(label, 12, 20);
    canvas.style.opacity = String(p);
  },

  callout(id: "a" | "b" | "c", text: string, p = 1, x = 0, y = 0, color?: string) {
    const el = $(`callout-${id}`);
    if (el.textContent !== text) el.textContent = text;
    el.style.opacity = String(p);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    if (color) {
      el.style.borderColor = color;
      el.style.color = color;
    }
  },

  divider(p = 1) {
    $("divider").style.opacity = String(p);
  },

  wipe(p: number, color = "#35D0E8") {
    const el = $("wipe");
    el.style.background = color;
    el.style.opacity = p > 0.002 ? "1" : "0";
    el.style.clipPath = `inset(0 0 0 ${(1 - Math.max(0, Math.min(1, p))) * 100}%)`;
  },

  fade(p: number, color = "#000000") {
    const el = $("fade");
    el.style.background = color;
    el.style.opacity = String(Math.max(0, Math.min(1, p)));
  },
};
