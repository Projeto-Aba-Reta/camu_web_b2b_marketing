import * as THREE from "three";
import type { LeadData, ToolIcon } from "@/lib/types";

export interface Textures {
  /** logo completa (tampa da caixa) */
  logo: THREE.CanvasTexture;
  /** um quadrante da logo por bloco (face de baixo) */
  quads: THREE.CanvasTexture[];
  /** ícone gravado (face de cima) */
  icons: THREE.CanvasTexture[];
  /** encaixe tracejado na bandeja */
  ghosts: THREE.CanvasTexture[];
}

const mk = (w: number, h = w) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};

const tex = (c: HTMLCanvasElement) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

function path(ctx: CanvasRenderingContext2D, kind: ToolIcon) {
  ctx.beginPath();
  switch (kind) {
    case "sheet":
      ctx.roundRect(48, 48, 160, 160, 14);
      ctx.moveTo(101, 48); ctx.lineTo(101, 208); ctx.moveTo(155, 48); ctx.lineTo(155, 208);
      ctx.moveTo(48, 101); ctx.lineTo(208, 101); ctx.moveTo(48, 155); ctx.lineTo(208, 155);
      break;
    case "clock":
      ctx.arc(128, 128, 84, 0, Math.PI * 2);
      ctx.moveTo(128, 128); ctx.lineTo(128, 76); ctx.moveTo(128, 128); ctx.lineTo(168, 150);
      break;
    case "calendar":
      ctx.roundRect(44, 60, 168, 152, 14);
      ctx.moveTo(44, 108); ctx.lineTo(212, 108);
      ctx.moveTo(90, 40); ctx.lineTo(90, 78); ctx.moveTo(166, 40); ctx.lineTo(166, 78);
      for (const [x, y] of [[88, 142], [128, 142], [168, 142], [88, 180], [128, 180]]) {
        ctx.moveTo(x, y); ctx.lineTo(x + 0.1, y);
      }
      break;
    case "folder":
      ctx.moveTo(44, 84); ctx.lineTo(100, 84); ctx.lineTo(120, 108); ctx.lineTo(212, 108);
      ctx.lineTo(212, 204); ctx.lineTo(44, 204); ctx.closePath();
      break;
    case "chart":
      ctx.moveTo(52, 52); ctx.lineTo(52, 204); ctx.lineTo(204, 204);
      ctx.moveTo(90, 204); ctx.lineTo(90, 140); ctx.moveTo(128, 204); ctx.lineTo(128, 100);
      ctx.moveTo(166, 204); ctx.lineTo(166, 70);
      break;
    case "chat":
      ctx.roundRect(44, 56, 168, 120, 22);
      ctx.moveTo(90, 176); ctx.lineTo(90, 212); ctx.lineTo(128, 176);
      ctx.moveTo(84, 100); ctx.lineTo(172, 100); ctx.moveTo(84, 134); ctx.lineTo(140, 134);
      break;
    case "mail":
      ctx.roundRect(44, 66, 168, 124, 16);
      ctx.moveTo(48, 76); ctx.lineTo(128, 144); ctx.lineTo(208, 76);
      break;
    case "code":
      ctx.moveTo(98, 78); ctx.lineTo(48, 128); ctx.lineTo(98, 178);
      ctx.moveTo(158, 78); ctx.lineTo(208, 128); ctx.lineTo(158, 178);
      ctx.moveTo(142, 60); ctx.lineTo(114, 196);
      break;
    case "users":
      ctx.arc(128, 96, 36, 0, Math.PI * 2);
      ctx.moveTo(56, 206); ctx.quadraticCurveTo(56, 148, 128, 148); ctx.quadraticCurveTo(200, 148, 200, 206);
      break;
    case "card":
      ctx.roundRect(40, 66, 176, 124, 18);
      ctx.moveTo(40, 106); ctx.lineTo(216, 106);
      ctx.moveTo(66, 152); ctx.lineTo(112, 152);
      break;
  }
  ctx.stroke();
}

function drawIcon(ctx: CanvasRenderingContext2D, kind: ToolIcon, color: string, lw = 14) {
  ctx.lineWidth = lw;
  ctx.lineCap = ctx.lineJoin = "round";
  ctx.strokeStyle = color;
  path(ctx, kind);
}

/** Wordmark do lead (ou SVG), 512px, cruzado por um raio. */
async function drawLogo(canvas: HTMLCanvasElement, lead: LeadData, font: string) {
  const g = canvas.getContext("2d")!;
  const { cream, bolt } = lead.theme;
  g.clearRect(0, 0, 512, 512);

  if (lead.logo.svg) {
    const img = new Image();
    img.src = lead.logo.svg;
    await img.decode();
    const s = Math.min(460 / img.width, 460 / img.height);
    g.drawImage(img, 256 - (img.width * s) / 2, 256 - (img.height * s) / 2, img.width * s, img.height * s);
    return;
  }

  const two = !!lead.logo.bottom;
  g.fillStyle = cream;
  g.textAlign = "center";
  g.textBaseline = "alphabetic";
  const size = (word: string) => Math.min(230, (440 / Math.max(word.length, 1)) * 1.55);
  g.font = `800 ${size(lead.logo.top)}px ${font}`;
  g.fillText(lead.logo.top, 256, two ? 215 : 300);
  if (two) {
    g.font = `800 ${size(lead.logo.bottom)}px ${font}`;
    g.fillText(lead.logo.bottom, 256, 455);
  }

  if (lead.logo.bolt !== false) {
    g.beginPath();
    [[300, 96], [196, 276], [262, 276], [212, 420], [330, 226], [262, 226]].forEach(([x, y], i) =>
      i ? g.lineTo(x, y) : g.moveTo(x, y),
    );
    g.closePath();
    g.fillStyle = bolt;
    g.fill();
    g.lineWidth = 8;
    g.strokeStyle = "rgba(20,12,4,.55)";
    g.lineJoin = "round";
    g.stroke();
  }
}

export async function buildTextures(lead: LeadData, fontFamily: string): Promise<Textures> {
  const font = fontFamily || '"Arial Black", sans-serif';
  try {
    await Promise.race([
      document.fonts.load(`800 200px ${font}`),
      new Promise((r) => setTimeout(r, 800)),
    ]);
  } catch {}

  const big = mk(512);
  await drawLogo(big, lead, font);

  const quads = [0, 1, 2, 3].map((i) => {
    const c = mk(256);
    c.getContext("2d")!.drawImage(big, (i % 2) * 256, Math.floor(i / 2) * 256, 256, 256, 0, 0, 256, 256);
    return tex(c);
  });

  const icons = lead.tools.map((t) => {
    const c = mk(256);
    const g = c.getContext("2d")!;
    g.save(); g.translate(0, 3); drawIcon(g, t.icon, "rgba(255,255,255,.35)"); g.restore(); // brilho
    drawIcon(g, t.icon, "rgba(20,10,4,.6)");
    return tex(c);
  });

  const ghosts = lead.tools.map((t) => {
    const c = mk(256);
    const g = c.getContext("2d")!;
    g.fillStyle = t.color; g.globalAlpha = 0.2;
    g.beginPath(); g.roundRect(8, 8, 240, 240, 26); g.fill();
    g.globalAlpha = 0.9; g.setLineDash([14, 12]); g.lineWidth = 6; g.strokeStyle = t.color;
    g.beginPath(); g.roundRect(8, 8, 240, 240, 26); g.stroke();
    g.setLineDash([]); g.globalAlpha = 0.6;
    drawIcon(g, t.icon, t.color, 12);
    return tex(c);
  });

  return { logo: tex(big), quads, icons, ghosts };
}
