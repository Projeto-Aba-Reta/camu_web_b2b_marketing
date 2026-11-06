"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import type { LeadData, Stage } from "@/lib/types";
import { buildTextures, type Textures } from "./textures";

/* ---------- geometria compartilhada (1 unidade = 1 bloco) ---------- */
const TRAY = new THREE.Vector3(0, 0, -1.2);
const S = 0.56; // centro dos encaixes
const OFFS: [number, number][] = [[-S, -S], [S, -S], [-S, S], [S, S]];
const SLOTS = OFFS.map(([x, z]) => new THREE.Vector3(TRAY.x + x, 0.21, TRAY.z + z));
// posições de repouso: sempre fora da bandeja (|dz| ≥ 1.66) e sem se sobrepor
const SCATTER: [number, number, number][] = [[-0.8, 1.8, 0.4], [0.85, 1.75, -0.3], [-0.7, 3.0, -0.5], [0.8, 2.95, 0.35]];
const PITCH = THREE.MathUtils.degToRad(58);
const FOV = 34;
const { damp, clamp } = THREE.MathUtils;
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/* ---------- colisão (blocos são quadrados de ~1 un; a bandeja é um obstáculo) ---------- */
const SIZE = 1.04; // lado do bloco + folguinha
const TRAY_R = 1.16 + 0.5; // meia-largura da bandeja + meio bloco
interface BState { to: THREE.Vector3; placed: boolean; dragging: boolean }
/** 3 = encaixado (imóvel), 2 = sendo arrastado, 1 = solto na mesa. Quem tem rank menor cede. */
const rank = (b: BState) => (b.placed ? 3 : b.dragging ? 2 : 1);

/** Separa blocos sobrepostos: o arrastado empurra os soltos; encaixados e bandeja não cedem. */
function settle(reg: (BState | null)[]) {
  const bs = reg.filter(Boolean) as BState[];
  for (let it = 0; it < 8; it++) {
    for (const a of bs) {
      if (a.placed || a.dragging) continue;
      const dx = a.to.x - TRAY.x, dz = a.to.z - TRAY.z;
      const px = TRAY_R - Math.abs(dx), pz = TRAY_R - Math.abs(dz);
      if (px > 0 && pz > 0) {
        if (px < pz) a.to.x += (Math.sign(dx) || 1) * px;
        else a.to.z += (Math.sign(dz) || 1) * pz;
      }
    }
    for (let m = 0; m < bs.length; m++) {
      for (let n = m + 1; n < bs.length; n++) {
        const a = bs[m], b = bs[n];
        const dx = b.to.x - a.to.x, dz = b.to.z - a.to.z;
        const px = SIZE - Math.abs(dx), pz = SIZE - Math.abs(dz);
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
      if (a.placed || a.dragging) continue;
      a.to.x = clamp(a.to.x, -2.1, 2.1);
      a.to.z = clamp(a.to.z, -3, 4);
    }
  }
}

export interface SceneProps {
  lead: LeadData;
  stage: Stage;
  fontFamily: string;
  placed: boolean[];
  onOpen: () => void;
  onReady: () => void;
  onPlaced: (i: number) => void;
  onWrong: () => void;
  onHover?: (i: number | null) => void;
  /** telas largas: texto num painel à direita, peça à esquerda */
  side: boolean;
  /** celular: altura (px) ocupada pelo texto no topo; a cena desce para ficar abaixo dele */
  inset: number;
}

export default function Scene(props: SceneProps) {
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

/* ---------- luz e reflexos premium (sem HDR externo) ---------- */
function Lights({ lead }: { lead: LeadData }) {
  const { accent } = lead.theme;
  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight
        position={[-3, 8, 5]} intensity={1.5} castShadow
        shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.02}
        shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6}
        shadow-camera-near={1} shadow-camera-far={24}
      />
      <pointLight position={[3, 3, -6]} intensity={40} color={accent} distance={20} />
      <Environment resolution={256} frames={1} environmentIntensity={0.5}>
        <Lightformer form="rect" intensity={5} position={[-4, 6, 2]} scale={[9, 4, 1]} rotation-x={Math.PI / 3} />
        <Lightformer form="rect" intensity={2.5} position={[6, 2, -3]} scale={[6, 3, 1]} color={accent} rotation-y={-Math.PI / 3} />
        <Lightformer form="ring" intensity={2} position={[0, 4, -6]} scale={5} color="#ffffff" />
        <Lightformer form="rect" intensity={1.2} position={[0, 1, 7]} scale={[10, 2, 1]} color="#ffe7c2" />
      </Environment>
    </>
  );
}

/* ---------- mundo ---------- */
function World(p: SceneProps & { tex: Textures }) {
  const pulse = useRef([0, 0, 0, 0]);
  const reg = useRef<(BState | null)[]>([null, null, null, null]);
  return (
    <>
      <Rig stage={p.stage} side={p.side} inset={p.inset} />
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <shadowMaterial transparent opacity={0.5} />
      </mesh>
      <Tray tex={p.tex} lead={p.lead} placed={p.placed} pulse={pulse} />
      {p.lead.tools.map((t, i) => (
        <Block key={i} i={i} color={t.color} tex={p.tex} stage={p.stage} pulse={pulse} reg={reg}
          onPlaced={p.onPlaced} onWrong={p.onWrong} onHover={p.onHover} />
      ))}
      <BoxMesh lead={p.lead} tex={p.tex} stage={p.stage} onOpen={p.onOpen} onReady={p.onReady} />
      {p.stage === "done" && (
        <Sparkles count={50} scale={[3.2, 1.6, 3.2]} position={[TRAY.x, 0.9, TRAY.z]} size={3.2} speed={0.45}
          color={p.lead.theme.bolt} opacity={0.9} />
      )}
    </>
  );
}

/* ---------- câmera responsiva com parallax ---------- */
function Rig({ stage, side, inset }: { stage: Stage; side: boolean; inset: number }) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3(0, 0, -2.6));
  const zoom = useRef(1);
  const off = useRef(0);
  const first = useRef(true);
  useFrame((state, dtRaw) => {
    const snap = first.current; // já nasce no enquadramento certo (sem "deslizar" ao carregar)
    first.current = false;
    const dt = snap ? 10 : Math.min(dtRaw, 0.05);
    const aspect = size.width / size.height;
    const tanH = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * aspect;
    const base = Math.max(5.0 / 2 / tanH, 8.2);

    let tz = 0.7, tzoom = 1;
    if (stage === "closed") {
      // o hero tem altura fixa em px: em telas altas (2K) sobra espaço, então a caixa sobe e fica centrada
      const tall = size.height > 1000;
      tz = side ? (tall ? -1.3 : -2.3) : 0.7;
      tzoom = side ? (tall ? 1.35 : 1.5) : 1;
    }
    if (stage === "done") { tz = side ? -1.0 : 1.3; tzoom = side ? 1.05 : 0.9; }
    // desktop: a cena desce um pouco para a bandeja não ficar sob o painel
    if (stage === "play" && side) { tz = -0.3; tzoom = 1.2; }
    if (stage === "opening" && side) { tz = -0.3; tzoom = 1.35; }

    // desktop: a peça ocupa a área à esquerda do painel (mesma regra do .reveal/.hero no CSS)
    let tx = 0;
    if (side) {
      const panelLeft = Math.min(size.width * 0.54, size.width - 464);
      const r = clamp(panelLeft / size.width, 0.3, 1);
      // garante que ~5,6 unidades de cena caibam na área livre
      tzoom = Math.max(tzoom, 5.6 / (2 * tanH * base * r));
      tx = (1 - r) * tanH * base * tzoom;
    }

    look.current.x = damp(look.current.x, tx, 2.5, dt);
    look.current.z = damp(look.current.z, tz, 2.5, dt);
    zoom.current = damp(zoom.current, tzoom, 2.5, dt);
    off.current = damp(off.current, side ? 0 : inset / 2, 4, dt);

    const d = base * zoom.current;
    const px = state.pointer.x * 0.35, py = state.pointer.y * 0.12;
    camera.position.set(look.current.x + px, look.current.y + Math.sin(PITCH) * d + py, look.current.z + Math.cos(PITCH) * d);
    camera.lookAt(look.current);
    // celular: desloca a imagem para baixo, centrando a cena na área abaixo do texto
    const c = camera as THREE.PerspectiveCamera;
    c.setViewOffset(size.width, size.height, 0, -off.current, size.width, size.height);
  });
  return null;
}

/* ---------- caixa kraft ---------- */
function BoxMesh(p: { lead: LeadData; tex: Textures; stage: Stage; onOpen: () => void; onReady: () => void }) {
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
      group.current.rotation.y = Math.sin(t * 0.6) * 0.07;
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
      // só libera o jogo depois que os blocos terminaram de pousar
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
    <group ref={group} position={TRAY} onClick={click} onPointerOver={over} onPointerOut={out}>
      <RoundedBox ref={body} args={[2.9, 1.1, 2.9]} radius={0.06} smoothness={4} position-y={0.55} castShadow receiveShadow>
        <meshPhysicalMaterial color={theme.box} roughness={0.85} sheen={0.6} sheenColor="#f2d3a4" />
      </RoundedBox>
      <group ref={lid} position-y={1.275}>
        <RoundedBox args={[3.05, 0.35, 3.05]} radius={0.07} smoothness={4} castShadow>
          <meshPhysicalMaterial ref={lidMat} color={theme.lid} roughness={0.8} sheen={0.6} sheenColor="#f2d3a4" transparent />
        </RoundedBox>
        <mesh rotation-x={-Math.PI / 2} position-y={0.178}>
          <planeGeometry args={[2.3, 2.3]} />
          <meshStandardMaterial ref={logoMat} map={p.tex.logo} transparent roughness={0.7}
            polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
        </mesh>
      </group>
    </group>
  );
}

/* ---------- bandeja ---------- */
function Tray(p: { lead: LeadData; tex: Textures; placed: boolean[]; pulse: React.MutableRefObject<number[]> }) {
  const ghosts = useRef<(THREE.Mesh | null)[]>([]);
  const mat = <meshPhysicalMaterial color={p.lead.theme.tray} roughness={0.55} clearcoat={0.25} clearcoatRoughness={0.4} />;
  const part = (w: number, h: number, d: number, x: number, y: number, z: number, k: string) => (
    <RoundedBox key={k} args={[w, h, d]} radius={0.02} smoothness={2} position={[x, y, z]} castShadow receiveShadow>
      {mat}
    </RoundedBox>
  );

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    ghosts.current.forEach((g, i) => {
      if (!g) return;
      const v = (p.pulse.current[i] *= Math.exp(-dt * 2.2));
      g.scale.setScalar(1 + 0.06 * Math.sin(v * 9) * v);
      (g.material as THREE.MeshBasicMaterial).opacity = 0.75 + 0.25 * v;
    });
  });

  return (
    <group position={TRAY}>
      {part(2.32, 0.08, 2.32, 0, 0.04, 0, "b")}
      {part(2.32, 0.2, 0.08, 0, 0.1, -1.12, "n")}
      {part(2.32, 0.2, 0.08, 0, 0.1, 1.12, "s")}
      {part(0.08, 0.2, 2.32, -1.12, 0.1, 0, "w")}
      {part(0.08, 0.2, 2.32, 1.12, 0.1, 0, "e")}
      {part(0.08, 0.2, 2.16, 0, 0.1, 0, "v")}
      {part(2.16, 0.2, 0.08, 0, 0.1, 0, "h")}
      {OFFS.map(([x, z], i) => (
        <mesh key={i} ref={(m) => { ghosts.current[i] = m; }} rotation-x={-Math.PI / 2} position={[x, 0.086, z]}
          visible={!p.placed[i]}>
          <planeGeometry args={[0.94, 0.94]} />
          <meshBasicMaterial map={p.tex.ghosts[i]} transparent depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Primeiro ponto de repouso livre (o do próprio bloco tem prioridade); evita nascer sobre outro bloco. */
function freeSpot(i: number, reg: (BState | null)[]): { x: number; z: number; own: boolean } {
  const own: [number, number] = [TRAY.x + SCATTER[i][0], TRAY.z + SCATTER[i][1]];
  const cands: [number, number][] = [
    own,
    ...SCATTER.map(([x, z]): [number, number] => [TRAY.x + x, TRAY.z + z]),
    [0, TRAY.z + 2.4], [-1.2, TRAY.z + 2.4], [1.2, TRAY.z + 2.4],
  ];
  const free = (c: [number, number]) =>
    reg.every((o, k) => k === i || !o || Math.abs(o.to.x - c[0]) >= SIZE || Math.abs(o.to.z - c[1]) >= SIZE);
  const c = cands.find(free) ?? own;
  return { x: c[0], z: c[1], own: c === own };
}

/* ---------- bloco arrastável ---------- */
function Block(p: {
  i: number; color: string; tex: Textures; stage: Stage;
  pulse: React.MutableRefObject<number[]>; reg: React.MutableRefObject<(BState | null)[]>;
  onPlaced: (i: number) => void; onWrong: () => void; onHover?: (i: number | null) => void;
}) {
  const { i } = p;
  const root = useRef<THREE.Group>(null!);
  const flipper = useRef<THREE.Group>(null!);
  const mat = useRef<THREE.MeshPhysicalMaterial>(null!);
  const { camera, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const offscreen = useMemo(() => new THREE.Vector3(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.45), []);
  const rest = useMemo(() => ({ pos: new THREE.Vector3(TRAY.x + SCATTER[i][0], 0.13, TRAY.z + SCATTER[i][1]), ry: SCATTER[i][2] }), [i]);
  const st = useRef({
    to: new THREE.Vector3(TRAY.x + OFFS[i][0] * 0.2, 0.7, TRAY.z + OFFS[i][1] * 0.2),
    ry: 0, ryTo: 0, flip: 0, flipTo: 0, tilt: 0, placed: false, dragging: false, doneAt: -1,
  });

  useEffect(() => {
    const s = st.current;
    if (p.stage === "play" || p.stage === "done") {
      // montado já avançado (retomada / atalho de dev): sem animação de abertura
      const done = p.stage === "done";
      s.to.copy(done ? SLOTS[i] : rest.pos);
      s.ry = s.ryTo = done ? 0 : rest.ry;
      s.flip = s.flipTo = done ? Math.PI : 0;
      s.placed = done;
      root.current.visible = true;
    } else {
      root.current.visible = false;
    }
    root.current.position.copy(s.to);
    root.current.rotation.y = s.ry;
    flipper.current.rotation.x = s.flip;
    p.reg.current[i] = s; // registro compartilhado para colisão
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const s = st.current;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));
    if (p.stage === "opening") {
      // 1) a tampa sai (0–0.9s); 2) os blocos sobem de dentro da caixa e ficam flutuando sobre ela;
      // 3) a caixa afunda (1.2–1.9s); 4) só então os blocos descem até a mesa, sem atravessar a caixa
      later(() => {
        root.current.visible = true;
        s.to.set(TRAY.x + OFFS[i][0] * 0.9, 2.1, TRAY.z + OFFS[i][1] * 0.9);
        s.ryTo = rest.ry * 2;
      }, 850 + i * 100);
      later(() => { s.to.copy(rest.pos); s.ryTo = rest.ry; }, 1850 + i * 100);
    }
    if (p.stage === "done") {
      s.doneAt = performance.now() / 1000;
      later(() => { s.to.y = SLOTS[i].y + 0.32; }, i * 90);
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
    s.flip = damp(s.flip, s.flipTo, 9, dt); flipper.current.rotation.x = s.flip;

    // se o bloco foi empurrado para fora da tela, volta para um lugar livre no centro da mesa
    if (p.stage === "play" && !s.placed && !s.dragging) {
      offscreen.copy(s.to).project(camera);
      if (Math.abs(offscreen.x) > 0.92 || Math.abs(offscreen.y) > 0.92) {
        const f = freeSpot(i, p.reg.current);
        s.to.set(f.x, rest.pos.y, f.z);
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
      s.to.set(clamp(q.x + off.x, -2.1, 2.1), 0.5, clamp(q.z + off.z, -3, 4));
      s.ryTo = 0;
      settle(p.reg.current); // empurra os blocos soltos; encaixados não cedem
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("pointerup", up);
      s.dragging = false;
      document.body.style.cursor = "";
      if (!moved) { s.flipTo = s.flipTo ? 0 : Math.PI; p.pulse.current[i] = 1; s.to.y = rest.pos.y; return; }
      if (d2(s.to, SLOTS[i]) < 0.8) {
        s.placed = true; s.to.copy(SLOTS[i]); s.ryTo = 0; s.flipTo = Math.PI;
        p.onPlaced(i);
      } else if (Math.abs(s.to.x - TRAY.x) < TRAY_R && Math.abs(s.to.z - TRAY.z) < TRAY_R) {
        // soltou sobre a bandeja fora do encaixe certo: não pode ficar atravessando as paredes
        if (SLOTS.some((sl, k) => k !== i && d2(s.to, sl) < 0.7)) p.onWrong();
        p.pulse.current[i] = 1;
        s.to.copy(rest.pos); s.ryTo = rest.ry;
      } else {
        s.to.y = rest.pos.y;
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
      <group ref={flipper}>
        <RoundedBox args={[1, 0.26, 1]} radius={0.07} smoothness={5} castShadow receiveShadow>
          <meshPhysicalMaterial ref={mat} color={p.color} roughness={0.32} clearcoat={0.85} clearcoatRoughness={0.22}
            emissive={p.color} emissiveIntensity={0} />
        </RoundedBox>
        <mesh rotation-x={-Math.PI / 2} position-y={0.1325}>
          <planeGeometry args={[0.8, 0.8]} />
          <meshStandardMaterial map={p.tex.icons[i]} transparent roughness={0.6}
            polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
        </mesh>
        <mesh rotation-x={Math.PI / 2} position-y={-0.1325}>
          <planeGeometry args={[0.96, 0.96]} />
          <meshStandardMaterial map={p.tex.quads[i]} transparent roughness={0.5}
            polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
        </mesh>
      </group>
    </group>
  );
}
