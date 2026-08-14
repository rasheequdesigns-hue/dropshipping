"use client";

import { useState, useEffect } from "react";
import { X, Zap, Copy, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DEFAULT_SETTINGS } from "@/lib/supabase";
import type { StoreSettings } from "@/lib/supabase";

const CLOSED_KEY = "peadia_promo_closed_v2";
const NG = "#00E676";

export function PromoPopup() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [visible,  setVisible]  = useState(false);
  const [mounted,  setMounted]  = useState(false);
  const [copied,   setCopied]   = useState(false);

  // Step 1 — mark mounted (client only)
  useEffect(() => { setMounted(true); }, []);

  // Step 2 — load settings directly from Supabase (no cache dependency)
  useEffect(() => {
    if (!mounted) return;
    async function load() {
      try {
        const { data } = await supabase.from("store_settings").select("*").eq("id", 1).single();
        setSettings(data ? ({ ...DEFAULT_SETTINGS, ...data } as StoreSettings) : DEFAULT_SETTINGS);
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
    }
    load();
  }, [mounted]);

  // Step 3 — show popup after settings load (if not dismissed this session)
  useEffect(() => {
    if (!settings) return;
    if (!settings.is_announcement_active) return;
    const closed = sessionStorage.getItem(CLOSED_KEY);
    if (closed) return;
    const t = setTimeout(() => setVisible(true), 1400);
    return () => clearTimeout(t);
  }, [settings]);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(CLOSED_KEY, "1");
  };

  const copyCode = async () => {
    if (!settings?.promo_code) return;
    try { await navigator.clipboard.writeText(settings.promo_code); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Don't render anything server-side or before settings load
  if (!mounted || !settings || !settings.is_announcement_active || !visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 80,
        right: 14,
        zIndex: 400,
        width: "min(320px, calc(100vw - 28px))",
        animation: "slideInRight .35s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <div style={{
        background: "rgba(10,28,20,0.97)",
        border: "1px solid rgba(0,230,118,0.38)",
        borderRadius: 16,
        padding: "18px 18px 20px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 0 60px rgba(0,230,118,0.08)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Glow orb */}
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 130, height: 130, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,230,118,0.14), transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Top neon line */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${NG},transparent)`, opacity: 0.7 }} />

        {/* Close */}
        <button onClick={dismiss}
          style={{
            position: "absolute", top: 11, right: 11,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 7, width: 28, height: 28, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(255,255,255,0.45)", transition: "all 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget.style.color = "#FF465A"); (e.currentTarget.style.borderColor = "rgba(255,70,90,0.3)"); }}
          onMouseLeave={e => { (e.currentTarget.style.color = "rgba(255,255,255,0.45)"); (e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)"); }}
          aria-label="Close"
        >
          <X style={{ width: 14, height: 14 }} />
        </button>

        {/* Icon + label */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 11, paddingRight: 28 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: "rgba(0,230,118,0.14)", border: "1px solid rgba(0,230,118,0.30)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Zap style={{ width: 16, height: 16, color: NG, fill: NG }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 800, color: NG }}>Special Offer 🎉</p>
        </div>

        {/* Message */}
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.82)", lineHeight: 1.65, marginBottom: 15 }}>
          {settings.announcement_text}
        </p>

        {/* Promo code copy */}
        {settings.promo_code && (
          <button onClick={copyCode}
            style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              background: "rgba(0,230,118,0.08)",
              border: "1.5px dashed rgba(0,230,118,0.35)",
              borderRadius: 10, padding: "10px 14px", cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget.style.background = "rgba(0,230,118,0.14)"); }}
            onMouseLeave={e => { (e.currentTarget.style.background = "rgba(0,230,118,0.08)"); }}
          >
            <span style={{ flex: 1, fontSize: 18, fontWeight: 900, color: NG, letterSpacing: "2.5px", textAlign: "left" }}>
              {settings.promo_code}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
              {copied
                ? <Check style={{ width: 14, height: 14, color: NG }} />
                : <Copy style={{ width: 13, height: 13, color: "rgba(255,255,255,0.40)" }} />}
              <span style={{ fontSize: 11, fontWeight: 700, color: copied ? NG : "rgba(255,255,255,0.40)" }}>
                {copied ? "Copied!" : "Tap to copy"}
              </span>
            </div>
          </button>
        )}

        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 10, textAlign: "center" }}>
          Paste code at checkout · Valid on all orders
        </p>
      </div>
    </div>
  );
}
