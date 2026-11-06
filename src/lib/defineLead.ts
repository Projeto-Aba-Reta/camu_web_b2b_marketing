import type { Copy, Lead, LeadLogo, Theme, Tool } from "./types";
import type { ComponentType } from "react";
import type { LeadData } from "./types";

export const defaultTheme: Theme = {
  bg: "#0E0C0A",
  glow: "#FFD25A",
  ink: "#F6EBD3",
  muted: "#A89B86",
  surface: "rgba(255,255,255,0.06)",
  line: "rgba(255,255,255,0.14)",
  accent: "#FFD25A",
  onAccent: "#1A140E",
  bolt: "#FFD25A",
  cream: "#F6EBD3",
  box: "#B98B5A",
  lid: "#C49A68",
  tray: "#E3CFA4",
};

export const defaultCopy = (name: string): Copy => ({
  eyebrow: name,
  title: "Abra a caixa.",
  hintClosed: "Toque na caixa para abrir",
  hintPlay: "Arraste cada bloco para o encaixe da cor dele",
  hintWrong: "Esse encaixe é de outra cor",
  headline: "Quatro ferramentas, um sistema.",
  body: `Uma peça física com a marca da ${name}, para o lead que está entre a demo e a assinatura.`,
  caseStudy:
    "Uma plataforma B2B mandou baús com a logo de cada cliente para leads quase fechando e recomprou com 100 unidades.",
  ctaPiece: "Quero a peça física",
  ctaTalk: "Conversar 15 minutos",
  formTitle: "Para onde mando?",
  formName: "Nome da empresa",
  formAddress: "Endereço de entrega",
  formSend: "Enviar",
  formNote: "Só isso. Sem cadastro, sem lista de e-mail.",
  thanks: "Abrimos o WhatsApp com o seu pedido. É só enviar a mensagem.",
  agendaMissing: "Agenda ainda não configurada.",
});

export interface LeadInput {
  slug: string;
  name: string;
  person?: string;
  logo: LeadLogo;
  tools: [Tool, Tool, Tool, Tool];
  theme?: Partial<Theme>;
  copy?: Partial<Copy>;
  meta?: Partial<LeadData["meta"]>;
  links?: LeadData["links"];
  /** preço por peça / atacado; `show: false` (ou omitido) esconde na tela final */
  pricing?: LeadData["pricing"];
  /** várias peças (fluxos e preços próprios), combo e tela de escolha */
  pieces?: LeadData["pieces"];
  combo?: LeadData["combo"];
  picker?: LeadData["picker"];
  /** substitui a experiência padrão por uma página totalmente customizada */
  Page?: ComponentType<{ lead: LeadData }>;
}

/** Só o essencial é obrigatório; o resto herda defaults premium. */
export function defineLead(i: LeadInput): Lead {
  const copy = { ...defaultCopy(i.name), ...i.copy };
  return {
    slug: i.slug,
    name: i.name,
    person: i.person,
    logo: i.logo,
    tools: i.tools,
    theme: { ...defaultTheme, ...i.theme },
    copy,
    pricing: i.pricing,
    pieces: i.pieces,
    combo: i.combo,
    picker: i.picker,
    meta: {
      title: i.meta?.title ?? `${i.name} · Unboxing`,
      description: i.meta?.description ?? "Abra a caixa. Leva menos de um minuto.",
    },
    links: { site: "https://empresas.camu3d.com.br", ...i.links },
    Page: i.Page,
  };
}
