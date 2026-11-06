import { defineLead } from "@/lib/defineLead";

export default defineLead({
  slug: "__SLUG__",
  name: "__NAME__",
  // wordmark em 1 ou 2 linhas; ou use { svg: "/leads/__SLUG__/logo.svg" }
  logo: { top: "__NAME__", bottom: "", bolt: false },
  // 4 ferramentas/conceitos que o produto do lead "consolida"
  tools: [
    { label: "Planilha", icon: "sheet", color: "#D9593D" },
    { label: "Chat", icon: "chat", color: "#E9B23A" },
    { label: "Relatório", icon: "chart", color: "#2F8F83" },
    { label: "E-mail", icon: "mail", color: "#5B4B9A" },
  ],
  // theme: { bg: "#0E0C0A", accent: "#FFD25A", glow: "#FFB347" },
  // copy: { title: "...", headline: "...", body: "...", caseStudy: "..." },
  // links: { agenda: "https://..." },
  // Preço por peça / atacado na tela final (feature flag: show)
  // pricing: { show: false, tiers: [{ min: 1, max: 9, price: 0 }, { min: 10, price: 0 }], note: "..." },
  // Page: MinhaPaginaCustomizada, // opcional: controle total
});
