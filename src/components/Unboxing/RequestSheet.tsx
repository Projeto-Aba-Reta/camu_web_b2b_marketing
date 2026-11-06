"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LeadData } from "@/lib/types";
import { track } from "@/lib/track";

export default function RequestSheet({
  lead, open, onClose, onDone,
}: { lead: LeadData; open: boolean; onClose: () => void; onDone: () => void }) {
  const { copy } = lead;
  const [busy, setBusy] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => nameRef.current?.focus(), 350);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => { clearTimeout(t); window.removeEventListener("keydown", esc); };
  }, [open, onClose]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: lead.slug, name: f.get("name"), address: f.get("address") }),
      });
      track(lead.slug, "submit_piece");
    } catch {}
    setBusy(false);
    onDone();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="sheet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}>
          <motion.form className="sheet-form glass" onSubmit={submit}
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}>
            <button type="button" className="sheet-close" onClick={onClose}>fechar</button>
            <h3>{copy.formTitle}</h3>
            <label><span>{copy.formName}</span>
              <input ref={nameRef} name="name" required maxLength={120} autoComplete="name" />
            </label>
            <label><span>{copy.formAddress}</span>
              <textarea name="address" rows={3} required maxLength={400} autoComplete="street-address" />
            </label>
            <button className="btn primary" disabled={busy}>{copy.formSend}</button>
            <p className="note">{copy.formNote}</p>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
