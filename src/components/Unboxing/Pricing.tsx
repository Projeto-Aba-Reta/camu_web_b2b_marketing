"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PriceTier, Pricing as PricingData } from "@/lib/types";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const qty = (t: PriceTier) =>
  t.max === undefined ? `${t.min}+ peças` : t.min === t.max ? `${t.min} peça${t.min > 1 ? "s" : ""}` : `${t.min} a ${t.max} peças`;

function useCountdown(endsAt?: string) {
  const end = endsAt ? new Date(endsAt).getTime() : NaN;
  const [left, setLeft] = useState<number | null>(null); // null até montar (evita hydration mismatch)
  useEffect(() => {
    if (Number.isNaN(end)) return;
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [end]);
  return left;
}

function Timer({ ms }: { ms: number }) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const parts: [number, string][] = [
    ...(d > 0 ? ([[d, "d"]] as [number, string][]) : []),
    [Math.floor((s % 86400) / 3600), "h"],
    [Math.floor((s % 3600) / 60), "min"],
    [s % 60, "s"],
  ];
  return (
    <div className="timer" role="timer" aria-label="Tempo restante da promoção">
      {parts.map(([n, u]) => (
        <span key={u}><b>{String(n).padStart(2, "0")}</b>{u}</span>
      ))}
    </div>
  );
}

function Row({ t, i, promo }: { t: PriceTier; i: number; promo: boolean }) {
  const d = 0.2 + i * 0.25; // cada linha anima em sequência
  const cut = promo && t.was !== undefined && t.was > t.price;
  const shown = promo ? t.price : t.was ?? t.price;
  return (
    <li>
      <span className="qty">{qty(t)}</span>
      <span className="amount">
        {cut && (
          <span className="was">
            {brl.format(t.was!)}
            <motion.i initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: d + 0.3, duration: 0.35, ease: "easeOut" }} />
          </span>
        )}
        <motion.span className={`price ${cut ? "sale" : ""}`}
          initial={cut ? { opacity: 0, scale: 0.6, y: 6 } : false}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: d + 0.7, type: "spring", damping: 12, stiffness: 220 }}>
          {brl.format(shown)}
        </motion.span>
        {cut && (
          <motion.em initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d + 0.9 }}>
            −{Math.round((1 - t.price / t.was!) * 100)}%
          </motion.em>
        )}
      </span>
    </li>
  );
}

/** Tabela de preço por peça com desconto animado, timer e modo sob demanda. */
export default function Pricing({ data }: { data: PricingData }) {
  const [mode, setMode] = useState<"stock" | "demand">("stock");
  const left = useCountdown(data.promo?.endsAt);
  const promo = !!data.promo && left !== null && left > 0;
  const od = data.onDemand;
  const cur = mode === "demand" && od ? od : null;
  const tiers = cur ? cur.tiers : data.tiers;

  return (
    <div className="pricing">
      <h3>{data.title ?? "Preço por peça"}</h3>

      {od && (
        <div className="seg" role="tablist">
          {(["stock", "demand"] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} className={mode === m ? "on" : ""} onClick={() => setMode(m)}>
              {mode === m && <motion.span layoutId="seg-pill" className="pill" transition={{ type: "spring", damping: 26, stiffness: 320 }} />}
              <span className="lbl">{m === "stock" ? "Em lote" : od.label ?? "Sob demanda"}</span>
            </button>
          ))}
        </div>
      )}
      {cur?.description && <p className="pnote">{cur.description}</p>}

      {promo && data.promo && (
        <motion.div className="promo" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
          <strong>{data.promo.label}</strong>
          <Timer ms={left!} />
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <motion.ul key={mode + String(promo)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {tiers.map((t, i) => <Row key={i} t={t} i={i} promo={promo} />)}
        </motion.ul>
      </AnimatePresence>

      {data.note && <p className="pnote">{data.note}</p>}
    </div>
  );
}
