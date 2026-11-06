"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import type { LeadData, Piece } from "@/lib/types";
import { track } from "@/lib/track";
import { themeVars } from "./Experience";
import Reveal, { type Other } from "./Reveal";

type Phase = "closed" | "opening" | "play" | "lit" | "done";

const TRACK = 232;
const THUMB = 56;
const MAX = TRACK - THUMB - 8;
const WEEK = ["D", "S", "T", "Q", "Q", "S", "S"];
const GOLD = { "--tip": "#F4C04E" } as CSSProperties;

/**
 * Fluxo "acenda": a caixa abre, o cartão diz uma palavra, o negatoscópio está apagado com a agenda vazia.
 * Ao arrastar a luz, a agenda se preenche e sobra uma única vaga.
 */
export default function LightExperience({ lead, piece, other }: { lead: LeadData; piece: Piece; other?: Other }) {
  const L = piece.light!;
  const copy = useMemo(() => ({ ...lead.copy, ...piece.copy }), [lead.copy, piece.copy]);
  const [phase, setPhase] = useState<Phase>("closed");
  const [toast, setToast] = useState("");
  const [heroBottom, setHeroBottom] = useState(0);
  const [back, setBack] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const toastT = useRef<number>(0);
  const x = useMotionValue(0);
  const pre = useTransform(x, [0, MAX], [0, 0.55]);

  const say = useCallback((s: string) => {
    setToast(s);
    window.clearTimeout(toastT.current);
    toastT.current = window.setTimeout(() => setToast(""), 2000);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const s = new URLSearchParams(location.search).get("step");
      if (s === "play" || s === "done") setPhase(s);
    }
  }, []);

  // celular: mede o texto do topo para o negatoscópio ficar abaixo dele
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const m = () => setHeroBottom(el.getBoundingClientRect().bottom + 12);
    m();
    const ro = new ResizeObserver(m);
    ro.observe(el);
    return () => ro.disconnect();
  }, [phase, back]);

  const open = () => {
    if (phase !== "closed") return;
    setPhase("opening");
    track(lead.slug, "box_open", piece.id);
    window.setTimeout(() => setPhase((p) => (p === "opening" ? "play" : p)), 2800);
  };

  const light = useCallback(() => {
    if (phase !== "play") return;
    setPhase("lit");
    track(lead.slug, "light_on", piece.id);
    animate(x, MAX, { type: "spring", damping: 22, stiffness: 260 });
  }, [phase, lead.slug, piece.id, x]);

  // depois de acesa: segura a frase, mostra o verso do cartão e só então libera a tela final
  useEffect(() => {
    if (phase !== "lit") return;
    const t = window.setTimeout(() => setBack(true), 3600);
    return () => window.clearTimeout(t);
  }, [phase]);

  const finish = () => { setPhase("done"); track(lead.slug, "reveal", piece.id); };

  const cells = useMemo(() => {
    const out: { n: number | null; booked: boolean; free: boolean }[] = [];
    for (let b = 0; b < L.startDay; b++) out.push({ n: null, booked: false, free: false });
    for (let d = 1; d <= L.days; d++) {
      const wd = (L.startDay + d - 1) % 7;
      const util = wd >= 1 && wd <= 5;
      out.push({ n: d, booked: util && !L.free.includes(d), free: util && L.free.includes(d) });
    }
    return out;
  }, [L]);

  const lit = phase === "lit" || phase === "done";
  const boxed = phase === "closed" || phase === "opening";
  const reached = [phase !== "closed", lit];

  return (
    <main className="root" style={themeVars(lead.theme)}>
      <div className="bg" aria-hidden />
      <div className="grain" aria-hidden />

      <header className="top">
        <div className="brand">{lead.name}</div>
        <div className="dots" aria-hidden>
          {["#2BA08F", "#F4C04E"].map((c, i) => (
            <motion.i key={c} animate={{ scale: reached[i] ? 1.3 : 1, backgroundColor: reached[i] ? c : "rgba(255,255,255,.18)" }} />
          ))}
        </div>
      </header>

      <div className={`lx ${phase === "done" ? "done" : ""}`} style={{ "--hero": `${heroBottom}px` } as CSSProperties}>
        <motion.div className="lx-halo" aria-hidden initial={false} animate={{ opacity: lit ? 1 : 0 }} transition={{ duration: 1.4 }} />
        <motion.div className="lx-halo" aria-hidden style={{ opacity: phase === "play" ? pre : 0 }} />

        <div className="lx-stage">
          <AnimatePresence>
            {boxed && (
              <motion.button key="box" className="lx-box" onClick={open} aria-label={copy.hintClosed}
                initial={{ opacity: 0, y: 30, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.9, transition: { duration: 0.5 } }}
                whileHover={phase === "closed" ? { y: -4 } : undefined}>
                <span className="lx-base"><b>{lead.name}</b><i /></span>
                <motion.span className="lx-card" initial={false}
                  animate={phase === "opening" ? { y: -112, opacity: 1, rotate: -3 } : { y: 6, opacity: 0, rotate: 0 }}
                  transition={{ delay: phase === "opening" ? 0.45 : 0, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}>
                  {L.card}
                </motion.span>
                <motion.span className="lx-lid" initial={false}
                  animate={phase === "opening" ? { y: -70, x: 90, rotate: 14, opacity: 0 } : { y: 0, x: 0, rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }} />
              </motion.button>
            )}
          </AnimatePresence>

          {!boxed && (
            <motion.div className={`lx-neg ${lit ? "lit" : ""}`} initial={{ opacity: 0, y: 24, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", damping: 20, stiffness: 140 }}>
              <div className="lx-body">
                <div className="lx-slotbar"><span className="lx-clip">{L.clip}</span></div>
                <div className="lx-window">
                  <div className="lx-title"><b>{L.title}</b><span>{L.month}</span></div>
                  <div className="lx-week" aria-hidden>{WEEK.map((w, i) => <span key={i}>{w}</span>)}</div>
                  <div className="lx-grid" role="img" aria-label={`${L.title}, ${L.month}`}>
                    {cells.map((c, k) => (
                      <span key={k} className={`lx-cell ${c.n === null ? "void" : ""} ${c.free ? "free" : ""}`}>
                        {c.n !== null && <em>{c.n}</em>}
                        {c.booked && (
                          <motion.i className="slot" initial={false} animate={{ scaleX: lit ? 1 : 0, opacity: lit ? 1 : 0 }}
                            transition={{ delay: lit ? 0.35 + k * 0.07 : 0, duration: 0.35, ease: "easeOut" }} />
                        )}
                        {c.free && lit && (
                          <motion.u className="vaga" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.35 + cells.length * 0.07 + 0.2, type: "spring", damping: 10 }} />
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="lx-foot" aria-hidden />
            </motion.div>
          )}

          {phase === "play" && (
            <motion.div className="lx-switch" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <div className="lx-track" style={{ width: TRACK }}>
                <span className="lx-trackLabel">{L.hintLight}</span>
                <motion.button className="lx-thumb" aria-label={L.hintLight} drag="x" dragConstraints={{ left: 0, right: MAX }}
                  dragElastic={0} dragMomentum={false} style={{ x, width: THUMB }}
                  onDragEnd={() => (x.get() > MAX * 0.75 ? light() : animate(x, 0, { type: "spring", damping: 20, stiffness: 300 }))}
                  onClick={() => x.get() < 6 && light()}
                  whileTap={{ scale: 0.94 }}>
                  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
                    <path d="M9 21h6M10 17h4m-5-2.5C7 13 6 11.4 6 9.5a6 6 0 1 1 12 0c0 1.9-1 3.5-3 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase !== "done" && (
          <motion.section key={phase + String(back)} ref={heroRef} className="hero" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}>
            {phase === "closed" && (
              <>
                <p className="eyebrow">{copy.eyebrow}</p>
                <h1>{copy.title}</h1>
                {copy.why && <p className="why">{copy.why}</p>}
                <p className="hint pulse">{copy.hintClosed}</p>
              </>
            )}
            {phase === "opening" && copy.boxLine && <p className="why">{copy.boxLine}</p>}
            {phase === "play" && (
              <>
                <p className="repr" style={GOLD}>{L.emptyLine}</p>
                <p className="hint">{copy.hintPlay}</p>
              </>
            )}
            {phase === "lit" && !back && <p className="repr" style={GOLD}>{L.litLine}</p>}
            {phase === "lit" && back && (
              <>
                <p className="repr big">{L.cardBack}</p>
                <button className="btn primary next" onClick={finish}>{L.next}</button>
              </>
            )}
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

      {phase === "done" && <Reveal lead={lead} piece={piece} copy={copy} say={say} other={other} />}
    </main>
  );
}
