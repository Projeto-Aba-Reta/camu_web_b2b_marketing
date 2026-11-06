export type EventName = "open_link" | "box_open" | "reveal" | "request_piece" | "request_talk" | "submit_piece";

/** Contador por endereço: grava no servidor (data/events.jsonl) e no navegador. */
export function track(slug: string, event: EventName) {
  try {
    const k = `camu:${slug}:${event}`;
    localStorage.setItem(k, String((Number(localStorage.getItem(k)) || 0) + 1));
  } catch {}
  try {
    fetch("/api/event", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, event }),
    }).catch(() => {});
  } catch {}
}
