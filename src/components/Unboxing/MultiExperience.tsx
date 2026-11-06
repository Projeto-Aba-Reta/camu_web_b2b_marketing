"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { LeadData, Piece } from "@/lib/types";
import { track } from "@/lib/track";
import Experience, { themeVars } from "./Experience";
import LightExperience from "./LightExperience";

/** Tela de escolha + um fluxo de unboxing por peça (cada `kind` tem o seu). */
export default function MultiExperience({ lead }: { lead: LeadData }) {
  const pieces = lead.pieces ?? [];
  const [id, setId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const pk = lead.picker;

  useEffect(() => {
    track(lead.slug, "open_link");
    if (process.env.NODE_ENV === "development") {
      const q = new URLSearchParams(location.search).get("piece");
      if (q && (lead.pieces ?? []).some((p) => p.id === q)) setId(q);
    }
    setMounted(true);
  }, [lead.slug, lead.pieces]);

  const pick = (p: Piece) => { track(lead.slug, "pick_piece", p.id); setId(p.id); };

  const piece = pieces.find((p) => p.id === id);
  if (piece) {
    const o = pieces.find((p) => p.id !== piece.id);
    const other = o ? { label: `Abrir também: ${o.name} →`, go: () => pick(o) } : undefined;
    return piece.kind === "light"
      ? <LightExperience key={piece.id} lead={lead} piece={piece} other={other} />
      : <Experience key={piece.id} lead={lead} piece={piece} other={other} />;
  }

  return (
    <main className="root" style={themeVars(lead.theme)}>
      <div className="bg" aria-hidden />
      <div className="grain" aria-hidden />
      <header className="top"><div className="brand">{lead.name}</div></header>
      <div className="pick">
        <motion.div className="pick-head" initial={{ opacity: 0, y: 14 }} animate={{ opacity: mounted ? 1 : 0, y: 0 }}>
          {pk && <p className="eyebrow">{pk.eyebrow}</p>}
          <h1>{pk?.title ?? "Escolha uma caixa."}</h1>
          {pk?.body && <p className="why">{pk.body}</p>}
        </motion.div>
        <div className="pick-grid">
          {pieces.map((p, i) => (
            <motion.button key={p.id} className="pick-card glass" onClick={() => pick(p)}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: mounted ? 1 : 0, y: 0 }} transition={{ delay: 0.25 + i * 0.15 }}
              whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
              <span className={`pick-art ${p.kind}`} aria-hidden>
                {p.kind === "light" ? Array.from({ length: 15 }).map((_, k) => <i key={k} />) : <i />}
              </span>
              <strong>{p.name}</strong>
              <span className="pick-teaser">{p.teaser}</span>
              <em>{p.kind === "light" ? "Acenda a luz" : "Monte as peças"} →</em>
            </motion.button>
          ))}
        </div>
        {pk?.hint && <p className="hint pulse">{pk.hint}</p>}
      </div>
    </main>
  );
}
