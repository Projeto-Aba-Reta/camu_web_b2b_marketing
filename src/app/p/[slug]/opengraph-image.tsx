import { ImageResponse } from "next/og";
import { getLead } from "@/leads";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Pré-visualização do link (LinkedIn/WhatsApp): caixa fechada com a logo do lead. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const lead = getLead((await params).slug);
  const t = lead?.theme;
  const bg = t?.bg ?? "#0E0C0A";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 90px", color: t?.ink ?? "#F6EBD3",
          background: `radial-gradient(circle at 72% 48%, ${t?.glow ?? "#FFB347"}55, ${bg} 62%)`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 560 }}>
          <div style={{ fontSize: 26, letterSpacing: 6, color: t?.accent, textTransform: "uppercase" }}>camu</div>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, marginTop: 22 }}>
            {lead?.copy.title ?? "Unboxing"}
          </div>
          <div style={{ fontSize: 28, marginTop: 24, color: t?.muted }}>Abra a caixa. Leva menos de um minuto.</div>
        </div>
        <div
          style={{
            width: 380, height: 380, borderRadius: 34, background: t?.lid ?? "#C49A68", display: "flex",
            alignItems: "center", justifyContent: "center", boxShadow: "0 40px 90px rgba(0,0,0,.55)",
            flexDirection: "column", color: t?.cream ?? "#F6EBD3", fontSize: 120, fontWeight: 800, lineHeight: 1,
          }}
        >
          <div>{lead?.logo.top ?? ""}</div>
          <div>{lead?.logo.bottom ?? ""}</div>
        </div>
      </div>
    ),
    size,
  );
}
