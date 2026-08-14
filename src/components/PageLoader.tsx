"use client";

import { useEffect, useState } from "react";

export function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Start fade-out after a short delay
    const fadeTimer = setTimeout(() => setFading(true), 900);
    const hideTimer = setTimeout(() => setVisible(false), 1200);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#0D1117",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20,
        opacity: fading ? 0 : 1,
        transition: "opacity 0.3s cubic-bezier(0.4,0,0.2,1)",
        pointerEvents: fading ? "none" : "all",
      }}
    >
      {/* Shopping bag SVG with stroke fill animation */}
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bag-grad" x1="0" y1="72" x2="0" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00E676" />
            <stop offset="100%" stopColor="#00FF88" />
          </linearGradient>
        </defs>

        {/* Bag body outline */}
        <path
          d="M14 28h44l-5 32H19L14 28z"
          stroke="rgba(0,230,118,0.18)" strokeWidth="2.5" fill="none"
        />
        {/* Bag handle outline */}
        <path
          d="M24 28c0-6.627 5.373-12 12-12s12 5.373 12 12"
          stroke="rgba(0,230,118,0.18)" strokeWidth="2.5" fill="none" strokeLinecap="round"
        />

        {/* Animated fill — bag body */}
        <path
          className="bag-fill-body"
          d="M14 28h44l-5 32H19L14 28z"
          stroke="url(#bag-grad)" strokeWidth="2.5" fill="none"
          strokeDasharray="160" strokeDashoffset="160"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ animation: "bagFill 0.85s cubic-bezier(0.4,0,0.2,1) 0.05s forwards" }}
        />
        {/* Animated fill — bag handle */}
        <path
          className="bag-fill-handle"
          d="M24 28c0-6.627 5.373-12 12-12s12 5.373 12 12"
          stroke="url(#bag-grad)" strokeWidth="2.5" fill="none"
          strokeDasharray="80" strokeDashoffset="80"
          strokeLinecap="round"
          style={{ animation: "bagFill 0.6s cubic-bezier(0.4,0,0.2,1) 0.45s forwards" }}
        />

        {/* Stars / sparkles */}
        <circle cx="36" cy="48" r="2.5" fill="rgba(0,230,118,0.5)"
          style={{ animation: "sparkle 1s ease-in-out 0.7s infinite alternate" }} />
      </svg>

      {/* Brand name */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <span style={{
          fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "0.04em",
          animation: "fadeUp 0.5s ease 0.3s both",
        }}>
          peadia.in
        </span>
        {/* Progress bar */}
        <div style={{ width: 80, height: 2, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%", background: "linear-gradient(90deg, #00E676, #00FF88)",
            borderRadius: 99,
            animation: "progressBar 0.9s cubic-bezier(0.4,0,0.2,1) forwards",
          }} />
        </div>
      </div>

      <style>{`
        @keyframes bagFill {
          to { stroke-dashoffset: 0; }
        }
        @keyframes sparkle {
          from { opacity: 0.2; transform: scale(0.7); }
          to   { opacity: 1;   transform: scale(1.3); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes progressBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}
