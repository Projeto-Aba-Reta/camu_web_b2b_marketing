// uso: npm run stats  → funil por lead a partir de data/events.jsonl
import { readFileSync, existsSync } from "node:fs";

const f = "data/events.jsonl";
if (!existsSync(f)) { console.log("sem eventos ainda."); process.exit(0); }

const order = ["open_link", "box_open", "reveal", "request_piece", "submit_piece", "request_talk"];
const by = {};
for (const line of readFileSync(f, "utf8").split("\n").filter(Boolean)) {
  const { slug, event } = JSON.parse(line);
  ((by[slug] ??= {})[event] ??= 0), by[slug][event]++;
}
console.table(Object.fromEntries(Object.entries(by).map(([s, e]) => [s, Object.fromEntries(order.map((k) => [k, e[k] ?? 0]))])));
