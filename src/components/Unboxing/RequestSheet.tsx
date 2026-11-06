"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LeadData } from "@/lib/types";
import { track } from "@/lib/track";
import { whatsappUrl } from "@/lib/contact";

interface Addr { street: string; district: string; city: string; uf: string }
type Cep = "idle" | "loading" | "ok" | "notfound" | "error";

const maskCep = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

/** Pedido: empresa + endereço por CEP (ViaCEP, base dos Correios) → abre o WhatsApp da Camu com tudo na mensagem. */
export default function RequestSheet({
  lead, open, onClose, onDone, choice,
}: { lead: LeadData; open: boolean; onClose: () => void; onDone: () => void; choice?: { id: string; label: string } }) {
  const { copy } = lead;
  const [busy, setBusy] = useState(false);
  const [cep, setCep] = useState("");
  const [cepState, setCepState] = useState<Cep>("idle");
  const [addr, setAddr] = useState<Addr>({ street: "", district: "", city: "", uf: "" });
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => nameRef.current?.focus(), 350);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => { clearTimeout(t); window.removeEventListener("keydown", esc); };
  }, [open, onClose]);

  // consulta o CEP quando completa 8 dígitos
  useEffect(() => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) { setCepState("idle"); return; }
    const ctl = new AbortController();
    setCepState("loading");
    fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: ctl.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.erro) { setCepState("notfound"); return; }
        setAddr({ street: d.logradouro ?? "", district: d.bairro ?? "", city: d.localidade ?? "", uf: d.uf ?? "" });
        setCepState("ok");
      })
      .catch((e) => { if (e.name !== "AbortError") setCepState("error"); });
    return () => ctl.abort();
  }, [cep]);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    const name = v("name");
    const line1 = [addr.street, v("number")].filter(Boolean).join(", ");
    const address = [line1, v("complement"), addr.district, `${addr.city}/${addr.uf}`, `CEP ${cep}`].filter(Boolean).join(" - ");
    const text = [
      `Olá! Quero pedir ${choice ? `a peça "${choice.label}"` : "a peça física"} que vi no unboxing.`,
      "",
      `Empresa: ${name}`,
      `Endereço de entrega: ${address}`,
    ].join("\n");

    // abre o WhatsApp no clique (antes de qualquer await) para o navegador não bloquear o popup
    window.open(whatsappUrl(text), "_blank", "noopener");
    setBusy(true);
    fetch("/api/request", {
      method: "POST", keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: lead.slug, choice: choice?.id, name, address }),
    }).catch(() => {});
    track(lead.slug, "submit_piece", choice?.id);
    setBusy(false);
    onDone();
  }

  const locked = cepState !== "ok" && cepState !== "error" && cepState !== "notfound";
  // CEP genérico (sem rua) ou sem resposta: deixa digitar a rua
  const manual = cepState === "error" || cepState === "notfound" || (cepState === "ok" && !addr.street);

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
            {choice && <p className="note">Pedido: <strong>{choice.label}</strong></p>}
            <label><span>{copy.formName}</span>
              <input ref={nameRef} name="name" required maxLength={120} autoComplete="organization" />
            </label>
            <label><span>CEP</span>
              <input name="cep" required inputMode="numeric" autoComplete="postal-code" placeholder="00000-000"
                value={cep} onChange={(e) => setCep(maskCep(e.target.value))} pattern="\d{5}-?\d{3}" />
              {cepState === "loading" && <small className="cep">Buscando endereço…</small>}
              {cepState === "ok" && addr.street && <small className="cep ok">{addr.street}, {addr.district} · {addr.city}/{addr.uf}</small>}
              {cepState === "notfound" && <small className="cep">CEP não encontrado. Digite o endereço abaixo.</small>}
              {cepState === "error" && <small className="cep">Não consegui consultar o CEP. Digite o endereço abaixo.</small>}
            </label>
            {manual && (
              <>
                <label><span>Rua</span>
                  <input required maxLength={120} value={addr.street} onChange={(e) => setAddr({ ...addr, street: e.target.value })} />
                </label>
                <div className="row2">
                  <label><span>Bairro</span>
                    <input maxLength={80} value={addr.district} onChange={(e) => setAddr({ ...addr, district: e.target.value })} />
                  </label>
                  <label><span>Cidade/UF</span>
                    <input required maxLength={80} value={addr.city && addr.uf ? `${addr.city}/${addr.uf}` : addr.city}
                      onChange={(e) => { const [c, u = ""] = e.target.value.split("/"); setAddr({ ...addr, city: c, uf: u }); }} />
                  </label>
                </div>
              </>
            )}
            <div className="row2">
              <label><span>Número</span>
                <input name="number" required maxLength={12} autoComplete="off" disabled={locked} />
              </label>
              <label><span>Complemento</span>
                <input name="complement" maxLength={60} autoComplete="off" disabled={locked} />
              </label>
            </div>
            <button className="btn primary" disabled={busy || locked}>Pedir pelo WhatsApp</button>
            <p className="note">Abre o WhatsApp da Camu com o nome da empresa e o endereço já na mensagem.</p>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
