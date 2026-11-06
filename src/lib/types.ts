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
  /** unidade vendida (padrão: "peça"); ex.: "combo" */
  unit?: string;
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

export type PieceKind = "assemble" | "light";

/** Peça "acenda": negatoscópio com calendário que se preenche (fluxo `kind: "light"`). */
export interface LightConfig {
  /** título gravado na chapa */
  title: string;
  /** nome do mês na chapa */
  month: string;
  /** dia da semana do dia 1 (0 = domingo) */
  startDay: number;
  /** dias do mês */
  days: number;
  /** dias úteis que ficam livres (a "vaga") */
  free: number[];
  /** texto do clipe no topo */
  clip: string;
  /** cartão que chega na caixa: uma palavra só */
  card: string;
  /** frente do cartão após acender (o que a agenda mostra) */
  litLine: string;
  /** verso do cartão: fecha a ideia */
  cardBack: string;
  /** dica antes de acender */
  emptyLine: string;
  hintLight: string;
  /** botão que leva à tela final */
  next: string;
}

/** Uma das peças oferecidas ao lead. Cada uma tem o seu fluxo de unboxing e a sua tabela de preço. */
export interface Piece {
  id: string;
  name: string;
  /** nome curto (abas de preço); padrão: name */
  short?: string;
  /** "assemble": arrastar 4 blocos para os encaixes · "light": abrir, acender, ver a agenda encher */
  kind: PieceKind;
  /** frase no cartão da tela de escolha */
  teaser: string;
  /** (assemble) os 4 blocos */
  tools?: [Tool, Tool, Tool, Tool];
  /** (light) conteúdo da peça */
  light?: LightConfig;
  /** textos que sobrescrevem os do lead nesta peça */
  copy?: Partial<Copy>;
  pricing: Pricing;
}

/** Compra das duas (ou mais) peças juntas, com tabela própria. */
export interface Combo {
  label: string;
  /** o que vem no combo */
  description: string;
  pricing: Pricing;
}

/** Tela de escolha entre as peças. */
export interface Picker {
  eyebrow: string;
  title: string;
  body: string;
  hint: string;
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
  /** (opcional) várias peças, cada uma com seu fluxo e preço; troca a experiência por uma tela de escolha */
  pieces?: Piece[];
  combo?: Combo;
  picker?: Picker;
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
