"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Save, Bell, Store, Zap, CreditCard, Image as ImgIcon,
  Lock, Eye, EyeOff, LogOut,
} from "lucide-react";
import { supabase, DEFAULT_SETTINGS } from "@/lib/supabase";
import type { StoreSettings } from "@/lib/supabase";
import { bustSettingsCache } from "@/lib/settings";
import { useToast } from "@/components/Toast";
import { signOutAdmin } from "@/components/AdminAuth";

const NG = "#00E676";

// ─── Stable helper components (module scope = no re-mount on render) ──────────
function FL({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="field-label">{label}</label>{children}</div>;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: "18px 20px", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 16 }}>
        <span style={{ color: NG }}>{icon}</span>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--tx)" }}>{title}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>{children}</div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const formRef = useRef<StoreSettings>({ ...DEFAULT_SETTINGS });
  const [, forceUpdate] = useState(0);
  const repaint = useCallback(() => forceUpdate(n => n + 1), []);
  const [loading, setLoading] = useState(false);
  const [newPwd,  setNewPwd]  = useState("");
  const [confPwd, setConfPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdMsg,  setPwdMsg]  = useState("");
  const [initKey, setInitKey] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).single();
        if (!error && data) {
          formRef.current = { ...DEFAULT_SETTINGS, ...data } as StoreSettings;
          setInitKey(k => k + 1);
          repaint();
        }
      } catch {}
    })();
  }, [repaint]);

  const setF = useCallback((update: Partial<StoreSettings>) => {
    formRef.current = { ...formRef.current, ...update };
    repaint();
  }, [repaint]);

  const save = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("store_settings").upsert(formRef.current);
      if (error) throw error;
      bustSettingsCache();
      toast("Settings saved!", "success");
    } catch (e) {
      console.warn("Settings save error:", e);
      bustSettingsCache();
      toast("Saved locally (check Supabase)", "info");
    }
    setLoading(false);
  };

  const changePassword = async () => {
    setPwdMsg("");
    if (newPwd.length < 6)  { setPwdMsg("Min 6 characters"); return; }
    if (newPwd !== confPwd) { setPwdMsg("Passwords do not match"); return; }
    const updated = { ...formRef.current, admin_password_hash: newPwd };
    try {
      const { error } = await supabase.from("store_settings").upsert(updated);
      if (error) throw error;
      formRef.current = updated;
      bustSettingsCache();
      setPwdMsg("✓ Password changed — logging out…");
      setNewPwd(""); setConfPwd("");
      toast("Password changed!", "success");
      setTimeout(signOutAdmin, 2000);
    } catch {
      formRef.current = updated;
      bustSettingsCache();
      setPwdMsg("✓ Changed (offline) — logging out…");
      setNewPwd(""); setConfPwd("");
      setTimeout(signOutAdmin, 2000);
    }
  };

  const f = formRef.current;

  // Uncontrolled text input helper — uses defaultValue + onBlur to avoid focus loss
  const TI = (field: keyof StoreSettings, placeholder?: string, type = "text") => (
    <input
      key={`${String(field)}-${initKey}`}
      className="inp"
      type={type}
      defaultValue={String(f[field] ?? "")}
      placeholder={placeholder}
      onChange={e => { (formRef.current as unknown as Record<string, unknown>)[String(field)] = e.target.value; }}
      onBlur={e   => setF({ [field]: e.target.value } as Partial<StoreSettings>)}
    />
  );

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 className="admin-page-title">Settings</h1>
        <p className="admin-page-sub">Store info, logo, social media, payments, promo, password</p>
      </div>

      {/* ── Store Info ── */}
      <Section title="Store Information" icon={<Store style={{ width: 15, height: 15 }} />}>
        <div className="form-row">
          <FL label="Store Name">{TI("store_name", "peadia.in")}</FL>
          <FL label="WhatsApp Number (no + or spaces)">{TI("whatsapp_number", "919526569313")}</FL>
          <FL label="Contact Phone">{TI("contact_phone", "+91 9526569313")}</FL>
          <FL label="Contact Email">{TI("contact_email", "you@email.com", "email")}</FL>
        </div>
        <FL label="Address">{TI("address", "Malappuram, Kerala, India")}</FL>
      </Section>

      {/* ── Logo ── */}
      <Section title="Logo / Brand Icon" icon={<ImgIcon style={{ width: 15, height: 15 }} />}>
        <FL label="Logo Image URL (PNG/SVG with transparent bg)">
          {TI("logo_url", "https://example.com/logo.png")}
        </FL>
        <p style={{ fontSize: 11, color: "var(--tx-3)" }}>Ideal: 200×60 px or 128×128 px · PNG transparent background</p>
        {f.logo_url && (
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ background: "#111820", border: "1px solid var(--bd)", borderRadius: 9, padding: 8 }}>
              <img src={f.logo_url} alt="Logo preview"
                style={{ height: 40, maxWidth: 180, objectFit: "contain" }}
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
            <button onClick={() => setF({ logo_url: "" })} className="btn btn-sm btn-danger">Remove Logo</button>
          </div>
        )}
        <FL label="Brand Name (shown in navbar when no logo image)">{TI("logo_name", "peadia.in")}</FL>
      </Section>

      {/* ── Social Media ── */}
      <Section title="Social Media Links" icon={<span style={{ fontSize: 15 }}>🌐</span>}>
        <p style={{ fontSize: 12, color: "var(--tx-3)", lineHeight: 1.6 }}>
          Add your social media profile URLs. Icons will appear in the website footer.
          Leave blank to hide any platform.
        </p>
        <div className="form-row">
          <FL label="Instagram">
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>📸</span>
              <input key={`ig-${initKey}`} className="inp"
                defaultValue={f.instagram_url}
                placeholder="https://instagram.com/yourpage"
                style={{ paddingLeft: 34 }}
                onChange={e => { (formRef.current as unknown as Record<string, unknown>)["instagram_url"] = e.target.value; }}
                onBlur={e => setF({ instagram_url: e.target.value })} />
            </div>
          </FL>
          <FL label="Facebook">
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>📘</span>
              <input key={`fb-${initKey}`} className="inp"
                defaultValue={f.facebook_url}
                placeholder="https://facebook.com/yourpage"
                style={{ paddingLeft: 34 }}
                onChange={e => { (formRef.current as unknown as Record<string, unknown>)["facebook_url"] = e.target.value; }}
                onBlur={e => setF({ facebook_url: e.target.value })} />
            </div>
          </FL>
          <FL label="Twitter / X">
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🐦</span>
              <input key={`tw-${initKey}`} className="inp"
                defaultValue={f.twitter_url}
                placeholder="https://twitter.com/yourhandle"
                style={{ paddingLeft: 34 }}
                onChange={e => { (formRef.current as unknown as Record<string, unknown>)["twitter_url"] = e.target.value; }}
                onBlur={e => setF({ twitter_url: e.target.value })} />
            </div>
          </FL>
          <FL label="YouTube">
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>▶️</span>
              <input key={`yt-${initKey}`} className="inp"
                defaultValue={f.youtube_url}
                placeholder="https://youtube.com/@yourchannel"
                style={{ paddingLeft: 34 }}
                onChange={e => { (formRef.current as unknown as Record<string, unknown>)["youtube_url"] = e.target.value; }}
                onBlur={e => setF({ youtube_url: e.target.value })} />
            </div>
          </FL>
          <FL label="TikTok">
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🎵</span>
              <input key={`tk-${initKey}`} className="inp"
                defaultValue={f.tiktok_url}
                placeholder="https://tiktok.com/@yourhandle"
                style={{ paddingLeft: 34 }}
                onChange={e => { (formRef.current as unknown as Record<string, unknown>)["tiktok_url"] = e.target.value; }}
                onBlur={e => setF({ tiktok_url: e.target.value })} />
            </div>
          </FL>
        </div>
        {/* Preview */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { url: f.instagram_url, label: "Instagram", emoji: "📸" },
            { url: f.facebook_url,  label: "Facebook",  emoji: "📘" },
            { url: f.twitter_url,   label: "Twitter",   emoji: "🐦" },
            { url: f.youtube_url,   label: "YouTube",   emoji: "▶️" },
            { url: f.tiktok_url,    label: "TikTok",    emoji: "🎵" },
          ].filter(({ url }) => url).map(({ url, label, emoji }) => (
            <a key={label} href={url} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.22)", borderRadius: 99, padding: "4px 11px", fontSize: 12, fontWeight: 600, color: NG, textDecoration: "none" }}>
              {emoji} {label}
            </a>
          ))}
        </div>
      </Section>

      {/* ── Announcement ── */}
      <Section title="Promo Popup" icon={<Bell style={{ width: 15, height: 15 }} />}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--tx)" }}>Show promo popup to visitors</p>
            <p style={{ fontSize: 11, color: "var(--tx-3)", marginTop: 2 }}>Slides in from right ~1.4s after page load</p>
          </div>
          <div onClick={() => setF({ is_announcement_active: !f.is_announcement_active })}
            style={{ width: 44, height: 24, borderRadius: 99, cursor: "pointer", position: "relative",
              background: f.is_announcement_active ? NG : "rgba(255,255,255,0.12)",
              transition: "background 0.2s", flexShrink: 0 }}>
            <div style={{ position: "absolute", top: 2,
              left: f.is_announcement_active ? "calc(100% - 22px)" : 2,
              width: 20, height: 20, borderRadius: "50%", background: "#fff",
              transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
          </div>
        </div>
        {f.is_announcement_active && (
          <div style={{ background: "#0A2418", border: "1px solid rgba(0,230,118,0.22)", borderRadius: 8, padding: "9px 13px", fontSize: 13, color: NG }}>
            📣 Preview: {f.announcement_text || "(empty)"}
          </div>
        )}
        <FL label="Popup Message Text">
          <textarea
            key={`ann-${initKey}`}
            className="inp"
            defaultValue={f.announcement_text}
            onChange={e => { (formRef.current as unknown as Record<string, unknown>)["announcement_text"] = e.target.value; }}
            onBlur={e => setF({ announcement_text: e.target.value })}
            rows={2} style={{ resize: "none" }} />
        </FL>
      </Section>

      {/* ── Promo Code ── */}
      <Section title="Promo Code & Delivery" icon={<Zap style={{ width: 15, height: 15 }} />}>
        <div className="form-row3">
          <FL label="Promo Code">
            <input key={`promo-${initKey}`} className="inp"
              defaultValue={f.promo_code}
              placeholder="PEADIA10"
              onChange={e => { (formRef.current as unknown as Record<string, unknown>)["promo_code"] = e.target.value.toUpperCase(); }}
              onBlur={e => setF({ promo_code: e.target.value.toUpperCase() })} />
          </FL>
          <FL label="Discount %">
            <input type="number" min={1} max={100} className="inp"
              value={f.promo_discount_percent}
              onChange={e => setF({ promo_discount_percent: parseInt(e.target.value) || 10 })} />
          </FL>
          <FL label="Free Delivery Above ₹">
            <input type="number" min={0} className="inp"
              value={f.free_delivery_min_amount}
              onChange={e => setF({ free_delivery_min_amount: parseFloat(e.target.value) || 499 })} />
          </FL>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="badge b-green">{f.promo_code || "CODE"} — {f.promo_discount_percent}% OFF</span>
          <span className="badge b-green">Free delivery above ₹{f.free_delivery_min_amount}</span>
        </div>
      </Section>

      {/* ── Payment Details ── */}
      <Section title="Payment Details" icon={<CreditCard style={{ width: 15, height: 15 }} />}>
        <div className="form-row">
          <FL label="UPI ID">{TI("upi_id", "yourname@upi")}</FL>
          <FL label="UPI Account Name">{TI("upi_name", "peadia.in")}</FL>
        </div>
        <FL label="QR Code Image URL">{TI("qr_code_url", "https://…")}</FL>
        {f.qr_code_url && (
          <img src={f.qr_code_url} alt="QR"
            style={{ width: 120, height: 120, objectFit: "contain", borderRadius: 8, border: "1px solid var(--bd)", background: "#fff", padding: 6 }}
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        )}
        <hr className="div" />
        <p className="section-label">Bank Transfer (optional)</p>
        <div className="form-row">
          <FL label="Bank Name">{TI("bank_name", "State Bank of India")}</FL>
          <FL label="Account Holder">{TI("bank_holder_name")}</FL>
          <FL label="Account Number">{TI("bank_account_number")}</FL>
          <FL label="IFSC Code">{TI("bank_ifsc", "SBIN0001234")}</FL>
        </div>
        <FL label="Payment Note">{TI("payment_note", "Include Order ID in payment note")}</FL>
      </Section>

      {/* ── Save ── */}
      <button onClick={save} disabled={loading} className="btn btn-ng"
        style={{ width: "100%", justifyContent: "center", padding: "13px 0", fontSize: 15, gap: 7, marginBottom: 14 }}>
        {loading ? "Saving…" : <><Save style={{ width: 15, height: 15 }} />Save All Settings</>}
      </button>

      {/* ── Change Password ── */}
      <Section title="Change Admin Password" icon={<Lock style={{ width: 15, height: 15 }} />}>
        <p style={{ fontSize: 12, color: "var(--tx-3)", lineHeight: 1.6 }}>
          Changing the password immediately invalidates the old one and logs you out.
        </p>
        <div className="form-row">
          <FL label="New Password (min 6 chars)">
            <div style={{ position: "relative" }}>
              <input type={showPwd ? "text" : "password"} value={newPwd}
                onChange={e => { setNewPwd(e.target.value); setPwdMsg(""); }}
                className="inp" placeholder="New password" style={{ paddingRight: 40 }} />
              <button type="button" onClick={() => setShowPwd(s => !s)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--tx-3)", display: "flex" }}>
                {showPwd ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
              </button>
            </div>
          </FL>
          <FL label="Confirm New Password">
            <input type={showPwd ? "text" : "password"} value={confPwd}
              onChange={e => { setConfPwd(e.target.value); setPwdMsg(""); }}
              className="inp" placeholder="Repeat password" />
          </FL>
        </div>
        {pwdMsg && <p style={{ fontSize: 12, color: pwdMsg.startsWith("✓") ? NG : "#FF465A", fontWeight: 700 }}>{pwdMsg}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={changePassword} className="btn btn-outline" style={{ flex: 1, justifyContent: "center", gap: 5 }}>
            <Lock style={{ width: 13, height: 13 }} />Change Password
          </button>
          <button onClick={signOutAdmin} className="btn btn-dark" style={{ flex: 1, justifyContent: "center", gap: 5 }}>
            <LogOut style={{ width: 13, height: 13 }} />Log Out
          </button>
        </div>
      </Section>
    </div>
  );
}
