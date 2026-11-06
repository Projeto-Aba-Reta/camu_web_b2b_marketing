# Zazos — Análise da tela de preços e sugestões

Nov 6, 2026 · @felipe

Análise do painel direito da página do Zazos (card `.reveal .card.glass`). Ele mede **440×1050px** num viewport de 966px de altura — ou seja, já nasce maior que a tela e obriga scroll interno, o que é exatamente a sensação de "popup muito vertical". O conteúdo empilhado é: título → texto → bullets "como será lembrada" → citação de case → toggle de preço → contador Black November → tabela de preços → disclaimer → 2 CTAs → rodapé.

**Problema central:** são dois tipos de conteúdo diferentes espremidos num único bloco — *storytelling/posicionamento* (por que a Zazos existe, como fica na mesa do cliente) e *decisão de compra* (preço, modalidade, urgência, CTA). Misturar os dois faz quem já quer comprar rolar por texto institucional, e quem ainda está entendendo o produto cair direto em tabela de preço.

## Proposta: dividir em 2 etapas

**Etapa 1 — Narrativa/posicionamento**

- Título "Quatro ferramentas, um sistema"
- Texto de contexto
- Bullets "Como a Zazos será lembrada"
- Citação do case B2B
- CTA de avanço: algo como "Ver preços →" (troca o "Quero a peça física" por um botão que leva à etapa 2)

**Etapa 2 — Decisão de compra**

- Toggle Em lote / Sob demanda
- Contador Black November
- Tabela de preços
- Disclaimer de personalização
- Os 2 CTAs finais (Quero a peça física / Conversar 15 minutos)
- Um link "← Voltar" para quem quiser reler a narrativa

Isso reduz cada etapa a \~500-550px de altura, cabendo sem scroll na maioria das telas, e cria um funil mais claro: primeiro convence, depois vende.

## Outras melhorias

- **Contador duplicado com a tabela**: o "Black November" já indica desconto; os preços já mostram o valor riscado e "-20%" em cada linha — isso é reforço redundante em pouco espaço. Dá pra simplificar o card do contador (só o timer, sem repetir "desconto por tempo limitado" em texto longo).
- **Citação do case** está sem aspas/autor visível, parece só mais um parágrafo — vale destacá-la visualmente como depoimento (aspas, itálico, ou nome/empresa do cliente) para não ler como continuação do texto institucional.
- **Dois CTAs empilhados** ("Quero a peça física" e "Conversar 15 minutos") competem por atenção — considerar deixar o botão secundário como link de texto, ou só mostrá-lo na etapa 2 (quem já viu preço e ainda tem dúvida).
- **Toggle "Em lote / Sob demanda"** muda a tabela inteira (de 4 faixas de preço para 1 linha "1+ peças"); como a diferença de formato é grande, uma transição mais suave ajudaria deixar claro que é outro "modo", não outro produto.
