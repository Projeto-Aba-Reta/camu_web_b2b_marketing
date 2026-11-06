# Camu · Unboxing virtual (multi-lead)

Next.js 16 + React Three Fiber. Cada lead B2B tem o seu endereço `/p/<slug>`, com 3D, cores, textos e
logo próprios, no mesmo projeto. As páginas são o que o lead recebe: o texto fala com ele, sem
"fiz isso para você" ou o nome da Camu como remetente.

```bash
npm install
npm run dev                        # http://localhost:3000/p/zazos
npm run new-lead -- acme "Acme"    # cria src/leads/acme e registra
npm run stats                      # funil por lead (data/events.jsonl)
npm run build && npm start
```

## Como criar um lead novo (≈ 10 min)
1. `npm run new-lead -- <slug> "<Nome>"`
2. Edite `src/leads/<slug>/index.ts`: logo (texto ou SVG em `public/leads/<slug>/`), 4 ferramentas
   (ícone + cor), e opcionalmente `theme`, `copy`, `links.agenda`.
3. Abra `/p/<slug>`. A pré-visualização do link (`opengraph-image`) é gerada sozinha.

Só `slug`, `name`, `logo` e `tools` são obrigatórios; o resto herda defaults (`src/lib/defineLead.ts`).

## Níveis de customização
| Nível | Como |
|---|---|
| Marca e texto | `theme`, `copy`, `tools`, `logo` no arquivo do lead |
| Ícones | `sheet clock calendar folder chart chat mail code users card` (novos em `components/Unboxing/textures.ts`) |
| Página própria | `Page: MeuComponente` no lead: substitui a experiência inteira (pode reusar `Experience`) |

## Lead com várias peças (ex.: `gct`)
Com `pieces` no lead, `/p/<slug>` abre uma tela de escolha e cada peça roda o seu fluxo (`kind`):
- `assemble`: caixa 3D, arrastar 4 blocos (`tools`) para os encaixes.
- `light`: caixa → cartão → arrastar a luz → agenda se preenche (`light`).

Cada peça tem o seu `pricing` (em lote + sob demanda); `combo` adiciona a aba de combo. Flag `show` em cada um;
`?pricing=1` força a tabela (inclusive em produção) e, em dev, `?piece=<id>&step=play|done` pula etapas. Exemplo: `src/leads/gct/index.ts`.

## Dados
- `POST /api/event` → `data/events.jsonl` (`open_link, box_open, reveal, request_piece, submit_piece, request_talk`)
- `POST /api/request` → `data/requests.jsonl` (nome e endereço do pedido da peça)
- `CAMU_WEBHOOK_URL` (opcional) recebe os mesmos payloads (Zapier/n8n/Make/CRM). Em hospedagem sem
  disco gravável (ex.: Vercel) o webhook é obrigatório para não perder dados.
- `NEXT_PUBLIC_SITE_URL` define o domínio das imagens de pré-visualização.

Em desenvolvimento, `?step=play` e `?step=done` pulam para cada etapa.
`legacy/` guarda a versão estática anterior (HTML puro).
