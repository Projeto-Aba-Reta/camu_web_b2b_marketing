"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Copy, LeadData, Piece, Pricing as PricingData } from "@/lib/types";
import { track } from "@/lib/track";
import { PricingSuite, PricingTable, type SuiteTab } from "./Pricing";
import RequestSheet from "./RequestSheet";
import { initCal, openCal } from "@/lib/contact";

export interface Other { label: string; go: () => void }

/** Pedido por peça: a aba de preço aberta vira a escolha do pedido. */
function useTabs(lead: LeadData, piece?: Piece, force?: boolean) {
  const tabs: SuiteTab[] = [];
  const on = (p?: PricingData) => !!p && p.tiers.length > 0 && (!!p.show || !!force);
  for (const p of lead.pieces ?? []) {
    if (on(p.pricing)) tabs.push({ id: p.id, label: p.short ?? p.name, data: p.pricing });
  }
  if (lead.combo && tabs.length > 1 && on(lead.combo.pricing)) {
    tabs.push({ id: "combo", label: lead.combo.label, data: lead.combo.pricing, intro: lead.combo.description });
  }
  // lead de peça única: usa `lead.pricing`
  if (!lead.pieces && on(lead.pricing)) tabs.push({ id: "single", label: "Preço", data: lead.pricing! });
  return { tabs, initial: tabs.find((t) => t.id === piece?.id)?.id ?? tabs[0]?.id };
}

/** Tela final (narrativa → preço → pedido), compartilhada por todos os fluxos de unboxing. */
export default function Reveal({ lead, piece, copy, say, other }: {
  lead: LeadData; piece?: Piece; copy: Copy; say: (s: string) => void; other?: Other;
}) {
  const [step, setStep] = useState<"story" | "buy">("story");
  const [sheet, setSheet] = useState(false);
  const [force, setForce] = useState(false);
  // em dev, ?pricing=1 mostra a tabela mesmo com `show: false`
  useEffect(() => {
    if (process.env.NODE_ENV === "development") setForce(new URLSearchParams(location.search).get("pricing") === "1");
  }, []);

  const { tabs, initial } = useTabs(lead, piece, force);
  const [tab, setTab] = useState<string | undefined>(undefined);
  const active = tab ?? initial;
  const showPricing = tabs.length > 0;
  const choiceTab = tabs.find((t) => t.id === active);
  const choice = piece || tabs.length > 1 ? { id: active ?? piece?.id ?? "", label: choiceTab?.label ?? piece?.name ?? "" } : undefined;

  useEffect(() => { initCal(); }, []); // pré-carrega o agendamento de 15 min

  const ask = () => { track(lead.slug, "request_piece", choice?.id); setSheet(true); };
  const talk = () => {
    track(lead.slug, "request_talk", choice?.id);
    openCal();
  };

  return (
    <>
      <div className="reveal">
        <motion.section className="card glass" aria-live="polite"
          initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 120, delay: 0.5 }}>
          <AnimatePresence mode="wait" initial={false}>
            {step === "story" || !showPricing ? (
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
                  {showPricing ? (
                    <button className="btn primary" onClick={() => setStep("buy")}>Ver preços →</button>
                  ) : (
                    <>
                      <button className="btn primary" onClick={ask}>{copy.ctaPiece}</button>
                      <button className="btn" onClick={talk}>{copy.ctaTalk}</button>
                    </>
                  )}
                  {other && <button className="link" onClick={other.go}>{other.label}</button>}
                </motion.div>
              </motion.div>
            ) : (
              <motion.div key="buy" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <button className="back" onClick={() => setStep("story")}>← Voltar</button>
                {tabs.length > 1 && active ? (
                  <PricingSuite tabs={tabs} active={active} onTab={setTab} />
                ) : (
                  <PricingTable data={tabs[0].data} />
                )}
                <div className="btns">
                  <button className="btn primary" onClick={ask}>{copy.ctaPiece}</button>
                  <button className="link" onClick={talk}>{copy.ctaTalk}</button>
                  {other && <button className="link" onClick={other.go}>{other.label}</button>}
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
      <RequestSheet lead={lead} open={sheet} choice={choice} onClose={() => setSheet(false)}
        onDone={() => { setSheet(false); say(copy.thanks); }} />
    </>
  );
}
