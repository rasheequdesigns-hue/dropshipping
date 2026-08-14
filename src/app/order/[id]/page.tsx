"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, Truck, Home, Share2, MessageCircle } from "lucide-react";

const NG = "#00E676";

export default function OrderConfirmationPage() {
  const { id } = useParams() as { id: string };
  const delivery = new Date();
  delivery.setDate(delivery.getDate() + 5);
  const deliveryStr = delivery.toLocaleDateString("en-IN", { weekday:"long",day:"numeric",month:"long",year:"numeric" });
  const waMsg = encodeURIComponent(`✅ Order on peadia.in!\n\n📦 Order ID: *${id}*\n🗓 Delivery: ${deliveryStr}`);

  return (
    <div style={{ minHeight: "80vh", padding: "32px 0 80px" }}>
      <div className="pc" style={{ maxWidth: 560, margin: "0 auto" }}>
        <div className="card" style={{ padding: "32px 28px", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(0,230,118,0.10)", border: "2px solid rgba(0,230,118,0.28)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
            <CheckCircle style={{ width: 38, height: 38, color: NG }} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--tx)", marginBottom: 6 }}>Order Placed!</h1>
          <p style={{ fontSize: 14, color: "var(--tx-3)", marginBottom: 24 }}>Thank you for shopping with <span style={{ color: NG, fontWeight: 700 }}>peadia.in</span></p>

          <div style={{ background: "rgba(0,230,118,0.06)", border: "1px solid rgba(0,230,118,0.18)", borderRadius: 10, padding: "14px 18px", marginBottom: 24 }}>
            <p style={{ fontSize: 11, color: "var(--tx-3)", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.7px" }}>Order ID</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: NG }}>{id}</p>
          </div>

          {/* Timeline */}
          <div style={{ textAlign: "left", marginBottom: 24 }}>
            {[
              { Icon: CheckCircle, label: "Confirmed",       sub: "Order received",               done: true  },
              { Icon: Package,     label: "Processing",      sub: "Being packed",                  done: false },
              { Icon: Truck,       label: "Shipped",         sub: "On its way to you",             done: false },
              { Icon: Home,        label: "Delivered",       sub: `Est. ${deliveryStr}`,           done: false },
            ].map(({ Icon, label, sub, done }, i, arr) => (
              <div key={label} style={{ display: "flex", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: done ? "rgba(0,230,118,0.10)" : "var(--bg-elevated)", border: `1.5px solid ${done ? NG : "var(--bd)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon style={{ width: 17, height: 17, color: done ? NG : "var(--tx-4)" }} />
                  </div>
                  {i < arr.length - 1 && <div style={{ width: 1.5, flex: 1, minHeight: 16, background: done ? NG : "var(--bd)", opacity: done ? 0.5 : 0.3, margin: "3px 0" }} />}
                </div>
                <div style={{ paddingBottom: 14, paddingTop: 5 }}>
                  <p style={{ fontSize: 14, fontWeight: done ? 700 : 500, color: done ? "var(--tx)" : "var(--tx-3)" }}>{label}</p>
                  <p style={{ fontSize: 12, color: "var(--tx-3)" }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <a href={`https://wa.me/?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: "#25D366", color: "#000", fontWeight: 700, fontSize: 14, padding: "12px 0", borderRadius: 9, textDecoration: "none" }}>
              <MessageCircle style={{ width: 16, height: 16 }} />Share on WhatsApp
            </a>
            <Link href="/" className="btn btn-ng" style={{ justifyContent: "center", padding: "12px 0" }}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
