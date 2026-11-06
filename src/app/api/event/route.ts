import { getLead } from "@/leads";
import { record, clip } from "@/lib/store";

const EVENTS = new Set(["open_link", "box_open", "reveal", "request_piece", "request_talk", "submit_piece", "pick_piece", "light_on"]);

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const slug = clip(b?.slug, 60), event = clip(b?.event, 40);
  if (!getLead(slug) || !EVENTS.has(event)) return Response.json({ ok: false }, { status: 400 });
  await record("events", { slug, event, piece: clip(b?.piece, 40) || undefined, ua: clip(req.headers.get("user-agent"), 160) });
  return Response.json({ ok: true });
}
