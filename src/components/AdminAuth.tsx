"use client";

import { useState, useEffect, ReactNode } from "react";
import { Lock, Eye, EyeOff, Zap } from "lucide-react";
import { supabase, DEFAULT_SETTINGS } from "@/lib/supabase";

const SESSION_KEY = "peadia_admin_auth";

export function AdminAuth({ children }: { children: ReactNode }) {
  const [authed,   setAuthed]   = useState(false);
  const [checked,  setChecked]  = useState(false);
  const [password, setPassword] = useState("");
  const [show,     setShow]     = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    const ok = sessionStorage.getItem(SESSION_KEY) === "1";
    setAuthed(ok);
    setChecked(true);
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) { setError("Enter password"); return; }
    setLoading(true);
    setError("");
    try {
      const { data } = await supabase
        .from("store_settings").select("admin_password_hash").eq("id", 1).single();
      const correct = data?.admin_password_hash ?? DEFAULT_SETTINGS.admin_password_hash;
      if (password === correct) {
        sessionStorage.setItem(SESSION_KEY, "1");
        setAuthed(true);
      } else {
        setError("Incorrect password. Please try again.");
        setPassword("");
      }
    } catch {
      // Offline fallback
      if (password === DEFAULT_SETTINGS.admin_password_hash) {
        sessionStorage.setItem(SESSION_KEY, "1");
        setAuthed(true);
      } else {
        setError("Incorrect password. Please try again.");
        setPassword("");
      }
    }
    setLoading(false);
  };

  if (!checked) return null;
  if (authed) return <>{children}</>;

  return (
    <div style={{
      minHeight: "100vh", background: "#0D1117",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: "linear-gradient(135deg,#00E676,#00FF88)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "0 0 32px rgba(0,230,118,0.30)",
          }}>
            <Lock style={{ width: 28, height: 28, color: "#0D1117" }} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 6 }}>Admin Panel</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.40)" }}>Enter your password to continue</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 28, overflow: "hidden" }}>
          <div className="neon-line" style={{ margin: "-28px -28px 24px" }} />
          <form onSubmit={login} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label className="field-label">Admin Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  className={`inp${error ? " err" : ""}`}
                  placeholder="Enter password…"
                  autoFocus
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShow(s => !s)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--tx-3)", display: "flex" }}>
                  {show ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              </div>
              {error && (
                <p style={{ fontSize: 12, color: "#FF465A", marginTop: 7, fontWeight: 600 }}>{error}</p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn btn-ng"
              style={{ width: "100%", justifyContent: "center", padding: "12px 0", fontSize: 15, gap: 7 }}>
              {loading ? "Verifying…" : <><Zap style={{ width: 15, height: 15 }} />Enter Admin Panel</>}
            </button>
          </form>
        </div>

        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", textAlign: "center", marginTop: 16 }}>
          peadia.in · Admin Dashboard
        </p>
      </div>
    </div>
  );
}

export function signOutAdmin() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = "/admin";
}
