import { ImageResponse } from "next/og";

export const alt = "ExpertCTX: the expert in the room, on every page";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #1b2440 0%, #26336b 55%, #4a2f8f 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill="#4b63e0" />
            <path d="M16 6.5a9.5 9.5 0 0 1 9.5 9.5" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M16 25.5A9.5 9.5 0 0 1 6.5 16" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="16" cy="16" r="4.3" fill="#fff" />
          </svg>
          <div style={{ fontSize: 40, display: "flex", fontWeight: 700 }}>
            Expert<span style={{ color: "#9fb0ff" }}>CTX</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, lineHeight: 1.04, maxWidth: 900, fontWeight: 700, letterSpacing: -2 }}>The expert in the room, on every page.</div>
          <div style={{ fontSize: 30, color: "rgba(255,255,255,0.72)", maxWidth: 900 }}>
            Frameworks, rules and playbooks from real experts, applied to your team&apos;s Confluence pages through Rovo.
          </div>
        </div>
        <div style={{ display: "flex", gap: 28, fontSize: 24, color: "rgba(255,255,255,0.7)" }}>
          {[
            ["#3fb8b0", "Team"],
            ["#f0b44c", "Goal"],
            ["#a06cf0", "Expert"],
          ].map(([color, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 14, height: 14, borderRadius: 7, background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
