import { getLead } from "@/leads";
import { record, clip } from "@/lib/store";

/** Pedido da peça física: só nome e endereço. */
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const slug = clip(b?.slug, 60), name = clip(b?.name, 120).trim(), address = clip(b?.address, 400).trim();
  if (!getLead(slug) || !name || !address) return Response.json({ ok: false }, { status: 400 });
  await record("requests", { slug, name, address });
  return Response.json({ ok: true });
}
