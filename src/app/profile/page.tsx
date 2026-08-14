"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, Copy, Check, Gift, ShoppingBag, Star, ArrowRight, Share2 } from "lucide-react";
import { fetchProfileByPhone, getOrCreateProfile, generateCode } from "@/lib/rewards";
import { useToast } from "@/components/Toast";
import { useSettings } from "@/lib/settings";

const NG = "#00E676";

const STATUS_CLASS: Record<string, string> = {
  Pending: "s-Pending", Processing: "s-Processing", Shipped: "s-Shipped",
  "Out for Delivery": "s-OutforDelivery", Delivered: "s-Delivered", Cancelled: "s-Cancelled",
};

export default function ProfilePage() {
  const { toast } = useToast();
  const s = useSettings();
  const [phone,   setPhone]   = useState("");
  const [loading, setLoading] = useState(false);
  const [data,    setData]    = useState<Awaited<ReturnType<typeof fetchProfileByPhone>> | null>(null);
  const [copied,  setCopied]  = useState(false);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phone.replace(/\D/g, "").slice(0, 10);
    if (clean.length !== 10) { toast("Enter a valid 10-digit number", "error"); return; }
    setLoading(true);
    // Auto-create profile if doesn't exist yet
    await getOrCreateProfile(clean);
    const result = await fetchProfileByPhone(clean);
    setData(result);
    setLoading(false);
  };

  const profile = data?.profile;
  const referralLink = profile
    ? `${typeof window !== "undefined" ? window.location.origin : "https://peadia.in"}/?ref=${profile.referral_code}`
    : "";

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(referralLink); } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 2500);
    toast("Referral link copied!", "success");
  };

  const shareLink = async () => {
    try {
      await navigator.share({ title: "Shop on peadia.in", text: "Get great deals!", url: referralLink });
    } catch {
      copyLink();
    }
  };

  const waShare = () => {
    const msg = encodeURIComponent(`🛍️ Shop on peadia.in and get amazing deals!\n\nUse my referral link: ${referralLink}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  return (
    <div style={{ padding: "32px 0 60px" }}>
      <div className="pc" style={{ maxWidth: 640, margin: "0 auto" }}>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(0,230,118,0.10)", border: "1px solid rgba(0,230,118,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Phone style={{ width: 26, height: 26, color: NG }} />
          </div>
          <h1 style={{ fontSize: "clamp(22px,5vw,30px)", fontWeight: 900, color: "var(--tx)", marginBottom: 8 }}>My Profile</h1>
          <p style={{ fontSize: 14, color: "var(--tx-3)" }}>Enter your phone number to view your orders, rewards, and referral link</p>
        </div>

        {/* Phone lookup */}
        {!data ? (
          <div className="card" style={{ padding: 28, overflow: "hidden" }}>
            <div className="neon-line" style={{ margin: "-28px -28px 24px" }} />
            <form onSubmit={lookup} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="field-label">Your Phone Number</label>
                <input className="inp" value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile number" inputMode="numeric"
                  style={{ fontSize: 16, letterSpacing: "1px" }} />
                <p style={{ fontSize: 11, color: "var(--tx-3)", marginTop: 5 }}>
                  Use the same number you used for your order
                </p>
              </div>
              <button type="submit" disabled={loading} className="btn btn-ng" style={{ justifyContent: "center", padding: "13px 0", fontSize: 15 }}>
                {loading ? "Looking up…" : "View My Profile"}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Profile card */}
            <div className="card" style={{ padding: 22, overflow: "hidden" }}>
              <div className="neon-line" style={{ margin: "-22px -22px 20px" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(0,230,118,0.12)", border: "2px solid rgba(0,230,118,0.28)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20, fontWeight: 900, color: NG }}>
                  {(profile?.name || phone).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 800, color: "var(--tx)" }}>{profile?.name || "Customer"}</p>
                  <p style={{ fontSize: 13, color: "var(--tx-3)" }}>{phone}</p>
                </div>
                <button onClick={() => setData(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--tx-3)", textDecoration: "underline" }}>
                  Change
                </button>
              </div>

              {/* Reward balance */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: "rgba(0,230,118,0.07)", border: "1px solid rgba(0,230,118,0.20)", borderRadius: 12, padding: "14px 16px" }}>
                  <p style={{ fontSize: 11, color: "var(--tx-3)", marginBottom: 4 }}>Reward Balance</p>
                  <p style={{ fontSize: 22, fontWeight: 900, color: NG }}>₹{(profile?.reward_balance ?? 0).toLocaleString()}</p>
                  <p style={{ fontSize: 11, color: "var(--tx-3)", marginTop: 2 }}>Available to use</p>
                </div>
                <div style={{ background: "rgba(192,132,252,0.07)", border: "1px solid rgba(192,132,252,0.20)", borderRadius: 12, padding: "14px 16px" }}>
                  <p style={{ fontSize: 11, color: "var(--tx-3)", marginBottom: 4 }}>Reward Points</p>
                  <p style={{ fontSize: 22, fontWeight: 900, color: "#C084FC" }}>{(profile?.reward_points ?? 0).toLocaleString()}</p>
                  <p style={{ fontSize: 11, color: "var(--tx-3)", marginTop: 2 }}>Points earned</p>
                </div>
              </div>
            </div>

            {/* Referral section */}
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
                <Gift style={{ width: 18, height: 18, color: NG }} />
                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--tx)" }}>Referral Rewards</p>
              </div>
              <p style={{ fontSize: 13, color: "var(--tx-3)", lineHeight: 1.6, marginBottom: 16 }}>
                Share your link with friends. When they buy using your link, you automatically earn rewards (cash, discount, or points) on their order!
              </p>

              {/* Referral link */}
              <div style={{ background: "rgba(0,230,118,0.06)", border: "1.5px dashed rgba(0,230,118,0.30)", borderRadius: 10, padding: "11px 14px", marginBottom: 14 }}>
                <p style={{ fontSize: 10, color: "var(--tx-3)", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.6px" }}>Your Referral Link</p>
                <p style={{ fontSize: 12, color: NG, wordBreak: "break-all", fontFamily: "monospace" }}>{referralLink}</p>
              </div>

              <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                <button onClick={copyLink} className="btn btn-outline" style={{ flex: 1, gap: 5, justifyContent: "center", minWidth: 100 }}>
                  {copied ? <><Check style={{ width: 14, height: 14 }} />Copied!</> : <><Copy style={{ width: 14, height: 14 }} />Copy Link</>}
                </button>
                <a href={`https://wa.me/?text=${encodeURIComponent(`🛍️ Shop on peadia.in! Use my link: ${referralLink}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#25D366", color: "#000", fontWeight: 700, fontSize: 13, padding: "9px 14px", borderRadius: 8, textDecoration: "none", minWidth: 100 }}>
                  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: "#000" }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Share WA
                </a>
                <button onClick={shareLink} className="btn btn-dark" style={{ flex: 1, gap: 5, justifyContent: "center", minWidth: 100 }}>
                  <Share2 style={{ width: 14, height: 14 }} />Share
                </button>
              </div>
            </div>

            {/* Orders */}
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--bd)", display: "flex", alignItems: "center", gap: 8 }}>
                <ShoppingBag style={{ width: 16, height: 16, color: NG }} />
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--tx)" }}>My Orders ({data.orders.length})</p>
              </div>
              {data.orders.length === 0 ? (
                <div style={{ padding: "36px 20px", textAlign: "center" }}>
                  <p style={{ color: "var(--tx-3)", marginBottom: 10 }}>No orders found for this number</p>
                  <Link href="/" className="btn btn-ng" style={{ display: "inline-flex" }}>Start Shopping</Link>
                </div>
              ) : (
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead><tr>{["Order","Date","Amount","Payment","Status"].map(h => <th key={h}>{h}</th>)}</tr></thead>
                    <tbody>
                      {data.orders.map(o => (
                        <tr key={o.id}>
                          <td style={{ fontWeight: 700, color: NG, fontSize: 12 }}>#{o.order_number}</td>
                          <td style={{ color: "var(--tx-3)", fontSize: 11 }}>{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                          <td style={{ fontWeight: 700 }}>₹{o.total_amount?.toLocaleString()}</td>
                          <td style={{ fontSize: 12, color: "var(--tx-3)" }}>{o.payment_method}</td>
                          <td><span className={`badge ${STATUS_CLASS[o.status] || "b-gray"}`}>{o.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Reward history */}
            {data.txns.length > 0 && (
              <div className="card" style={{ overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--bd)", display: "flex", alignItems: "center", gap: 8 }}>
                  <Star style={{ width: 16, height: 16, color: "#FFC400" }} />
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--tx)" }}>Reward History</p>
                </div>
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead><tr>{["Type","Description","Cash","Points","Date"].map(h => <th key={h}>{h}</th>)}</tr></thead>
                    <tbody>
                      {data.txns.map(t => (
                        <tr key={t.id}>
                          <td><span className="badge b-green">{t.type.replace("_", " ")}</span></td>
                          <td style={{ color: "var(--tx-3)", fontSize: 12, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</td>
                          <td style={{ fontWeight: 700, color: NG }}>{t.amount > 0 ? `+₹${t.amount}` : "—"}</td>
                          <td style={{ color: "#C084FC", fontWeight: 600 }}>{t.points > 0 ? `+${t.points}` : "—"}</td>
                          <td style={{ color: "var(--tx-3)", fontSize: 11 }}>{new Date(t.created_at).toLocaleDateString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
