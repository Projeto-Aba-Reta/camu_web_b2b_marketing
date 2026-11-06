/** Contato da Camu: Cal.com (mesma agenda do camu-web-b2b) e WhatsApp. */
export const CAL_LINK = "camu-studio/breafing";
export const CAL_NAMESPACE = "breafing";
export const CAL_ORIGIN = "https://app.cal.com";

/** Número da Camu (mesmo da loja): só dígitos, com DDI+DDD. Sobrescreva com NEXT_PUBLIC_WHATSAPP_NUMBER. */
export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5511912581464").replace(/\D/g, "");

export const whatsappUrl = (text: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

type CalFn = ((...args: unknown[]) => void) & {
  loaded?: boolean;
  ns?: Record<string, (...args: unknown[]) => void>;
  q?: unknown[];
};

/** Snippet oficial do embed do Cal.com (igual ao camu-web-b2b), carregado só no primeiro uso. */
function bootstrapCal(): CalFn {
  const w = window as unknown as { Cal?: CalFn };
  if (w.Cal) return w.Cal;
  const queue = (api: { q?: unknown[] }, args: unknown) => { (api.q ??= []).push(args); };
  const cal: CalFn = function (...args: unknown[]) {
    if (!cal.loaded) {
      cal.ns = {};
      cal.q = cal.q || [];
      const s = document.createElement("script");
      s.src = `${CAL_ORIGIN}/embed/embed.js`;
      document.head.appendChild(s);
      cal.loaded = true;
    }
    if (args[0] === "init") {
      const api: CalFn = function (...a: unknown[]) { queue(api, a); };
      const namespace = args[1];
      if (typeof namespace === "string") {
        cal.ns![namespace] = cal.ns![namespace] || api;
        queue(cal.ns![namespace] as CalFn, args);
        queue(cal, ["initNamespace", namespace]);
      } else queue(cal, args);
      return;
    }
    queue(cal, args);
  };
  w.Cal = cal;
  return cal;
}

let ready: ((...args: unknown[]) => void) | undefined;

/** Inicia o Cal (uma vez) e devolve o namespace. */
export function initCal() {
  if (typeof window === "undefined") return undefined;
  if (ready) return ready;
  const Cal = bootstrapCal();
  Cal("init", CAL_NAMESPACE, { origin: CAL_ORIGIN });
  ready = Cal.ns?.[CAL_NAMESPACE];
  ready?.("ui", {
    theme: "dark",
    styles: { body: { background: "transparent" } },
    hideEventTypeDetails: false,
    layout: "month_view",
    cssVarsPerTheme: { light: { "cal-brand": "#ce6a4b" }, dark: { "cal-brand": "#2f9e8e" } },
  });
  return ready;
}

/** Abre o popup de agendamento de 15 minutos; sem o embed, cai para a página do Cal. */
export function openCal(prefill?: { name?: string }) {
  const ns = initCal();
  if (!ns) return;
  ns("modal", {
    calLink: CAL_LINK,
    config: { layout: "month_view", useSlotsViewOnSmallScreen: "true", ...(prefill?.name ? { name: prefill.name } : {}) },
  });
}
