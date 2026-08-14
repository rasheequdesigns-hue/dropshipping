"use client";

import { useState, useEffect, use } from "react";
import { supabase, Order } from "@/lib/supabase";
import { TrendingUp, ShoppingCart, Package, Clock, DollarSign, CheckCircle, XCircle, Truck, Lock, Eye, EyeOff } from "lucide-react";
import { ReviewSection } from "@/components/ReviewSection";

const NG = "#00E676";

function StatCard({ label, value, sub, color, icon: Icon, isSensitive = false }: { label: string; value: string | number; sub?: string; color: string; icon: React.ComponentType<{ style?: React.CSSProperties }>; isSensitive?: boolean }) {
  const [revealed, setRevealed] = useState(!isSensitive);
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px 22px", display: "flex", gap: 16, alignItems: "center", position: "relative" }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon style={{ width: 22, height: 22, color }} />
      </div>
      <div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 3 }}>{label}</p>
        <p style={{ fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{revealed ? value : "••••••"}</p>
        {sub && <p style={{ fontSize: 11, color: color, marginTop: 4 }}>{sub}</p>}
      </div>
      {isSensitive && (
        <button onClick={() => setRevealed(!revealed)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--tx-3)", cursor: "pointer" }}>
          {revealed ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
        </button>
      )}
    </div>
  );
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────
function MiniChart({ orders }: { orders: Order[] }) {
  const now = new Date();
  const data = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const yr = d.getFullYear(); const mo = d.getMonth();
    return {
      label: d.toLocaleDateString("en-IN", { month: "short" }),
      amount: orders.filter(o => {
        const od = new Date(o.created_at);
        return od.getFullYear() === yr && od.getMonth() === mo && o.status !== "Cancelled";
      }).reduce((s, o) => s + (o.total_amount ?? 0), 0),
    };
  });
  const max = Math.max(...data.map(d => d.amount), 1);
  const W = 600; const H = 120; const PX = 30; const PY = 16;
  const pts = data.map((d, i) => ({
    ...d,
    x: PX + (i / (data.length - 1)) * (W - 2 * PX),
    y: H - PY - (d.amount / max) * (H - 2 * PY),
  }));
  const polyline = pts.map(p => `${p.x},${p.y}`).join(" ");
  const area = `M${pts[0].x},${H - PY} ` + pts.map(p => `L${p.x},${p.y}`).join(" ") + ` L${pts[pts.length - 1].x},${H - PY} Z`;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H + 24}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block", minWidth: 300 }}>
        <defs>
          <linearGradient id="inv-ag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={NG} stopOpacity="0.20" />
            <stop offset="100%" stopColor={NG} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map(t => (
          <line key={t} x1={PX} y1={H - PY - t * (H - 2 * PY)} x2={W - PX} y2={H - PY - t * (H - 2 * PY)} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        ))}
        <path d={area} fill="url(#inv-ag)" />
        <polyline points={polyline} fill="none" stroke={NG} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={p.amount > 0 ? 4.5 : 2.5} fill={p.amount > 0 ? NG : "rgba(255,255,255,0.12)"} stroke={p.amount > 0 ? "rgba(0,230,118,0.3)" : "none"} strokeWidth={3} />
            {p.amount > 0 && (
              <text x={p.x} y={p.y - 9} textAnchor="middle" fill={NG} fontSize={9} fontWeight={700}>
                {p.amount >= 100000 ? `₹${(p.amount / 100000).toFixed(1)}L` : p.amount >= 1000 ? `₹${(p.amount / 1000).toFixed(1)}k` : `₹${p.amount}`}
              </text>
            )}
            <text x={p.x} y={H + 18} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize={9}>{p.label}</text>
          </g>
        ))}
        <line x1={PX} y1={H - PY} x2={W - PX} y2={H - PY} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
      </svg>
    </div>
  );
}

// ─── Password gate ─────────────────────────────────────────────────────────────
function PasswordGate({ onUnlock }: { onUnlock: (pwd: string) => void }) {
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "#0D1117", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380, background: "#161B22", border: "1px solid rgba(0,230,118,0.22)", borderRadius: 20, overflow: "hidden" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #00E676, transparent)" }} />
        <div style={{ padding: "36px 32px" }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(0,230,118,0.10)", border: "1px solid rgba(0,230,118,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <Lock style={{ width: 24, height: 24, color: NG }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Investor Dashboard</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 28 }}>
            This dashboard is private. Enter your access password to continue.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="password" className="inp" value={pwd}
              onChange={e => { setPwd(e.target.value); setErr(""); }}
              onKeyDown={e => e.key === "Enter" && !loading && onUnlock(pwd)}
              placeholder="Enter your password"
              autoFocus
            />
            {err && <p style={{ fontSize: 12, color: "#FF465A", fontWeight: 600 }}>{err}</p>}
            <button
              onClick={() => { setLoading(true); onUnlock(pwd); setTimeout(() => setLoading(false), 1000); }}
              disabled={loading || !pwd.trim()}
              className="btn btn-ng" style={{ justifyContent: "center" }}
            >
              {loading ? "Verifying…" : "Access Dashboard"}
            </button>
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 24, textAlign: "center" }}>
            peadia.in · Investor Relations
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function InvestorPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [unlocked, setUnlocked] = useState(false);
  const [authErr, setAuthErr] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [investorName, setInvestorName] = useState("");
  const [investorCompany, setInvestorCompany] = useState("");
  const [productCount, setProductCount] = useState(0);

  async function unlock(pwd: string) {
    try {
      const { data, error } = await supabase
        .from("investor_access")
        .select("*")
        .eq("token", token)
        .eq("is_active", true)
        .single();

      if (error || !data) { setAuthErr("Invalid or expired link."); return; }
      if (data.password_hash !== pwd) { setAuthErr("Incorrect password. Please try again."); return; }

      // Record last viewed and increment view count
      await supabase.from("investor_access").update({ 
        last_viewed_at: new Date().toISOString(),
        view_count: (data.view_count || 0) + 1
      }).eq("id", data.id);

      setInvestorName(data.name);
      setInvestorCompany(data.company || "");
      setUnlocked(true);
      loadData();
    } catch { setAuthErr("Something went wrong. Please try again."); }
  }

  async function loadData() {
    setLoading(true);
    try {
      const [ordersRes, productsRes] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("id", { count: "exact", head: true }),
      ]);
      if (ordersRes.data) setOrders(ordersRes.data as Order[]);
      if (productsRes.count !== null) setProductCount(productsRes.count);
    } catch { }
    setLoading(false);
  }

  if (!unlocked) {
    return (
      <div>
        {authErr && (
          <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#2A0A0E", color: "#FF465A", border: "1px solid rgba(255,70,90,0.3)", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, zIndex: 999 }}>
            {authErr}
          </div>
        )}
        <PasswordGate onUnlock={unlock} />
      </div>
    );
  }

  // ── Computed stats ──────────────────────────────────────────────────────────
  const revenue = orders.filter(o => o.status !== "Cancelled").reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const pending = orders.filter(o => o.status === "Pending").length;
  const processing = orders.filter(o => o.status === "Processing").length;
  const shipped = orders.filter(o => o.status === "Shipped" || o.status === "Out for Delivery").length;
  const delivered = orders.filter(o => o.status === "Delivered").length;
  const cancelled = orders.filter(o => o.status === "Cancelled").length;

  // Month-over-month
  const now = new Date();
  const thisMonth = orders.filter(o => {
    const d = new Date(o.created_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && o.status !== "Cancelled";
  }).reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const lastMonth = orders.filter(o => {
    const d = new Date(o.created_at);
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getFullYear() === prev.getFullYear() && d.getMonth() === prev.getMonth() && o.status !== "Cancelled";
  }).reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const mom = lastMonth > 0 ? (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1) : null;

  const deliveryRate = orders.length > 0 ? ((delivered / orders.length) * 100).toFixed(1) : "0";

  return (
    <div style={{ minHeight: "100vh", background: "#0D1117", padding: "0 0 60px" }}>
      {/* Header */}
      <header style={{ background: "#161B22", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#00E676,#00FF88)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp style={{ width: 16, height: 16, color: "#0D1117" }} />
            </div>
            <div>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>peadia.in</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: NG, background: "rgba(0,230,118,0.12)", border: "1px solid rgba(0,230,118,0.25)", padding: "1px 6px", borderRadius: 99, marginLeft: 8 }}>INVESTOR VIEW</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{investorName}</p>
            {investorCompany && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{investorCompany}</p>}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 16, marginBottom: 28 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="shimmer" style={{ height: 100, borderRadius: 16 }} />)}
          </div>
        ) : (
          <>
            {/* KPI Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 16, marginBottom: 28 }}>
              <StatCard label="Total Revenue" value={`₹${revenue.toLocaleString()}`} sub={mom ? `${mom}% vs last month` : undefined} color={NG} icon={DollarSign} isSensitive />
              <StatCard label="Total Orders" value={orders.length} sub={`${pending} pending now`} color="#60A5FA" icon={ShoppingCart} />
              <StatCard label="Delivered" value={delivered} sub={`${deliveryRate}% delivery rate`} color="#C084FC" icon={Package} />
              <StatCard label="Active Products" value={productCount} sub="In catalogue" color="#FB923C" icon={Package} />
              <StatCard label="Processing" value={processing + shipped} sub="In pipeline" color="#FFC400" icon={Truck} />
              <StatCard label="This Month" value={`₹${thisMonth.toLocaleString()}`} sub={mom ? `${Number(mom) >= 0 ? "+" : ""}${mom}% MoM` : "First month"} color={NG} icon={TrendingUp} />
            </div>

            {/* Revenue chart */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "24px 24px 16px", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <TrendingUp style={{ width: 18, height: 18, color: NG }} />
                <p style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Revenue — Last 12 Months</p>
              </div>
              <MiniChart orders={orders} />
            </div>

            {/* Order status breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "22px 24px" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 18 }}>Order Status Breakdown</p>
                {[
                  { label: "Pending", count: pending, color: "#FFC400" },
                  { label: "Processing", count: processing, color: "#60A5FA" },
                  { label: "Shipped / OFD", count: shipped, color: "#C084FC" },
                  { label: "Delivered", count: delivered, color: NG },
                  { label: "Cancelled", count: cancelled, color: "#FF465A" },
                ].map(({ label, count, color }) => (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: "rgba(255,255,255,0.55)" }}>{label}</span>
                      <span style={{ color, fontWeight: 700 }}>{count}</span>
                    </div>
                    <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${orders.length > 0 ? (count / orders.length) * 100 : 0}%`, background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery highlights */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "22px 24px" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 18 }}>Delivery Performance</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    { label: "Delivery Rate", value: `${deliveryRate}%`, icon: CheckCircle, color: NG },
                    { label: "Cancellation Rate", value: `${orders.length > 0 ? ((cancelled / orders.length) * 100).toFixed(1) : 0}%`, icon: XCircle, color: "#FF465A" },
                    { label: "Active Orders", value: pending + processing + shipped, icon: Clock, color: "#FFC400" },
                    { label: "Avg Order Value", value: `₹${orders.length > 0 ? Math.round(revenue / orders.filter(o => o.status !== "Cancelled").length || 1).toLocaleString() : 0}`, icon: DollarSign, color: "#60A5FA" },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}18`, border: `1px solid ${color}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon style={{ width: 16, height: 16, color }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{label}</p>
                        <p style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent orders table */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Recent Orders</p>
              </div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr>{["Order #", "Amount", "Payment", "Status", "Date"].map(h => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {orders.slice(0, 10).map(o => (
                      <tr key={o.id}>
                        <td style={{ fontWeight: 700, color: NG, fontSize: 12 }}>#{o.order_number}</td>
                        <td style={{ fontWeight: 700 }}>₹{o.total_amount?.toLocaleString()}</td>
                        <td style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{o.payment_method}</td>
                        <td><span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "rgba(0,230,118,0.10)", color: NG, border: "1px solid rgba(0,230,118,0.22)" }}>{o.status}</span></td>
                        <td style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Customer Reviews */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "24px", marginTop: 24 }}>
              <ReviewSection title="All Customer Reviews" showSummary={false} />
            </div>

            {/* Disclaimer */}
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: 32 }}>
              This dashboard is confidential and intended solely for the authorised investor named above. © peadia.in {new Date().getFullYear()}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
