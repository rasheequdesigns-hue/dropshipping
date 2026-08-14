"use client";

import { useState, useEffect, useRef } from "react";
import { Users, MessageSquare, Search, TrendingUp, Trash2, X, Phone, ShoppingCart, Calendar, Edit2, Save, Gift } from "lucide-react";
import { supabase, Order, UserProfile } from "@/lib/supabase";
import { useToast } from "@/components/Toast";

const NG = "#00E676";
const SC: Record<string, string> = {
  Pending:"s-Pending", Processing:"s-Processing", Shipped:"s-Shipped",
  "Out for Delivery":"s-OutforDelivery", Delivered:"s-Delivered", Cancelled:"s-Cancelled",
};

/** Merged view: user_profiles data merged with order aggregates */
interface MergedUser {
  phone: string;
  name: string;
  email: string;
  profile_id: string | null;
  referral_code: string;
  reward_balance: number;
  reward_points: number;
  total_orders: number;
  total_spent: number;
  last_order: string;
  orders: Order[];
  from_profile: boolean; // true = has a user_profile row
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users,    setUsers]    = useState<MergedUser[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState<MergedUser | null>(null);
  const [editForm, setEditForm] = useState<{ name:string; email:string; reward_balance:string; reward_points:string }>({ name:"", email:"", reward_balance:"0", reward_points:"0" });
  const [saving,   setSaving]   = useState(false);
  const [hovered,  setHovered]  = useState<MergedUser | null>(null);
  const [hoverPos, setHoverPos] = useState({ x:0, y:0 });
  const hoverTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [{ data: orders }, { data: profiles }] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending:false }),
        supabase.from("user_profiles").select("*").order("created_at", { ascending:false }),
      ]);

      const profileMap = new Map<string, UserProfile>();
      for (const p of (profiles ?? []) as UserProfile[]) {
        profileMap.set(p.phone, p);
      }

      // Build merged map keyed by phone
      const map = new Map<string, MergedUser>();

      // First add all user_profiles
      for (const p of profileMap.values()) {
        map.set(p.phone, {
          phone: p.phone,
          name: p.name ?? "",
          email: p.email ?? "",
          profile_id: p.id,
          referral_code: p.referral_code,
          reward_balance: p.reward_balance ?? 0,
          reward_points: p.reward_points ?? 0,
          total_orders: 0,
          total_spent: 0,
          last_order: p.created_at,
          orders: [],
          from_profile: true,
        });
      }

      // Merge in orders data
      for (const o of (orders ?? []) as Order[]) {
        const phone = o.customer_phone;
        const existing = map.get(phone);
        if (existing) {
          existing.total_orders++;
          if (o.status !== "Cancelled") existing.total_spent += o.total_amount ?? 0;
          if (new Date(o.created_at) > new Date(existing.last_order)) {
            existing.last_order = o.created_at;
            if (!existing.from_profile) existing.name = o.customer_name;
          }
          existing.orders.push(o);
        } else {
          // Customer exists in orders but has no profile yet
          const prof = profileMap.get(phone);
          map.set(phone, {
            phone,
            name: o.customer_name,
            email: "",
            profile_id: prof?.id ?? null,
            referral_code: prof?.referral_code ?? "",
            reward_balance: prof?.reward_balance ?? 0,
            reward_points: prof?.reward_points ?? 0,
            total_orders: 1,
            total_spent: o.status !== "Cancelled" ? (o.total_amount ?? 0) : 0,
            last_order: o.created_at,
            orders: [o],
            from_profile: false,
          });
        }
      }

      setUsers(Array.from(map.values()).sort((a, b) => b.total_spent - a.total_spent));
    } catch (e) {
      console.warn("Users load error:", e);
    }
    setLoading(false);
  }

  const openEdit = (u: MergedUser) => {
    setSelected(u);
    setEditForm({
      name: u.name,
      email: u.email,
      reward_balance: String(u.reward_balance),
      reward_points: String(u.reward_points),
    });
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    const updates = {
      name: editForm.name.trim() || null,
      email: editForm.email.trim() || null,
      reward_balance: parseFloat(editForm.reward_balance) || 0,
      reward_points: parseInt(editForm.reward_points) || 0,
    };
    try {
      if (selected.profile_id) {
        // Update existing profile
        const { error } = await supabase.from("user_profiles").update(updates).eq("id", selected.profile_id);
        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase.from("user_profiles").insert({
          phone: selected.phone,
          referral_code: `PE${selected.phone.slice(-6)}${Math.random().toString(36).slice(2,4).toUpperCase()}`,
          ...updates,
        });
        if (error) throw error;
      }
      toast("User updated!", "success");
      setSelected(null);
      await load();
    } catch (e) {
      console.warn("Save user error:", e);
      toast("Saved (offline mode)", "info");
      // Optimistic update
      setUsers(prev => prev.map(u => u.phone === selected.phone ? { ...u, ...updates, name: updates.name ?? u.name, email: updates.email ?? u.email } : u));
      setSelected(null);
    }
    setSaving(false);
  };

  const deleteUser = async (u: MergedUser) => {
    if (!confirm(`Delete all data for ${u.phone} (${u.name})? This removes their profile and order records.`)) return;
    try {
      if (u.profile_id) {
        await supabase.from("reward_transactions").delete().eq("phone", u.phone);
        await supabase.from("user_profiles").delete().eq("id", u.profile_id);
      }
      for (const o of u.orders) {
        await supabase.from("order_items").delete().eq("order_id", o.id);
        await supabase.from("orders").delete().eq("id", o.id);
      }
    } catch (e) { console.warn("Delete user error:", e); }
    setUsers(prev => prev.filter(x => x.phone !== u.phone));
    toast("User deleted", "info");
  };

  const onRowHover = (e: React.MouseEvent, u: MergedUser) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const xPos = window.innerWidth - rect.right < 310 ? rect.left - 310 : rect.right + 8;
    setHoverPos({ x: Math.max(8, Math.min(xPos, window.innerWidth - 320)), y: Math.min(rect.top, window.innerHeight - 360) });
    hoverTimer.current = setTimeout(() => setHovered(u), 320);
  };
  const onRowLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setTimeout(() => setHovered(null), 200);
  };

  const visible = search.trim()
    ? users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.phone.includes(search) || (u.email && u.email.toLowerCase().includes(search.toLowerCase())))
    : users;

  const totalRevenue   = users.reduce((s, u) => s + u.total_spent, 0);
  const profileCount   = users.filter(u => u.from_profile).length;
  const rewardedCount  = users.filter(u => u.reward_balance > 0 || u.reward_points > 0).length;

  return (
    <div style={{ position: "relative" }}>
      <div style={{ marginBottom: 22, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 className="admin-page-title">Registered Users</h1>
          <p className="admin-page-sub">{users.length} customers · {profileCount} registered profiles · ₹{totalRevenue.toLocaleString()} revenue</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: "Total Customers",    value: users.length,                       color: "#60A5FA", Icon: Users        },
          { label: "Total Revenue",      value: `₹${totalRevenue.toLocaleString()}`, color: NG,       Icon: TrendingUp   },
          { label: "With Profiles",      value: profileCount,                       color: "#C084FC", Icon: Users        },
          { label: "With Rewards",       value: rewardedCount,                      color: "#FFC400", Icon: Gift         },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} className="card" style={{ padding: "14px 16px", display: "flex", gap: 11, alignItems: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon style={{ width: 17, height: 17, color }} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: "var(--tx-3)", marginBottom: 2 }}>{label}</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: "var(--tx)" }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: 280, marginBottom: 16 }}>
        <Search style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "var(--tx-3)" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone, email…" className="inp" style={{ paddingLeft: 28, height: 36 }} />
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--tx-3)" }}>Loading…</div>
        ) : visible.length === 0 ? (
          <div style={{ padding: "52px 20px", textAlign: "center" }}>
            <Users style={{ width: 28, height: 28, color: "var(--tx-4)", margin: "0 auto 10px" }} />
            <p style={{ color: "var(--tx-3)" }}>No customers yet</p>
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  {["Customer","Phone","Email","Orders","Spent","Rewards","Profile","Last Order","Actions"].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {visible.map(u => (
                  <tr key={u.phone}
                    onMouseEnter={e => onRowHover(e, u)}
                    onMouseLeave={onRowLeave}
                    style={{ cursor: "default" }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(0,230,118,0.12)", border: "1px solid rgba(0,230,118,0.20)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: NG }}>{(u.name || u.phone).charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 13, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "var(--tx-3)", fontSize: 12 }}>{u.phone}</td>
                    <td style={{ color: "var(--tx-3)", fontSize: 11, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email || "—"}</td>
                    <td><span className="badge b-green">{u.total_orders}</span></td>
                    <td style={{ fontWeight: 700, color: NG, fontSize: 13 }}>₹{u.total_spent.toLocaleString()}</td>
                    <td>
                      {(u.reward_balance > 0 || u.reward_points > 0) ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {u.reward_balance > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: NG }}>₹{u.reward_balance}</span>}
                          {u.reward_points > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: "#C084FC" }}>{u.reward_points} pts</span>}
                        </div>
                      ) : <span style={{ color: "var(--tx-4)", fontSize: 11 }}>—</span>}
                    </td>
                    <td>
                      <span className={`badge ${u.from_profile ? "b-green" : "b-gray"}`}>
                        {u.from_profile ? "✓ Registered" : "Orders only"}
                      </span>
                    </td>
                    <td style={{ color: "var(--tx-3)", fontSize: 11 }}>
                      {new Date(u.last_order).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button onClick={() => openEdit(u)} style={{ padding: "4px 7px", borderRadius: 6, background: "rgba(96,165,250,0.10)", border: "1px solid rgba(96,165,250,0.20)", color: "#60A5FA", cursor: "pointer", display: "flex" }}>
                          <Edit2 style={{ width: 12, height: 12 }} />
                        </button>
                        <a href={`https://wa.me/91${u.phone}`} target="_blank" rel="noopener noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#25D366", color: "#000", fontWeight: 700, fontSize: 10, padding: "4px 8px", borderRadius: 6, textDecoration: "none" }}>
                          <MessageSquare style={{ width: 10, height: 10 }} />
                        </a>
                        <button onClick={() => deleteUser(u)} style={{ padding: "4px 7px", borderRadius: 6, background: "rgba(255,70,90,0.10)", border: "1px solid rgba(255,70,90,0.20)", color: "#FF465A", cursor: "pointer", display: "flex" }}>
                          <Trash2 style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Hover detail card ── */}
      {hovered && (
        <div
          onMouseEnter={() => { if (hoverTimer.current) clearTimeout(hoverTimer.current); }}
          onMouseLeave={() => setHovered(null)}
          style={{ position: "fixed", top: hoverPos.y, left: hoverPos.x, zIndex: 300, width: 300, background: "#1C2333", border: "1px solid rgba(0,230,118,0.22)", borderRadius: 14, boxShadow: "0 12px 48px rgba(0,0,0,0.65)", overflow: "hidden" }}>
          <div className="neon-line" />
          <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,230,118,0.12)", border: "1px solid rgba(0,230,118,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: NG }}>{(hovered.name || hovered.phone).charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{hovered.name || "No name"}</p>
                <p style={{ fontSize: 11, color: "var(--tx-3)" }}>{hovered.phone}</p>
                {hovered.email && <p style={{ fontSize: 11, color: "var(--tx-3)" }}>{hovered.email}</p>}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Orders",     value: hovered.total_orders,                       Icon: ShoppingCart },
                { label: "Spent",      value: `₹${hovered.total_spent.toLocaleString()}`, Icon: TrendingUp   },
                { label: "Last Order", value: new Date(hovered.last_order).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), Icon: Calendar },
                { label: "Rewards",   value: hovered.reward_balance > 0 ? `₹${hovered.reward_balance}` : `${hovered.reward_points} pts`, Icon: Gift },
              ].map(({ label, value, Icon }) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "7px 9px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                    <Icon style={{ width: 11, height: 11, color: NG }} />
                    <span style={{ fontSize: 10, color: "var(--tx-3)", fontWeight: 600 }}>{label}</span>
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{String(value)}</p>
                </div>
              ))}
            </div>
            {hovered.referral_code && (
              <p style={{ fontSize: 10, color: "var(--tx-3)", marginTop: 8 }}>
                Referral: <span style={{ color: NG, fontWeight: 700 }}>{hovered.referral_code}</span>
              </p>
            )}
          </div>
          {/* Recent orders */}
          <div style={{ maxHeight: 130, overflowY: "auto" }}>
            {hovered.orders.slice(0, 5).map(o => (
              <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 11, alignItems: "center" }}>
                <span style={{ color: NG, fontWeight: 700 }}>#{o.order_number}</span>
                <span className={`badge ${SC[o.status] ?? "b-gray"}`} style={{ fontSize: 9 }}>{o.status}</span>
                <span style={{ fontWeight: 600 }}>₹{o.total_amount?.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: "8px 14px" }}>
            <a href={`https://wa.me/91${hovered.phone}`} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", background: "#25D366", color: "#000", fontWeight: 700, fontSize: 12, padding: "7px 0", borderRadius: 8, textDecoration: "none" }}>
              <MessageSquare style={{ width: 13, height: 13 }} />Message on WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* ── Edit User Drawer ── */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 200, display: "flex", justifyContent: "flex-end" }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div style={{ width: "min(440px,100vw)", background: "#161B22", borderLeft: "1px solid rgba(255,255,255,0.08)", height: "100vh", overflowY: "auto" }}>
            <div className="neon-line" />
            <div style={{ position: "sticky", top: 0, background: "#161B22", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 1 }}>
              <div>
                <p style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Edit Customer</p>
                <p style={{ fontSize: 12, color: "var(--tx-3)", marginTop: 2 }}>{selected.phone}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--tx-3)", display: "flex" }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Basic info */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 16 }}>
                <p className="section-label" style={{ marginBottom: 12 }}>Customer Details</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label className="field-label">Full Name</label>
                    <input className="inp" value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Customer name" />
                  </div>
                  <div>
                    <label className="field-label">Email Address</label>
                    <input className="inp" type="email" value={editForm.email}
                      onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="customer@email.com" />
                  </div>
                  <div>
                    <label className="field-label">Phone (read-only)</label>
                    <input className="inp" value={selected.phone} readOnly style={{ opacity: 0.5 }} />
                  </div>
                  {selected.referral_code && (
                    <div>
                      <label className="field-label">Referral Code</label>
                      <input className="inp" value={selected.referral_code} readOnly style={{ opacity: 0.5, fontFamily: "monospace" }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Rewards */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 16 }}>
                <p className="section-label" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 5 }}>
                  <Gift style={{ width: 11, height: 11 }} />Reward Balance & Points
                </p>
                <div className="form-row">
                  <div>
                    <label className="field-label">Cash Reward (₹)</label>
                    <input className="inp" type="number" min={0} value={editForm.reward_balance}
                      onChange={e => setEditForm(f => ({ ...f, reward_balance: e.target.value }))} />
                  </div>
                  <div>
                    <label className="field-label">Reward Points</label>
                    <input className="inp" type="number" min={0} value={editForm.reward_points}
                      onChange={e => setEditForm(f => ({ ...f, reward_points: e.target.value }))} />
                  </div>
                </div>
                <p style={{ fontSize: 11, color: "var(--tx-3)", marginTop: 8 }}>
                  Admin can manually grant or remove rewards. Changes take effect immediately.
                </p>
              </div>

              {/* Order summary */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 16 }}>
                <p className="section-label" style={{ marginBottom: 10 }}>Order History</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div style={{ textAlign: "center", background: "rgba(0,230,118,0.07)", borderRadius: 8, padding: "10px 0" }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: NG }}>{selected.total_orders}</p>
                    <p style={{ fontSize: 11, color: "var(--tx-3)" }}>Orders Placed</p>
                  </div>
                  <div style={{ textAlign: "center", background: "rgba(96,165,250,0.07)", borderRadius: 8, padding: "10px 0" }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: "#60A5FA" }}>₹{selected.total_spent.toLocaleString()}</p>
                    <p style={{ fontSize: 11, color: "var(--tx-3)" }}>Total Spent</p>
                  </div>
                </div>
                {selected.orders.length > 0 && (
                  <div style={{ maxHeight: 180, overflowY: "auto" }}>
                    {selected.orders.map(o => (
                      <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 12, alignItems: "center" }}>
                        <span style={{ color: NG, fontWeight: 700 }}>#{o.order_number}</span>
                        <span className={`badge ${SC[o.status] ?? "b-gray"}`} style={{ fontSize: 9 }}>{o.status}</span>
                        <span style={{ fontWeight: 600 }}>₹{o.total_amount?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={saveEdit} disabled={saving} className="btn btn-ng" style={{ flex: 2, justifyContent: "center", gap: 6 }}>
                  <Save style={{ width: 14, height: 14 }} />{saving ? "Saving…" : "Save Changes"}
                </button>
                <a href={`https://wa.me/91${selected.phone}`} target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: "#25D366", color: "#000", fontWeight: 700, fontSize: 12, borderRadius: 8, textDecoration: "none", padding: "10px 0" }}>
                  <MessageSquare style={{ width: 14, height: 14 }} />WhatsApp
                </a>
              </div>
              <button onClick={() => { deleteUser(selected); setSelected(null); }} className="btn btn-danger" style={{ justifyContent: "center", gap: 6 }}>
                <Trash2 style={{ width: 13, height: 13 }} />Delete Customer & All Orders
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
