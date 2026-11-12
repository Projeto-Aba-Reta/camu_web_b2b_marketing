"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Line, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import type { LeadData, Stage } from "@/lib/types";
import { Lights, Rig, FOV, type SceneProps } from "./Scene";
import { buildTextures, type Textures } from "./textures";

/**
 * Modelo "Roda": caixa redonda → 4 setores soltos → encaixam num disco → a tampa central trava tudo.
 * Mesmo contrato do Scene de blocos (stage, placed, onPlaced…), com geometria própria.
 */

const W = new THREE.Vector3(0, 0, -1.2); // centro da roda
const R = 1.1; // raio dos setores
const H = 0.22; // espessura do setor
const BASE_Y = 0.08; // topo do disco
const BETA = Math.PI / 4 - 0.045; // meio-ângulo (deixa uma fresta entre os setores)
const CEN = (2 * R * Math.sin(BETA)) / (3 * BETA); // centroide do setor (o setor gira em torno dele)
const TOP = BASE_Y + H + 0.04; // face de cima do setor encaixado
const CAP_Y = TOP + 0.07;
const CAP_R = 0.52;
// direção de cada setor (rotação em y): Atração ao norte, Distribuição a oeste, Vendas ao sul, Retenção a leste
const PHI = [Math.PI / 2, Math.PI, -Math.PI / 2, 0];
const slotOf = (i: number) => new THREE.Vector3(W.x + CEN * Math.cos(PHI[i]), BASE_Y, W.z - CEN * Math.sin(PHI[i]));
const SLOTS = [0, 1, 2, 3].map(slotOf);
// repouso: setores deitados com a ponta para a roda, em duas fileiras na frente dela
const REST: [number, number][] = [[-0.95, 1.95], [0.95, 1.95], [-0.95, 3.1], [0.95, 3.1]];
const REST_RY = [Math.PI / 2 + 0.08, Math.PI / 2 - 0.08, Math.PI / 2 - 0.06, Math.PI / 2 + 0.06];
const { damp, clamp } = THREE.MathUtils;
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/* ---------- colisão entre setores soltos ---------- */
const HX = 0.82, HZ = 0.55; // meia-largura/profundidade do setor solto (ry ≈ π/2)
const WHEEL_KEEP = R + 0.12 + 0.7; // setor solto não fica sobre a roda
interface BState { to: THREE.Vector3; placed: boolean; dragging: boolean }
const rank = (b: BState) => (b.dragging ? 2 : 1);

/** Empurra para fora da roda e separa os setores soltos; encaixados ficam de fora. */
function settle(reg: (BState | null)[]) {
  const bs = (reg.filter(Boolean) as BState[]).filter((b) => !b.placed);
  for (let it = 0; it < 8; it++) {
    for (const a of bs) {
      if (a.dragging) continue;
      const dx = a.to.x - W.x, dz = a.to.z - W.z;
      const d = Math.hypot(dx, dz);
      if (d < WHEEL_KEEP) {
        const ux = d > 1e-3 ? dx / d : 0, uz = d > 1e-3 ? dz / d : 1;
        a.to.x = W.x + ux * WHEEL_KEEP;
        a.to.z = W.z + uz * WHEEL_KEEP;
      }
    }
    for (let m = 0; m < bs.length; m++) {
      for (let n = m + 1; n < bs.length; n++) {
        const a = bs[m], b = bs[n];
        const dx = b.to.x - a.to.x, dz = b.to.z - a.to.z;
        const px = 2 * HX - Math.abs(dx), pz = 2 * HZ - Math.abs(dz);
        if (px <= 0 || pz <= 0) continue;
        const onX = px < pz;
        const amt = onX ? px : pz;
        const sgn = Math.sign(onX ? dx : dz) || 1;
        const ra = rank(a), rb = rank(b);
        const wa = ra < rb ? 1 : ra === rb ? 0.5 : 0;
        const wb = rb < ra ? 1 : ra === rb ? 0.5 : 0;
        if (onX) { a.to.x -= sgn * amt * wa; b.to.x += sgn * amt * wb; }
        else { a.to.z -= sgn * amt * wa; b.to.z += sgn * amt * wb; }
      }
    }
    for (const a of bs) {
      if (a.dragging) continue;
      a.to.x = clamp(a.to.x, -2.3, 2.3);
      a.to.z = clamp(a.to.z, -3, 4.2);
    }
  }
}

/* ---------- texturas ---------- */
function labelTex(text: string, font: string) {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 160;
  const g = c.getContext("2d")!;
  const t = text.toUpperCase();
  g.textAlign = "center"; g.textBaseline = "middle";
  let size = 112;
  g.font = `800 ${size}px ${font}`;
  const w = g.measureText(t).width;
  if (w > 470) { size = Math.floor((size * 470) / w); g.font = `800 ${size}px ${font}`; }
  g.fillStyle = "rgba(255,255,255,.28)"; g.fillText(t, 256, 86); // brilho (gravado)
  g.fillStyle = "rgba(30,14,6,.62)"; g.fillText(t, 256, 82);
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8;
  return tx;
}

function centerTex(text: string, font: string, ink: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  const t = text.toUpperCase();
  g.textAlign = "center"; g.textBaseline = "middle";
  let size = 120;
  g.font = `800 ${size}px ${font}`;
  const w = g.measureText(t).width;
  if (w > 380) { size = Math.floor((size * 380) / w); g.font = `800 ${size}px ${font}`; }
  g.fillStyle = "rgba(255,255,255,.6)"; g.fillText(t, 256, 262);
  g.fillStyle = ink; g.fillText(t, 256, 256);
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8;
  return tx;
}

/* ---------- geometrias ---------- */
function makeGeometry() {
  const sh = new THREE.Shape();
  sh.moveTo(0, 0);
  sh.absarc(0, 0, R, -BETA, BETA, false);
  sh.lineTo(0, 0);
  const body = new THREE.ExtrudeGeometry(sh, { depth: H, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 3, curveSegments: 40 });
  body.translate(-CEN, 0, 0.02);
  body.rotateX(-Math.PI / 2); // extrusão vira altura; o setor aponta para +x
  const flat = new THREE.ShapeGeometry(sh, 40);
  flat.translate(-CEN, 0, 0);
  flat.rotateX(-Math.PI / 2);
  const pts = sh.getPoints(40).map((v) => new THREE.Vector3(v.x - CEN, 0.004, -v.y));
  pts.push(pts[0].clone());

  const rim = new THREE.Shape();
  rim.absarc(0, 0, R + 0.24, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, R + 0.13, 0, Math.PI * 2, true);
  rim.holes.push(hole);
  const ring = new THREE.ExtrudeGeometry(rim, { depth: 0.16, bevelEnabled: false, curveSegments: 64 });
  ring.rotateX(-Math.PI / 2);
  return { body, flat, pts, ring };
}
type Geo = ReturnType<typeof makeGeometry>;

/* ---------- cena ---------- */
export interface WheelProps extends SceneProps { center: string }

export default function WheelScene(props: WheelProps) {
  const [tex, setTex] = useState<Textures | null>(null);
  useEffect(() => {
    let off = false;
    buildTextures(props.lead, props.fontFamily).then((t) => !off && setTex(t));
    return () => { off = true; };
  }, [props.lead, props.fontFamily]);

  return (
    <Canvas
      shadows="soft"
      dpr={[1, 2]}
      camera={{ fov: FOV, near: 0.1, far: 100, position: [0, 8, 6] }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0, touchAction: "none" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.9;
      }}
    >
      <Lights lead={props.lead} />
      {tex && <World {...props} tex={tex} />}
    </Canvas>
  );
}

function World(p: WheelProps & { tex: Textures }) {
  const pulse = useRef([0, 0, 0, 0]);
  const reg = useRef<(BState | null)[]>([null, null, null, null]);
  const geo = useMemo(makeGeometry, []);
  const font = p.fontFamily || '"Arial Black", sans-serif';
  const labels = useMemo(() => p.lead.tools.map((t) => labelTex(t.label, font)), [p.lead.tools, font]);
  const capTex = useMemo(() => centerTex(p.center, font, "rgba(60,32,16,.78)"), [p.center, font]);

  return (
    <>
      <Rig stage={p.stage} side={p.side} inset={p.inset} />
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <shadowMaterial transparent opacity={0.5} />
      </mesh>
      <Base lead={p.lead} geo={geo} placed={p.placed} pulse={pulse} />
      {p.lead.tools.map((t, i) => (
        <Sector key={i} i={i} color={t.color} geo={geo} label={labels[i]} stage={p.stage} pulse={pulse} reg={reg}
          onPlaced={p.onPlaced} onWrong={p.onWrong} onHover={p.onHover} />
      ))}
      <Cap stage={p.stage} tex={capTex} color={p.lead.theme.cream} />
      <RoundBox lead={p.lead} tex={p.tex} stage={p.stage} onOpen={p.onOpen} onReady={p.onReady} />
      {p.stage === "done" && (
        <Sparkles count={50} scale={[3.2, 1.6, 3.2]} position={[W.x, 0.9, W.z]} size={3.2} speed={0.45}
          color={p.lead.theme.bolt} opacity={0.9} />
      )}
    </>
  );
}

/* ---------- caixa redonda ---------- */
function RoundBox(p: { lead: LeadData; tex: Textures; stage: Stage; onOpen: () => void; onReady: () => void }) {
  const group = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Mesh>(null!);
  const lid = useRef<THREE.Group>(null!);
  const lidMat = useRef<THREE.MeshPhysicalMaterial>(null!);
  const logoMat = useRef<THREE.MeshStandardMaterial>(null!);
  const t0 = useRef<number | null>(null);
  const ready = useRef(false);
  const { theme } = p.lead;

  useEffect(() => {
    if (p.stage === "play" || p.stage === "done") { t0.current = -1000; ready.current = true; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const t = state.clock.elapsedTime;
    if (p.stage === "closed") {
      group.current.rotation.y = Math.sin(t * 0.6) * 0.18;
      lid.current.position.y = 1.275 + Math.sin(t * 1.6) * 0.025;
      return;
    }
    if (t0.current === null) t0.current = t;
    group.current.rotation.y = damp(group.current.rotation.y, 0, 6, dt);
    const e = t - t0.current;

    const lp = ease(clamp(e / 0.9, 0, 1));
    lid.current.position.set(0, 1.275 + 1.5 * lp, -1.3 * lp);
    lid.current.rotation.x = -0.5 * lp;
    lidMat.current.opacity = 1 - lp;
    logoMat.current.opacity = 1 - lp;
    lid.current.visible = lp < 1;

    const sp = ease(clamp((e - 1.2) / 0.7, 0, 1));
    body.current.position.y = 0.55 - 1.6 * sp;
    if (sp >= 1) {
      body.current.visible = false;
      if (!ready.current && e >= 2.5) { ready.current = true; p.onReady(); }
    }
  });

  const click = (e: ThreeEvent<MouseEvent>) => {
    if (p.stage !== "closed") return;
    e.stopPropagation();
    p.onOpen();
  };
  const over = () => { if (p.stage === "closed") document.body.style.cursor = "pointer"; };
  const out = () => { document.body.style.cursor = ""; };

  return (
    <group ref={group} position={W} onClick={click} onPointerOver={over} onPointerOut={out}>
      <mesh ref={body} position-y={0.55} castShadow receiveShadow>
        <cylinderGeometry args={[1.42, 1.42, 1.1, 72]} />
        <meshPhysicalMaterial color={theme.box} roughness={0.85} sheen={0.6} sheenColor="#f2d3a4" />
      </mesh>
      <group ref={lid} position-y={1.275}>
        <mesh castShadow>
          <cylinderGeometry args={[1.52, 1.52, 0.35, 72]} />
          <meshPhysicalMaterial ref={lidMat} color={theme.lid} roughness={0.8} sheen={0.6} sheenColor="#f2d3a4" transparent />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={0.178}>
          <planeGeometry args={[2.1, 2.1]} />
          <meshStandardMaterial ref={logoMat} map={p.tex.logo} transparent roughness={0.7}
            polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
        </mesh>
      </group>
    </group>
  );
}

/* ---------- disco-base com os 4 encaixes ---------- */
function Base(p: { lead: LeadData; geo: Geo; placed: boolean[]; pulse: React.MutableRefObject<number[]> }) {
  const ghosts = useRef<(THREE.Mesh | null)[]>([]);
  const color = p.lead.theme.cream;

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    ghosts.current.forEach((g, i) => {
      if (!g) return;
      const v = (p.pulse.current[i] *= Math.exp(-dt * 2.2));
      g.scale.setScalar(1 + 0.05 * Math.sin(v * 9) * v);
      (g.material as THREE.MeshBasicMaterial).opacity = 0.32 + 0.3 * v;
    });
  });

  return (
    <group position={W}>
      <mesh position-y={BASE_Y / 2} castShadow receiveShadow>
        <cylinderGeometry args={[R + 0.24, R + 0.24, BASE_Y, 72]} />
        <meshPhysicalMaterial color={color} roughness={0.55} clearcoat={0.25} clearcoatRoughness={0.4} />
      </mesh>
      <mesh geometry={p.geo.ring} castShadow receiveShadow>
        <meshPhysicalMaterial color={color} roughness={0.55} clearcoat={0.25} clearcoatRoughness={0.4} />
      </mesh>
      {p.lead.tools.map((t, i) => {
        const s = slotOf(i);
        return (
          <group key={i} position={[s.x - W.x, 0, s.z - W.z]} rotation-y={PHI[i]} visible={!p.placed[i]}>
            <mesh ref={(m) => { ghosts.current[i] = m; }} geometry={p.geo.flat} position-y={BASE_Y + 0.004}>
              <meshBasicMaterial color={t.color} transparent opacity={0.32} depthWrite={false} />
            </mesh>
            <group position-y={BASE_Y + 0.006}>
              <Line points={p.geo.pts} color={t.color} lineWidth={2} dashed dashSize={0.1} gapSize={0.07} />
            </group>
          </group>
        );
      })}
    </group>
  );
}

/* ---------- tampa central: trava tudo ---------- */
function Cap(p: { stage: Stage; tex: THREE.CanvasTexture; color: string }) {
  const g = useRef<THREE.Group>(null!);
  const mat = useRef<THREE.MeshPhysicalMaterial>(null!);
  const y = useRef(CAP_Y + 2.4);
  const at = useRef(0);

  useEffect(() => {
    if (p.stage === "done") at.current = performance.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.stage]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const on = p.stage === "done";
    g.current.visible = on;
    if (!on) { y.current = CAP_Y + 2.4; return; }
    const e = (performance.now() - at.current) / 1000;
    if (e < 0.7) return; // espera os setores terminarem de encaixar
    y.current = damp(y.current, CAP_Y, 9, dt);
    g.current.position.y = y.current;
    const k = 1 - clamp((y.current - CAP_Y) / 2.4, 0, 1);
    mat.current.emissiveIntensity = 0.35 * Math.exp(-(e - 0.7) * 2.4) * k;
  });

  return (
    <group ref={g} position={[W.x, CAP_Y + 2.4, W.z]} visible={false}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[CAP_R, CAP_R, 0.14, 64]} />
        <meshPhysicalMaterial ref={mat} color={p.color} roughness={0.5} clearcoat={0.3} clearcoatRoughness={0.4}
          emissive="#ffe7b8" emissiveIntensity={0} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.072}>
        <planeGeometry args={[CAP_R * 1.8, CAP_R * 1.8]} />
        <meshStandardMaterial map={p.tex} transparent roughness={0.6}
          polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
      </mesh>
    </group>
  );
}

/* ---------- setor arrastável ---------- */
function Sector(p: {
  i: number; color: string; geo: Geo; label: THREE.CanvasTexture; stage: Stage;
  pulse: React.MutableRefObject<number[]>; reg: React.MutableRefObject<(BState | null)[]>;
  onPlaced: (i: number) => void; onWrong: () => void; onHover?: (i: number | null) => void;
}) {
  const { i } = p;
  const root = useRef<THREE.Group>(null!);
  const mat = useRef<THREE.MeshPhysicalMaterial>(null!);
  const { camera, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const offscreen = useMemo(() => new THREE.Vector3(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.45), []);
  const rest = useMemo(() => ({ pos: new THREE.Vector3(W.x + REST[i][0], 0.02, W.z + REST[i][1]), ry: REST_RY[i] }), [i]);
  const st = useRef({
    to: new THREE.Vector3(W.x, 0.7, W.z),
    ry: 0, ryTo: 0, tilt: 0, placed: false, dragging: false, doneAt: -1,
  });

  useEffect(() => {
    const s = st.current;
    if (p.stage === "play" || p.stage === "done") {
      const done = p.stage === "done";
      s.to.copy(done ? SLOTS[i] : rest.pos);
      s.ry = s.ryTo = done ? PHI[i] : rest.ry;
      s.placed = done;
      root.current.visible = true;
    } else {
      root.current.visible = false;
    }
    root.current.position.copy(s.to);
    root.current.rotation.y = s.ry;
    p.reg.current[i] = s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const s = st.current;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));
    if (p.stage === "opening") {
      // a tampa sai; os setores sobem da caixa e flutuam; a caixa afunda; só então descem até a mesa
      later(() => {
        root.current.visible = true;
        s.to.set(W.x + CEN * Math.cos(PHI[i]) * 0.5, 2.1, W.z - CEN * Math.sin(PHI[i]) * 0.5);
        s.ryTo = PHI[i];
      }, 850 + i * 100);
      later(() => { s.to.copy(rest.pos); s.ryTo = rest.ry; }, 1850 + i * 100);
    }
    if (p.stage === "done") {
      s.doneAt = performance.now() / 1000;
      later(() => { s.to.y = SLOTS[i].y + 0.3; }, i * 90);
      later(() => { s.to.y = SLOTS[i].y; }, i * 90 + 220);
    }
    return () => timers.forEach(clearTimeout);
  }, [p.stage, i, rest]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05), s = st.current, g = root.current;
    const k = s.dragging ? 30 : 13;
    g.position.x = damp(g.position.x, s.to.x, k, dt);
    g.position.y = damp(g.position.y, s.to.y, k, dt);
    g.position.z = damp(g.position.z, s.to.z, k, dt);
    s.ry = damp(s.ry, s.ryTo, 13, dt); g.rotation.y = s.ry;
    s.tilt = damp(s.tilt, s.dragging ? -0.18 : 0, 10, dt); g.rotation.x = s.tilt;

    // empurrado para fora da tela: volta para o repouso
    if (p.stage === "play" && !s.placed && !s.dragging) {
      offscreen.copy(s.to).project(camera);
      if (Math.abs(offscreen.x) > 0.92 || Math.abs(offscreen.y) > 0.92) {
        s.to.set(rest.pos.x, rest.pos.y, rest.pos.z);
        s.ryTo = rest.ry;
        settle(p.reg.current);
      }
    }
    if (s.doneAt > 0) {
      const e = performance.now() / 1000 - s.doneAt;
      mat.current.emissiveIntensity = 0.55 * Math.exp(-e * 2.2);
    }
  });

  const pointAt = (ev: { clientX: number; clientY: number }) => {
    const r = gl.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const out = new THREE.Vector3();
    return raycaster.ray.intersectPlane(plane, out) ? out : null;
  };
  const d2 = (a: THREE.Vector3, b: THREE.Vector3) => Math.hypot(a.x - b.x, a.z - b.z);

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    const s = st.current;
    if (p.stage !== "play" || s.placed) return;
    e.stopPropagation();
    const p0 = pointAt(e.nativeEvent);
    const off = p0 ? new THREE.Vector3(root.current.position.x - p0.x, 0, root.current.position.z - p0.z) : new THREE.Vector3();
    const sx = e.nativeEvent.clientX, sy = e.nativeEvent.clientY;
    let moved = false;
    s.dragging = true;

    const move = (ev: PointerEvent) => {
      if (Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) { moved = true; p.onHover?.(null); }
      if (!moved) return;
      const q = pointAt(ev);
      if (!q) return;
      s.to.set(clamp(q.x + off.x, -2.3, 2.3), 0.45, clamp(q.z + off.z, -3, 4.2));
      s.ryTo = PHI[i]; // durante o arraste o setor já aponta para o lugar dele
      settle(p.reg.current);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("pointerup", up);
      s.dragging = false;
      document.body.style.cursor = "";
      if (!moved) { p.pulse.current[i] = 1; s.to.y = rest.pos.y; s.ryTo = rest.ry; return; }
      if (d2(s.to, SLOTS[i]) < 0.75) {
        s.placed = true; s.to.copy(SLOTS[i]); s.ryTo = PHI[i];
        p.onPlaced(i);
      } else if (d2(s.to, W) < WHEEL_KEEP) {
        // soltou sobre a roda, fora do encaixe certo: não pode ficar em cima dos outros setores
        if (SLOTS.some((sl, k) => k !== i && d2(s.to, sl) < 0.8)) p.onWrong();
        p.pulse.current[i] = 1;
        s.to.copy(rest.pos); s.ryTo = rest.ry;
      } else {
        s.to.y = rest.pos.y; s.ryTo = rest.ry;
      }
      settle(p.reg.current);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
    window.addEventListener("pointercancel", up, { once: true });
    document.body.style.cursor = "grabbing";
  };

  const over = () => {
    if (p.stage === "play" && !st.current.placed) document.body.style.cursor = "grab";
    if ((p.stage === "play" || p.stage === "done") && !st.current.dragging) p.onHover?.(i);
  };
  const out = () => {
    if (!st.current.dragging) document.body.style.cursor = "";
    p.onHover?.(null);
  };

  return (
    <group ref={root} onPointerDown={onDown} onPointerOver={over} onPointerOut={out}>
      <mesh geometry={p.geo.body} castShadow receiveShadow>
        <meshPhysicalMaterial ref={mat} color={p.color} roughness={0.38} clearcoat={0.7} clearcoatRoughness={0.25}
          emissive={p.color} emissiveIntensity={0} />
      </mesh>
      {/* nome do pilar gravado na face de cima, ao longo do arco */}
      <mesh rotation={[-Math.PI / 2, 0, -Math.PI / 2]} position={[0.85 - CEN, TOP + 0.003, 0]}>
        <planeGeometry args={[1.1, 0.34]} />
        <meshStandardMaterial map={p.label} transparent roughness={0.6}
          polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
      </mesh>
    </group>
  );
}
