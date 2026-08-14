"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DollarSign, ShoppingCart, Package, Clock, ArrowRight, TrendingUp } from "lucide-react";
import { supabase, Order } from "@/lib/supabase";

const STATUS_CLASS: Record<string, string> = {
  Pending: "s-Pending", Processing: "s-Processing", Shipped: "s-Shipped",
  "Out for Delivery": "s-OutforDelivery", Delivered: "s-Delivered", Cancelled: "s-Cancelled",
};

type ChartView = "weekly" | "monthly" | "yearly";
const NG = "#00E676";

function SalesChart({ orders }: { orders: Order[] }) {
  const [view, setView] = useState<ChartView>("monthly");

  const buildData = () => {
    const now = new Date();
    if (view === "weekly") {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (6 - i));
        const key = d.toISOString().slice(0, 10);
        return {
          label: d.toLocaleDateString("en-IN", { weekday: "short" }),
          amount: orders.filter(o => o.created_at.slice(0, 10) === key && o.status !== "Cancelled")
                        .reduce((s, o) => s + (o.total_amount ?? 0), 0),
        };
      });
    }
    if (view === "monthly") {
      return Array.from({ length: 12 }, (_, i) => {
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
    }
    return Array.from({ length: 5 }, (_, i) => {
      const year = now.getFullYear() - 4 + i;
      return {
        label: String(year),
        amount: orders.filter(o => new Date(o.created_at).getFullYear() === year && o.status !== "Cancelled")
                      .reduce((s, o) => s + (o.total_amount ?? 0), 0),
      };
    });
  };

  const data = buildData();
  const max  = Math.max(...data.map(d => d.amount), 1);
  const W = 380; const H = 110; const PX = 26; const PY = 18;
  const pts = data.map((d, i) => ({
    ...d,
    x: PX + (i / (data.length - 1 || 1)) * (W - 2 * PX),
    y: H - PY - ((d.amount / max) * (H - 2 * PY)),
  }));
  const polyline = pts.map(p => `${p.x},${p.y}`).join(" ");
  const area = `M${pts[0].x},${H - PY} ` + pts.map(p => `L${p.x},${p.y}`).join(" ") + ` L${pts[pts.length - 1].x},${H - PY} Z`;
  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <div>
          <span style={{ fontSize: 11, color: "var(--tx-3)" }}>
            {view === "weekly" ? "Last 7 days" : view === "monthly" ? "Last 12 months" : "Last 5 years"} · Total:&nbsp;
          </span>
          <span style={{ fontSize: 14, fontWeight: 800, color: NG }}>₹{total.toLocaleString()}</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {(["weekly", "monthly", "yearly"] as ChartView[]).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "4px 11px", borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer",
              background: view === v ? NG : "rgba(255,255,255,0.05)",
              color: view === v ? "#0D1117" : "var(--tx-3)",
              border: `1px solid ${view === v ? "transparent" : "rgba(255,255,255,0.08)"}`,
              transition: "all 0.15s",
            }}>
              {v === "weekly" ? "Week" : v === "monthly" ? "12 Months" : "5 Years"}
            </button>
          ))}
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H + 22}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block", minWidth: 260 }}>
          <defs>
            <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={NG} stopOpacity="0.22" />
              <stop offset="100%" stopColor={NG} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map(t => (
            <line key={t} x1={PX} y1={H - PY - t*(H-2*PY)} x2={W-PX} y2={H - PY - t*(H-2*PY)} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
          ))}
          <path d={area} fill="url(#ag)" />
          <polyline points={polyline} fill="none" stroke={NG} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={p.amount > 0 ? 4.5 : 2.5}
                fill={p.amount > 0 ? NG : "rgba(255,255,255,0.15)"}
                stroke={p.amount > 0 ? "rgba(0,230,118,0.30)" : "none"} strokeWidth={3} />
              {p.amount > 0 && (
                <text x={p.x} y={p.y - 9} textAnchor="middle" fill={NG} fontSize={8} fontWeight={700}>
                  {p.amount >= 100000 ? `₹${(p.amount/100000).toFixed(1)}L`
                    : p.amount >= 1000 ? `₹${(p.amount/1000).toFixed(1)}k`
                    : `₹${p.amount}`}
                </text>
              )}
              <text x={p.x} y={H + 16} textAnchor="middle" fill="rgba(255,255,255,0.30)" fontSize={9}>{p.label}</text>
            </g>
          ))}
          <line x1={PX} y1={H - PY} x2={W - PX} y2={H - PY} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
        </svg>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
        if (data) setOrders(data as Order[]);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const revenue   = orders.filter(o => o.status !== "Cancelled").reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const pending   = orders.filter(o => o.status === "Pending").length;
  const delivered = orders.filter(o => o.status === "Delivered").length;

  const stats = [
    { label: "Revenue",   value: `₹${revenue.toLocaleString()}`, Icon: DollarSign,  color: NG       },
    { label: "Orders",    value: orders.length,                   Icon: ShoppingCart, color: "#60A5FA"},
    { label: "Delivered", value: delivered,                       Icon: Package,      color: "#C084FC"},
    { label: "Pending",   value: pending,                         Icon: Clock,        color: "#FFC400"},
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-sub">Store overview at a glance</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {stats.map(({ label, value, Icon, color }) => (
          <div key={label} className="card" style={{ padding: "16px 18px", display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: `${color}18`, border: `1px solid ${color}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon style={{ width: 19, height: 19, color }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, color: "var(--tx-3)", marginBottom: 2 }}>{label}</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: "var(--tx)", lineHeight: 1 }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sales chart */}
      <div className="card" style={{ padding: "18px 20px", marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
          <TrendingUp style={{ width: 16, height: 16, color: NG }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--tx)" }}>Sales Revenue</p>
        </div>
        {loading ? <div className="shimmer" style={{ height: 144 }} /> : <SalesChart orders={orders} />}
      </div>

      {/* Quick links */}
      <div className="ql-grid" style={{ marginBottom: 22 }}>
        {[
          { href: "/admin/products", label: "Manage Products", sub: "Add, edit, remove" },
          { href: "/admin/orders",   label: "View All Orders",  sub: "Update statuses"  },
          { href: "/admin/settings", label: "Store Settings",   sub: "Promo, logo, payments" },
        ].map(({ href, label, sub }) => (
          <Link key={href} href={href} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", textDecoration: "none", background: "var(--bg-card)", border: "1px solid var(--bd)", borderRadius: 12, transition: "all 0.15s" }}
            onMouseEnter={e => { const a = e.currentTarget as HTMLAnchorElement; a.style.borderColor = "rgba(0,230,118,0.25)"; a.style.background = "var(--bg-elevated)"; }}
            onMouseLeave={e => { const a = e.currentTarget as HTMLAnchorElement; a.style.borderColor = "var(--bd)"; a.style.background = "var(--bg-card)"; }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--tx)" }}>{label}</p>
              <p style={{ fontSize: 11, color: "var(--tx-3)", marginTop: 2 }}>{sub}</p>
            </div>
            <ArrowRight style={{ width: 15, height: 15, color: "var(--tx-3)", flexShrink: 0 }} />
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--bd)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--tx)" }}>Recent Orders</p>
          <Link href="/admin/orders" style={{ fontSize: 12, color: NG, textDecoration: "none", fontWeight: 600 }}>View all →</Link>
        </div>
        {loading ? <div style={{ padding: 32, textAlign: "center", color: "var(--tx-3)" }}>Loading…</div>
        : orders.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <ShoppingCart style={{ width: 30, height: 30, color: "var(--tx-4)", margin: "0 auto 10px" }} />
            <p style={{ color: "var(--tx-3)" }}>No orders yet</p>
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr>{["Order","Customer","Amount","Payment","Status","Date"].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {orders.slice(0, 8).map(o => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 700, color: NG, fontSize: 12 }}>#{o.order_number}</td>
                    <td style={{ fontWeight: 600, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.customer_name}</td>
                    <td style={{ fontWeight: 700 }}>₹{o.total_amount?.toLocaleString()}</td>
                    <td style={{ color: "var(--tx-3)", fontSize: 12 }}>{o.payment_method}</td>
                    <td><span className={`badge ${STATUS_CLASS[o.status] || "b-gray"}`}>{o.status}</span></td>
                    <td style={{ color: "var(--tx-3)", fontSize: 11 }}>{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
