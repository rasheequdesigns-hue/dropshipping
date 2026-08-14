"use client";

import { useState, useEffect } from "react";
import { Plus, Link2, Copy, Eye, EyeOff, Trash2, Check, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/Toast";

interface InvestorAccess {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  company: string | null;
  location: string | null;
  token: string;
  password_hash: string;
  notes: string | null;
  is_active: boolean;
  last_viewed_at: string | null;
  view_count: number;
  created_at: string;
}

const BLANK: Omit<InvestorAccess, "id" | "created_at" | "last_viewed_at" | "view_count"> = {
  name: "", email: "", phone: "", position: "", company: "", location: "",
  token: "", password_hash: "", notes: "", is_active: true,
};

function genToken() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
}

const NG = "#00E676";

export default function AdminInvestorPage() {
  const { toast } = useToast();
  const [investors, setInvestors] = useState<InvestorAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...BLANK, token: genToken() });
  const [saving, setSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://peadia.in";

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await supabase.from("investor_access").select("*").order("created_at", { ascending: false });
      if (data) setInvestors(data as InvestorAccess[]);
    } catch { }
    setLoading(false);
  }

  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  async function save() {
    if (!form.name.trim() || !form.password_hash.trim()) {
      toast("Name and password are required", "error"); return;
    }
    if (!form.token.trim()) {
      toast("Token is required", "error"); return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("investor_access").insert({
        name: form.name, email: form.email || null, phone: form.phone || null,
        position: form.position || null, company: form.company || null,
        location: form.location || null, token: form.token.trim().toLowerCase(),
        password_hash: form.password_hash, notes: form.notes || null,
        is_active: form.is_active,
      });
      if (error) throw error;
      toast("Investor link created!", "success");
      setShowForm(false);
      setForm({ ...BLANK, token: genToken() });
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast(msg.includes("unique") ? "Token already exists — regenerate" : "Error saving", "error");
    }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this investor link?")) return;
    try { await supabase.from("investor_access").delete().eq("id", id); } catch { }
    setInvestors(p => p.filter(i => i.id !== id));
    toast("Deleted", "info");
  }

  async function toggle(inv: InvestorAccess) {
    const updated = !inv.is_active;
    try { await supabase.from("investor_access").update({ is_active: updated }).eq("id", inv.id); } catch { }
    setInvestors(p => p.map(i => i.id === inv.id ? { ...i, is_active: updated } : i));
  }

  function copyLink(token: string, id: string) {
    const link = `${origin}/investor/${token}`;
    navigator.clipboard.writeText(link).catch(() => { });
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast("Link copied!", "success");
  }

  return (
    <div>
      <div style={{ marginBottom: 22, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 className="admin-page-title">Investor Access</h1>
          <p className="admin-page-sub">Manage shareable investor dashboard links with password protection</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="btn btn-ng" style={{ gap: 6 }}>
          <Plus style={{ width: 14, height: 14 }} />
          New Investor Link
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card" style={{ padding: "20px 22px", marginBottom: 20, border: "1px solid rgba(0,230,118,0.22)" }}>
          <div className="neon-line" style={{ margin: "-20px -22px 18px", borderRadius: 0 }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: NG, marginBottom: 18 }}>📊 New Investor Link</p>

          <div className="form-row" style={{ marginBottom: 13 }}>
            <div><label className="field-label">Full Name *</label>
              <input className="inp" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Rahul Sharma" /></div>
            <div><label className="field-label">Position / Role</label>
              <input className="inp" value={form.position ?? ""} onChange={e => set("position", e.target.value)} placeholder="Venture Partner" /></div>
          </div>

          <div className="form-row" style={{ marginBottom: 13 }}>
            <div><label className="field-label">Company / Organisation</label>
              <input className="inp" value={form.company ?? ""} onChange={e => set("company", e.target.value)} placeholder="Acme Capital" /></div>
            <div><label className="field-label">Location</label>
              <input className="inp" value={form.location ?? ""} onChange={e => set("location", e.target.value)} placeholder="Mumbai, India" /></div>
          </div>

          <div className="form-row" style={{ marginBottom: 13 }}>
            <div><label className="field-label">Email</label>
              <input className="inp" type="email" value={form.email ?? ""} onChange={e => set("email", e.target.value)} placeholder="investor@fund.com" /></div>
            <div><label className="field-label">Phone</label>
              <input className="inp" value={form.phone ?? ""} onChange={e => set("phone", e.target.value)} placeholder="+91 98765 43210" /></div>
          </div>

          <div className="form-row" style={{ marginBottom: 13 }}>
            <div>
              <label className="field-label">Access Token (URL slug) *</label>
              <div style={{ display: "flex", gap: 6 }}>
                <input className="inp" value={form.token} onChange={e => set("token", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="abc123xyz" style={{ flex: 1 }} />
                <button type="button" onClick={() => set("token", genToken())} className="btn btn-dark btn-sm" aria-label="Generate new token">↺</button>
              </div>
              <p style={{ fontSize: 11, color: "var(--tx-3)", marginTop: 4 }}>
                Link: {origin}/investor/{form.token || "[token]"}
              </p>
            </div>
            <div>
              <label className="field-label">Password *</label>
              <div style={{ position: "relative" }}>
                <input className="inp" type={showPwd ? "text" : "password"} value={form.password_hash}
                  onChange={e => set("password_hash", e.target.value)} placeholder="Enter password" style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPwd(s => !s)} aria-label={showPwd ? "Hide password" : "Show password"}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--tx-3)", display: "flex" }}>
                  {showPwd ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="field-label">Notes (internal)</label>
            <textarea className="inp" value={form.notes ?? ""} onChange={e => set("notes", e.target.value)}
              placeholder="e.g. Series A discussion, shown in Board meeting 2026" rows={2} style={{ resize: "none" }} />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={save} disabled={saving} className="btn btn-ng" style={{ flex: 1, justifyContent: "center" }}>
              {saving ? "Creating…" : "Create Investor Link"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn btn-dark" style={{ flex: 1, justifyContent: "center" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="shimmer" style={{ height: 200 }} />
      ) : investors.length === 0 ? (
        <div className="card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <Users style={{ width: 32, height: 32, color: "var(--tx-4)", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--tx-2)", marginBottom: 6 }}>No investor links yet</p>
          <p style={{ fontSize: 13, color: "var(--tx-3)" }}>Create a link above to share a read-only dashboard with investors</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {investors.map(inv => (
            <div key={inv.id} className="card inv-row" style={{ padding: "16px 18px", opacity: inv.is_active ? 1 : 0.5, position: "relative" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                {/* Avatar */}
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(0,230,118,0.12)", border: "1px solid rgba(0,230,118,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18, fontWeight: 800, color: NG }}>
                  {inv.name.charAt(0).toUpperCase()}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "var(--tx)" }}>{inv.name}</p>
                    {inv.position && <span style={{ fontSize: 11, color: "var(--tx-3)" }}>· {inv.position}</span>}
                    {inv.company && <span className="badge b-blue" style={{ fontSize: 10 }}>{inv.company}</span>}
                    <span className={`badge ${inv.is_active ? "b-green" : "b-gray"}`} style={{ fontSize: 10 }}>
                      {inv.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {(inv.email || inv.phone || inv.location) && (
                    <p style={{ fontSize: 12, color: "var(--tx-3)", marginTop: 3 }}>
                      {[inv.email, inv.phone, inv.location].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {/* Link row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    <Link2 style={{ width: 11, height: 11, color: "var(--tx-3)" }} />
                    <span style={{ fontSize: 11, color: "var(--tx-3)", fontFamily: "monospace", wordBreak: "break-all" }}>
                      {origin}/investor/{inv.token}
                    </span>
                  </div>
                  {inv.notes && (
                    <p style={{ fontSize: 11, color: "var(--tx-3)", marginTop: 4, fontStyle: "italic" }}>{inv.notes}</p>
                  )}
                  <div className="hover-stats" style={{ display: "none", fontSize: 11, color: NG, marginTop: 6, padding: "6px 10px", background: "rgba(0,230,118,0.1)", borderRadius: 6, border: "1px solid rgba(0,230,118,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span><strong>Opened:</strong> {inv.view_count || 0} times</span>
                      {inv.last_viewed_at && <span><strong>Last:</strong> {new Date(inv.last_viewed_at).toLocaleString("en-IN")}</span>}
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => copyLink(inv.token, inv.id)} className="btn btn-dark btn-sm" aria-label="Copy investor link" style={{ gap: 4 }}>
                    {copiedId === inv.id ? <Check style={{ width: 12, height: 12, color: NG }} /> : <Copy style={{ width: 12, height: 12 }} />}
                    <span>{copiedId === inv.id ? "Copied" : "Copy Link"}</span>
                  </button>
                  <button onClick={() => toggle(inv)} className="btn btn-dark btn-sm" aria-label={inv.is_active ? "Deactivate" : "Activate"}>
                    {inv.is_active ? <EyeOff style={{ width: 12, height: 12 }} /> : <Eye style={{ width: 12, height: 12 }} />}
                  </button>
                  <button onClick={() => remove(inv.id)} className="btn btn-sm btn-danger" aria-label="Delete investor link">
                    <Trash2 style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`
        .inv-row:hover .hover-stats { display: block !important; }
      `}</style>
    </div>
  );
}
