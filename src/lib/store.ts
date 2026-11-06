import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * Grava uma linha JSON em data/<file>.jsonl e, se CAMU_WEBHOOK_URL existir,
 * encaminha o mesmo payload (Zapier, n8n, Make, planilha, CRM...).
 * Em hospedagem sem disco gravável, o webhook é o caminho confiável.
 */
export async function record(file: "events" | "requests", payload: Record<string, unknown>) {
  const row = { ...payload, t: new Date().toISOString() };
  try {
    const dir = path.join(process.cwd(), "data");
    await mkdir(dir, { recursive: true });
    await appendFile(path.join(dir, `${file}.jsonl`), JSON.stringify(row) + "\n");
  } catch {
    console.log(`[camu:${file}]`, JSON.stringify(row));
  }
  const hook = process.env.CAMU_WEBHOOK_URL;
  if (hook) {
    fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: file, ...row }),
    }).catch(() => {});
  }
}

export const clip = (v: unknown, n: number) => String(v ?? "").slice(0, n);
