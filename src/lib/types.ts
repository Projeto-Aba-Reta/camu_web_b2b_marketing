import type { ComponentType } from "react";

export type Stage = "closed" | "opening" | "play" | "done";

export type ToolIcon =
  | "sheet" | "clock" | "calendar" | "folder" | "chart"
  | "chat" | "mail" | "code" | "users" | "card";

export interface Tool {
  label: string;
  icon: ToolIcon;
  /** cor do bloco 3D (e do encaixe correspondente) */
  color: string;
  /** popup ao passar o mouse: o que a ferramenta resolve e por que ela faz parte do sistema */
  meaning?: string;
  /** frase mostrada ao encaixar a peça: o que ela representa na marca */
  represents?: string;
}

export interface Theme {
  /** fundo da página */
  bg: string;
  /** brilho radial atrás da cena (normalmente a cor de destaque) */
  glow: string;
  ink: string;
  muted: string;
  /** painéis de vidro (card, formulário) */
  surface: string;
  line: string;
  accent: string;
  /** texto sobre o botão de destaque */
  onAccent: string;
  /** cor do raio / detalhes da logo */
  bolt: string;
  /** relevo da logo nos blocos */
  cream: string;
  box: string;
  lid: string;
  tray: string;
}

export interface Copy {
  eyebrow: string;
  title: string;
  /** (opcional) tela fechada: por que uma experiência física */
  why?: string;
  /** (opcional) durante a abertura: a caixa */
  boxLine?: string;
  /** botão que encerra a abertura e libera a montagem (padrão: "Continuar") */
  ctaContinue?: string;
  /** (opcional) revelação: como a marca será lembrada/eternizada */
  legacyTitle?: string;
  legacy?: string[];
  hintClosed: string;
  hintPlay: string;
  hintWrong: string;
  headline: string;
  body: string;
  caseStudy: string;
  ctaPiece: string;
  ctaTalk: string;
  formTitle: string;
  formName: string;
  formAddress: string;
  formSend: string;
  formNote: string;
  thanks: string;
  agendaMissing: string;
}

export interface LeadLogo {
  /** linha de cima do wordmark */
  top: string;
  /** linha de baixo (deixe "" para uma linha só) */
  bottom: string;
  /** desenha o raio cruzando os 4 blocos (padrão: true) */
  bolt?: boolean;
  /** logo em SVG/PNG em /public (substitui o wordmark de texto) */
  svg?: string;
}

export interface PriceTier {
  /** quantidade mínima da faixa (inclusive) */
  min: number;
  /** quantidade máxima (inclusive); omita na última faixa ("a partir de") */
  max?: number;
  /** preço por peça nesta faixa, em reais (já com desconto, se houver promo) */
  price: number;
  /** preço "de": riscado enquanto a promo estiver no ar */
  was?: number;
}

export interface Promo {
  /** nome da campanha, ex.: "Black November" */
  label: string;
  /** fim da promo (ISO, ex.: "2026-11-30T23:59:59-03:00"); depois volta ao preço `was` */
  endsAt: string;
  /** (opcional) por que há desconto */
  reason?: string;
}

export interface OnDemand {
  /** rótulo da aba (padrão: "Sob demanda") */
  label?: string;
  /** explicação: sem estoque, compra 1 peça a cada novo cliente */
  description?: string;
  tiers: PriceTier[];
}

export interface Pricing {
  /** feature flag do lead: false esconde a tabela na tela final */
  show: boolean;
  /** faixas de atacado, da menor para a maior quantidade */
  tiers: PriceTier[];
  /** título do bloco (padrão: "Preço por peça") */
  title?: string;
  /** observação abaixo da tabela (ex.: prazo, frete) */
  note?: string;
  /** campanha com desconto animado (preço antigo riscado) e timer */
  promo?: Promo;
  /** (opcional) modelo sem estoque: 1 peça comprada a cada novo cliente, com outros valores */
  onDemand?: OnDemand;
}

/** Dados serializáveis de um lead (vão do servidor para o cliente). */
export interface LeadData {
  slug: string;
  name: string;
  person?: string;
  meta: { title: string; description: string };
  logo: LeadLogo;
  theme: Theme;
  tools: [Tool, Tool, Tool, Tool];
  copy: Copy;
  /** (opcional) preço por peça e faixas de atacado na tela final; controlado por `pricing.show` */
  pricing?: Pricing;
  /** agenda: link do botão "Conversar"; site: link da Camu no rodapé */
  links: { agenda?: string; site?: string };
}

/**
 * Lead completo. `Page` é opcional: se existir, substitui a experiência
 * padrão e dá controle total da página daquele lead.
 */
export interface Lead extends LeadData {
  Page?: ComponentType<{ lead: LeadData }>;
}
