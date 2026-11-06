import { defineLead } from "@/lib/defineLead";
import type { Piece, Pricing, Tool } from "@/lib/types";

/**
 * Grupo GCT — duas peças, dois fluxos de unboxing:
 *  - A Roda (assemble): 4 setores do Método RODA encaixados em volta do centro.
 *  - Raio-X da Agenda (light): negatoscópio que acende e enche a agenda.
 * Contato: Matheus. Fonte: docs/Peças para o Grupo GCT a Roda e o Raio-X da Agenda.pdf
 *
 * Regra de comunicação (CFM/OAB): nenhum texto mostra número de resultado ou promete resultado.
 * Dados de clientes da GCT só entram com autorização.
 */

// Flag de preço: mude para true quando os valores abaixo forem os reais.
// PROVISÓRIO: âncoras do PDF (lote de 20: Roda R$100, Raio-X ~R$180, custos [ESTIMATIVA]); o resto é placeholder.
// /p/gct?pricing=1 força a exibição (dev e produção).
const SHOW_PRICING = false;

const roda: Tool[] = [
  { label: "Atração", icon: "users", color: "#2BA08F",
    represents: "Quem ainda não conhece o cliente passa a enxergá-lo.",
    meaning: "O primeiro pilar do Método RODA: fazer o cliente ser encontrado por quem ainda não o conhece." },
  { label: "Distribuição", icon: "mail", color: "#C96A4B",
    represents: "A mensagem certa chega pelo canal certo.",
    meaning: "O segundo pilar: levar a proposta do cliente até as pessoas, pelos canais onde elas estão." },
  { label: "Vendas", icon: "chart", color: "#F4C04E",
    represents: "O interesse vira conversa, e a conversa vira agenda.",
    meaning: "O terceiro pilar: transformar o interesse em atendimento marcado, com processo e não com sorte." },
  { label: "Retenção", icon: "calendar", color: "#9BAE8C",
    represents: "Quem já é cliente continua voltando.",
    meaning: "O quarto pilar: manter o relacionamento vivo depois do primeiro atendimento." },
];

const rodaPricing: Pricing = {
  show: SHOW_PRICING,
  title: "Preço por Roda",
  tiers: [
    { min: 1, max: 9, price: 125 },
    { min: 10, max: 19, price: 110 },
    { min: 20, price: 100 },
  ],
  onDemand: {
    label: "Sob demanda",
    description: "Sem estoque: a cada novo cliente seu, compramos 1 Roda e enviamos.",
    tiers: [{ min: 1, price: 140 }],
  },
  note: "Preço por peça, com o nome ou a logo do cliente no centro.",
};

const raioxPricing: Pricing = {
  show: SHOW_PRICING,
  title: "Preço por Raio-X",
  tiers: [
    { min: 1, max: 9, price: 230 },
    { min: 10, max: 19, price: 200 },
    { min: 20, price: 180 },
  ],
  onDemand: {
    label: "Sob demanda",
    description: "Sem estoque: a cada novo cliente seu, compramos 1 Raio-X e enviamos.",
    tiers: [{ min: 1, price: 250 }],
  },
  note: "Preço por peça, com título, mês e clipe personalizados. Chapa do mês seguinte à parte.",
};

const pieces: Piece[] = [
  {
    id: "roda",
    name: "A Roda",
    kind: "assemble",
    teaser: "Quatro pilares do Método RODA, com o nome do cliente no centro.",
    tools: roda as Piece["tools"],
    copy: {
      eyebrow: "A Roda",
      title: "Quatro pilares soltos. Um método.",
      why: "Um método que só existe em apresentação some depois da reunião. Na mesa, ele fica à vista.",
      boxLine: "Quatro pilares fora do lugar. Vamos encaixar cada um no seu.",
      hintPlay: "Arraste cada pilar para o encaixe da cor dele",
      headline: "Quatro pilares, um método.",
      body: "Montada, a Roda é o Método RODA da GCT em cima da mesa do cliente, com o nome dele no meio.",
      legacyTitle: "Como a Roda será lembrada",
      legacy: [
        "Na mesa do cliente, o método deixa de ser um slide e vira um objeto.",
        "Quem passa pela mesa pergunta o que é, e o cliente explica o Método RODA por você.",
        "O nome dele no centro mostra que o método foi feito para ele.",
      ],
      caseStudy: "",
    },
    pricing: rodaPricing,
  },
  {
    id: "raiox",
    name: "Raio-X da Agenda",
    short: "Raio-X",
    kind: "light",
    teaser: "Um mini negatoscópio: acende a luz e a agenda aparece.",
    light: {
      title: "AGENDA",
      month: "NOVEMBRO",
      startDay: 0, // 1º de novembro de 2026 cai num domingo
      days: 30,
      free: [27],
      clip: "GCT",
      card: "Acenda.",
      emptyLine: "Novembro, vazio. De frente, ele ainda não mostra nada.",
      litLine: "Horários em todos os dias úteis. E uma única vaga.",
      cardBack: "É isso que a GCT enxerga antes de todo mundo.",
      hintLight: "Arraste para acender",
      next: "Continuar",
    },
    copy: {
      eyebrow: "Raio-X da Agenda",
      title: "Uma caixa. Uma palavra.",
      why: "Diagnóstico é o que a GCT faz. Por isso a peça é uma caixa de luz, e não um folheto.",
      hintClosed: "Toque na caixa para abrir",
      boxLine: "Dentro, um cartão com uma palavra só.",
      hintPlay: "Arraste a luz até o fim",
      headline: "Enxergar o que ainda não aparece.",
      body: "Apagada, a agenda parece vazia. Acesa, mostra o que estava lá o tempo todo. É o trabalho da GCT, em forma de objeto.",
      legacyTitle: "Como o Raio-X será lembrado",
      legacy: [
        "Fica na mesa como luminária e calendário, à vista todo dia.",
        "Quem vê a luz acender quer saber de onde veio, e o cliente conta a história da GCT.",
        "A chapa sai pela fenda do topo: uma chapa nova por mês mantém a GCT presente.",
      ],
      caseStudy: "",
    },
    pricing: raioxPricing,
  },
];

export default defineLead({
  slug: "gct",
  name: "GCT",
  person: "Matheus",
  logo: { top: "GCT", bottom: "", bolt: false },
  tools: roda as [Tool, Tool, Tool, Tool],
  theme: { glow: "#E08A5F", accent: "#F4C04E", bolt: "#F4C04E" },
  copy: { caseStudy: "" },
  picker: {
    eyebrow: "Duas peças",
    title: "Duas caixas na mesa. Abra uma.",
    body: "Cada uma abre de um jeito. Dá para abrir as duas, na ordem que quiser.",
    hint: "Toque na caixa que quer abrir primeiro",
  },
  pieces,
  combo: {
    label: "Combo",
    description: "1 Roda + 1 Raio-X da Agenda por kit, com a marca do mesmo cliente.",
    pricing: {
      show: SHOW_PRICING,
      unit: "combo",
      title: "Preço por combo",
      tiers: [
        { min: 1, max: 9, price: 330 },
        { min: 10, max: 19, price: 290 },
        { min: 20, price: 260 },
      ],
      onDemand: {
        label: "Sob demanda",
        description: "Sem estoque: a cada novo cliente seu, compramos 1 combo e enviamos.",
        tiers: [{ min: 1, price: 360 }],
      },
      note: "Menos do que comprar as duas peças separadas.",
    },
  },
  meta: { title: "GCT · Unboxing", description: "Duas caixas. Abra uma. Leva menos de um minuto." },
  // Conversa de 15 min: Cal.com da Camu (src/lib/contact.ts). Pedido: WhatsApp da Camu com empresa + endereço (CEP via ViaCEP).
});
