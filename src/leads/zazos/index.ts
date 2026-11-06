import { defineLead } from "@/lib/defineLead";

/** Zazos (Zaz OS) — camada 2, sequência LinkedIn. Contato: Murilo Narciso. */
export default defineLead({
  slug: "zazos",
  name: "Zazos",
  person: "Murilo",
  // Provisório: trocar pelo SVG da Zazos (public/leads/zazos/logo.svg) e usar { svg: "/leads/zazos/logo.svg" }
  logo: { top: "zaz", bottom: "os", bolt: true },
  tools: [
    { label: "Planilha", icon: "sheet", color: "#D9593D",
      represents: "Os números que viviam espalhados agora têm um só lugar.",
      meaning: "Os dados da empresa espalhados em planilhas soltas. Na Zazos viram um só painel, sempre atualizado." },
    { label: "Ponto", icon: "clock", color: "#E9B23A",
      represents: "O tempo da equipe deixa de ser um palpite.",
      meaning: "O controle de horas da equipe, que costuma viver em outro app. Na Zazos fica junto do resto da operação." },
    { label: "Calendário", icon: "calendar", color: "#2F8F83",
      represents: "Cada prazo no mesmo fio do tempo.",
      meaning: "Prazos, reuniões e entregas em agendas separadas. Na Zazos tudo aparece numa linha do tempo só." },
    { label: "Pasta", icon: "folder", color: "#5B4B9A",
      represents: "O que a equipe produz fica junto de quem usa.",
      meaning: "Arquivos e documentos perdidos em pastas e drives. Na Zazos ficam ligados ao trabalho que os usa." },
  ],
  theme: { glow: "#FFB347", accent: "#FFD25A" },
  copy: {
    eyebrow: "A dor",
    title: "Cinco abas abertas. Nenhuma resposta.",
    why: "Software some numa aba. Uma peça física fica na mesa, na mão, na memória. Por isso a Zazos vem numa caixa.",
    hintClosed: "Toque na caixa para abrir",
    boxLine: "Quatro peças soltas, como a operação de hoje. Vamos juntá-las.",
    hintPlay: "Arraste cada bloco para o encaixe da cor dele",
    headline: "Quatro ferramentas, um sistema.",
    body: "Montada, a peça é a Zazos: tudo o que importa na operação, encaixado num só lugar.",
    legacyTitle: "Como a Zazos será lembrada",
    legacy: [
      "Na mesa do cliente, a peça lembra todo dia que a bagunça acabou.",
      "Quem passa pela mesa pergunta o que é, e o cliente conta a história da Zazos por você.",
      "A marca deixa de ser uma aba esquecida e vira um objeto que fica.",
    ],
  },
  // Flag de preço: mude `show` para true quando os valores abaixo forem os reais.
  // Valores PROVISÓRIOS (placeholders). Em dev, /p/zazos?pricing=1 força a exibição.
  pricing: {
    show: false,
    tiers: [
      { min: 1, max: 9, was: 120, price: 96 },
      { min: 10, max: 49, was: 95, price: 76 },
      { min: 50, max: 99, was: 80, price: 64 },
      { min: 100, was: 65, price: 52 },
    ],
    promo: { label: "Black November", reason: "Desconto de novembro, por tempo limitado.", endsAt: "2026-11-30T23:59:59-03:00" },
    // sem estoque: a cada novo cliente do lead, 1 peça é comprada e enviada
    onDemand: {
      label: "Sob demanda",
      description: "Sem estoque: a cada novo cliente seu, compramos 1 peça e enviamos.",
      tiers: [{ min: 1, was: 140, price: 112 }],
    },
    note: "Preço por peça, personalizada com a sua marca.",
  },
  meta: { title: "Zazos · Unboxing", description: "Abra a caixa. Leva menos de um minuto." },
  links: {
    // agenda: "https://cal.com/camu/15min",
  },
});
