"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import type { LeadData, Piece, Stage } from "@/lib/types";
import { track } from "@/lib/track";
import Reveal, { type Other } from "./Reveal";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

export function themeVars(t: LeadData["theme"]): CSSProperties {
  return {
    "--bg": t.bg, "--glow": t.glow, "--ink": t.ink, "--muted": t.muted, "--surface": t.surface,
    "--line": t.line, "--accent": t.accent, "--on-accent": t.onAccent, "--bolt": t.bolt,
  } as CSSProperties;
}

/** Experiência padrão: caixa 3D → montagem → revelação. Totalmente guiada por `lead`. */
export default function Experience({ lead: base, piece, other }: { lead: LeadData; piece?: Piece; other?: Other }) {
  // com `piece`, os blocos e os textos da peça substituem os do lead
  const lead = useMemo<LeadData>(
    () => ({ ...base, tools: piece?.tools ?? base.tools, copy: { ...base.copy, ...piece?.copy } }),
    [base, piece],
  );
  const { copy, tools } = lead;
  const [stage, setStage] = useState<Stage>("closed");
  const [placed, setPlaced] = useState([false, false, false, false]);
  const [toast, setToast] = useState("");
  const [font, setFont] = useState("");
  const [gl, setGl] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [side, setSide] = useState(false);
  const [heroBottom, setHeroBottom] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  const toastT = useRef<number>(0);
  const [last, setLast] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  // o popup acompanha o ponteiro sem re-renderizar a cada movimento
  useEffect(() => {
    if (hover === null) return;
    const place = (x: number, y: number) => {
      const el = tipRef.current;
      if (!el) return;
      const w = el.offsetWidth, h = el.offsetHeight;
      const left = Math.min(Math.max(12, x + 18), window.innerWidth - w - 12);
      const top = y + 18 + h > window.innerHeight ? y - h - 18 : y + 18;
      el.style.transform = `translate(${left}px, ${Math.max(12, top)}px)`;
      el.style.opacity = "1";
    };
    const mv = (e: PointerEvent) => place(e.clientX, e.clientY);
    window.addEventListener("pointermove", mv);
    return () => window.removeEventListener("pointermove", mv);
  }, [hover]);

  const say = useCallback((s: string) => {
    setToast(s);
    window.clearTimeout(toastT.current);
    toastT.current = window.setTimeout(() => setToast(""), 2000);
  }, []);

  useEffect(() => {
    if (!piece) track(lead.slug, "open_link"); // com peça, quem conta a abertura é a tela de escolha
    setFont(getComputedStyle(document.body).getPropertyValue("--font-display").trim());
    const c = document.createElement("canvas");
    if (!c.getContext("webgl2") && !c.getContext("webgl")) { setGl(false); setStage("done"); }
    // atalho só em desenvolvimento: /p/<slug>?step=play | done
    if (process.env.NODE_ENV === "development") {
      const s = new URLSearchParams(location.search).get("step");
      if (s === "play" || s === "done") {
        setStage(s);
        if (s === "done") setPlaced([true, true, true, true]);
      }
    }
    const mq = window.matchMedia("(min-width: 900px)");
    const sync = () => setSide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    setMounted(true);
    return () => mq.removeEventListener("change", sync);
  }, [lead.slug, piece?.id]);

  // celular: mede o texto do topo para a caixa ficar abaixo dele, sem sobrepor
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const m = () => setHeroBottom(el.getBoundingClientRect().bottom + 16);
    m();
    const ro = new ResizeObserver(m);
    ro.observe(el);
    return () => ro.disconnect();
  }, [stage, last]);

  useEffect(() => {
    if (stage !== "play" || !placed.every(Boolean)) return;
    const id = setTimeout(() => { setStage("done"); track(lead.slug, "reveal", piece?.id); }, 800);
    return () => clearTimeout(id);
  }, [placed, stage, lead.slug, piece?.id]);

  const onOpen = useCallback(() => { setStage("opening"); track(lead.slug, "box_open", piece?.id); }, [lead.slug, piece?.id]);
  // a caixa terminou de abrir: segura 1,5 s para dar tempo de ler antes da montagem
  const onReady = useCallback(() => { window.setTimeout(() => setStage((s) => (s === "opening" ? "play" : s)), 800); }, []);
  const onPlaced = useCallback((i: number) => { setLast(i); setPlaced((p) => p.map((v, k) => (k === i ? true : v))); }, []);
  const onWrong = useCallback(() => say(copy.hintWrong), [say, copy.hintWrong]);

  const hint = stage === "closed" ? copy.hintClosed : stage === "play" ? copy.hintPlay : "";
  const rep = stage === "play" && last !== null ? tools[last] : null;

  return (
    <main className="root" style={themeVars(lead.theme)}>
      <div className="bg" aria-hidden />
      <div className="grain" aria-hidden />

      {gl && mounted && (
        <Scene lead={lead} stage={stage} fontFamily={font} placed={placed}
          onOpen={onOpen} onReady={onReady} onPlaced={onPlaced} onWrong={onWrong} onHover={setHover}
          side={side} inset={stage === "done" ? 0 : heroBottom} />
      )}

      {hover !== null && tools[hover].meaning && (
        <div key={hover} ref={tipRef} className="tip" role="tooltip" style={{ "--tip": tools[hover].color } as CSSProperties}>
          <strong>{tools[hover].label}</strong>
          <p>{tools[hover].meaning}</p>
        </div>
      )}

      <header className="top">
        <div className="brand">{lead.name}</div>
        <div className="dots" aria-hidden>
          {tools.map((t, i) => (
            <motion.i key={i} animate={{ scale: placed[i] ? 1.3 : 1, backgroundColor: placed[i] ? t.color : "rgba(255,255,255,.18)" }} />
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {(stage === "closed" || stage === "play" || (stage === "opening" && copy.boxLine)) && (
          <motion.section key={stage} ref={heroRef} className="hero" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}>
            {stage === "closed" && (
              <>
                <p className="eyebrow">{copy.eyebrow}</p>
                <h1>{copy.title}</h1>
                {copy.why && <p className="why">{copy.why}</p>}
              </>
            )}
            {stage === "opening" && copy.boxLine && <p className="why">{copy.boxLine}</p>}
            {rep?.represents && (
              <motion.p key={last} className="repr" style={{ "--tip": rep.color } as CSSProperties}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <strong>{rep.label}</strong> {rep.represents}
              </motion.p>
            )}
            {hint && <p className={`hint ${stage === "closed" ? "pulse" : ""}`}>{hint}</p>}
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div className="toast" role="status" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {stage === "done" && <Reveal lead={lead} piece={piece} copy={copy} say={say} other={other} />}
    </main>
  );
}
