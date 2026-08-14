"use client";

import { useSettings } from "@/lib/settings";
import { X, Zap } from "lucide-react";
import { useState } from "react";

export function AnnouncementBar() {
  const s = useSettings();
  const [dismissed, setDismissed] = useState(false);
  if (!s.is_announcement_active || dismissed) return null;

  const parts = s.promo_code ? s.announcement_text.split(s.promo_code) : [s.announcement_text];

  return (
    <div style={{
      background: "#0A2418",
      borderBottom: "1px solid rgba(0,230,118,0.20)",
      padding: "7px 44px",
      textAlign: "center",
      position: "relative",
    }}>
      <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, flexWrap: "wrap" }}>
        <Zap style={{ width: 12, height: 12, color: "#00E676", fill: "#00E676", flexShrink: 0 }} />
        {parts.map((part, i) => (
          <span key={i}>
            <span>{part}</span>
            {i < parts.length - 1 && s.promo_code && (
              <span style={{ fontWeight: 900, color: "#00E676", background: "rgba(0,230,118,0.10)", border: "1px solid rgba(0,230,118,0.25)", padding: "1px 7px", borderRadius: 4, margin: "0 3px" }}>
                {s.promo_code}
              </span>
            )}
          </span>
        ))}
      </p>
      <button onClick={() => setDismissed(true)}
        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", display: "flex" }}>
        <X style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );
}
