"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import type { LeadData, Stage } from "@/lib/types";
import { track } from "@/lib/track";
import RequestSheet from "./RequestSheet";
import Pricing from "./Pricing";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

export function themeVars(t: LeadData["theme"]): CSSProperties {
  return {
    "--bg": t.bg, "--glow": t.glow, "--ink": t.ink, "--muted": t.muted, "--surface": t.surface,
    "--line": t.line, "--accent": t.accent, "--on-accent": t.onAccent, "--bolt": t.bolt,
  } as CSSProperties;
}

/** Experiência padrão: caixa 3D → montagem → revelação. Totalmente guiada por `lead`. */
export default function Experience({ lead }: { lead: LeadData }) {
  const { copy, tools } = lead;
  const [stage, setStage] = useState<Stage>("closed");
  const [placed, setPlaced] = useState([false, false, false, false]);
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState("");
  const [font, setFont] = useState("");
  const [gl, setGl] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [side, setSide] = useState(false);
  const [step, setStep] = useState<"story" | "buy">("story");
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
    track(lead.slug, "open_link");
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
  }, [lead.slug]);

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
    const id = setTimeout(() => { setStage("done"); track(lead.slug, "reveal"); }, 800);
    return () => clearTimeout(id);
  }, [placed, stage, lead.slug]);

  const onOpen = useCallback(() => { setStage("opening"); track(lead.slug, "box_open"); }, [lead.slug]);
  // a caixa terminou de abrir: segura 1,5 s para dar tempo de ler antes da montagem
  const onReady = useCallback(() => { window.setTimeout(() => setStage((s) => (s === "opening" ? "play" : s)), 800); }, []);
  const onPlaced = useCallback((i: number) => { setLast(i); setPlaced((p) => p.map((v, k) => (k === i ? true : v))); }, []);
  const onWrong = useCallback(() => say(copy.hintWrong), [say, copy.hintWrong]);

  const talk = () => {
    track(lead.slug, "request_talk");
    lead.links.agenda ? window.open(lead.links.agenda, "_blank", "noopener") : say(copy.agendaMissing);
  };
  const piece = () => { track(lead.slug, "request_piece"); setSheet(true); };

  // feature flag por lead (`pricing.show`); em dev, ?pricing=1|0 força para testar
  let showPricing = !!lead.pricing?.show && !!lead.pricing.tiers.length;
  if (process.env.NODE_ENV === "development" && mounted) {
    const q = new URLSearchParams(location.search).get("pricing");
    if (q === "1") showPricing = !!lead.pricing?.tiers.length;
    if (q === "0") showPricing = false;
  }

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

      <AnimatePresence>
        {stage === "done" && (
          <div className="reveal">
            <motion.section className="card glass" aria-live="polite"
              initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 120, delay: 0.5 }}>
              <AnimatePresence mode="wait" initial={false}>
                {step === "story" || !showPricing || !lead.pricing ? (
                  <motion.div key="story" exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
                    <h2>
                      {copy.headline.split(" ").map((w, i) => (
                        <motion.span key={i} className="word" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.75 + i * 0.07 }}>{w}&nbsp;</motion.span>
                      ))}
                    </h2>
                    <motion.p className="body" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>{copy.body}</motion.p>
                    {copy.legacy && (
                      <motion.div className="legacy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
                        {copy.legacyTitle && <h3>{copy.legacyTitle}</h3>}
                        <ul>{copy.legacy.map((l, i) => <li key={i}>{l}</li>)}</ul>
                      </motion.div>
                    )}
                    {copy.caseStudy && (
                      <motion.blockquote className="case" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>
                        <p>{copy.caseStudy}</p>
                      </motion.blockquote>
                    )}
                    <motion.div className="btns" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}>
                      {showPricing && lead.pricing ? (
                        <button className="btn primary" onClick={() => { setStep("buy"); }}>
                          Ver preços →
                        </button>
                      ) : (
                        <>
                          <button className="btn primary" onClick={piece}>{copy.ctaPiece}</button>
                          <button className="btn" onClick={talk}>{copy.ctaTalk}</button>
                        </>
                      )}
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div key="buy" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                    <button className="back" onClick={() => setStep("story")}>← Voltar</button>
                    <Pricing data={lead.pricing} />
                    <div className="btns">
                      <button className="btn primary" onClick={piece}>{copy.ctaPiece}</button>
                      <button className="link" onClick={talk}>{copy.ctaTalk}</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <p className="foot">
                Camu · kits físicos personalizados
                {lead.links.site && (
                  <>
                    {" · "}
                    <a href={lead.links.site} target="_blank" rel="noopener noreferrer">
                      {lead.links.site.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                  </>
                )}
              </p>
            </motion.section>
          </div>
        )}
      </AnimatePresence>

      <RequestSheet lead={lead} open={sheet} onClose={() => setSheet(false)}
        onDone={() => { setSheet(false); say(copy.thanks); }} />
    </main>
  );
}
