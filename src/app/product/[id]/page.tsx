"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Star, Truck, ShieldCheck, RefreshCw, ShoppingCart, Zap, MapPin, Gift } from "lucide-react";
import { supabase, Product } from "@/lib/supabase";
import { demoProducts } from "@/lib/demoData";
import { useCart } from "@/components/CartProvider";
import { useToast } from "@/components/Toast";
import { ProductCard } from "@/components/ProductCard";
import { ReviewSection } from "@/components/ReviewSection";

const NG = "#00E676";

export default function ProductPage() {
  const { id } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref"); // referral code from URL

  const [product,  setProduct]  = useState<Product | null>(null);
  const [related,  setRelated]  = useState<Product[]>([]);
  const [imgIdx,   setImgIdx]   = useState(0);
  const [qty,      setQty]      = useState(1);
  const [selColor, setSelColor] = useState("");
  const [selSize,  setSelSize]  = useState("");
  const [loading,  setLoading]  = useState(true);
  const [pincode,  setPincode]  = useState("");
  const [pincMsg,  setPincMsg]  = useState("");
  const { addItem }  = useCart();
  const { toast }    = useToast();

  // Persist referral code so checkout can use it
  useEffect(() => {
    if (refCode) sessionStorage.setItem("peadia_ref", refCode);
  }, [refCode]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data } = await supabase.from("products").select("*").eq("id", id).single();
        if (data) {
          const p = data as Product;
          setProduct(p);
          const vs = Array.isArray(p.variants) ? p.variants : [];
          setSelColor(vs.find(v => v.color)?.color ?? "");
          setSelSize(vs.find(v => v.size)?.size ?? "");
          // Fetch related products (same category, exclude current)
          if (p.category_id) {
            const { data: rel } = await supabase
              .from("products").select("*")
              .eq("category_id", p.category_id)
              .eq("is_active", true)
              .neq("id", id)
              .limit(6);
            if (rel?.length) setRelated(rel as Product[]);
          }
        }
      } catch {
        const demo = demoProducts.find(p => p.id === id) ?? demoProducts[0];
        if (demo) {
          setProduct(demo);
          const vs = Array.isArray(demo.variants) ? demo.variants : [];
          setSelColor(vs.find(v => v.color)?.color ?? "");
          setSelSize(vs.find(v => v.size)?.size ?? "");
          setRelated(demoProducts.filter(p => p.id !== id).slice(0, 6));
        }
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return (
    <div className="pc" style={{ paddingTop: 28 }}>
      <div className="pdp-grid">
        <div className="shimmer" style={{ aspectRatio: "1", borderRadius: 16 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="shimmer" style={{ height: 28, width: "80%", borderRadius: 6 }} />
          <div className="shimmer" style={{ height: 20, width: "40%", borderRadius: 6 }} />
          <div className="shimmer" style={{ height: 48, width: "65%", borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div style={{ textAlign: "center", padding: "80px 16px" }}>
      <p style={{ fontSize: 18, color: "var(--tx-3)" }}>Product not found</p>
      <Link href="/" className="btn btn-ng" style={{ display: "inline-flex", marginTop: 16 }}>← Go Home</Link>
    </div>
  );

  const discount = product.mrp_price > product.sale_price
    ? Math.round(((product.mrp_price - product.sale_price) / product.mrp_price) * 100) : 0;
  const images   = product.images?.length ? product.images : ["https://via.placeholder.com/600"];
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const colors   = [...new Set(variants.map(v => v.color).filter(Boolean))] as string[];
  const sizes    = [...new Set(variants.map(v => v.size).filter(Boolean))] as string[];
  const activeVariant = variants.find(v => (selColor ? v.color === selColor : true) && (selSize ? v.size === selSize : true));
  const displayPrice = activeVariant?.price ?? product.sale_price;
  const displayMrp   = activeVariant?.mrp   ?? product.mrp_price;
  const displayStock = activeVariant?.stock  ?? product.stock;
  const currentImg   = activeVariant?.image_url || images[imgIdx];

  const delivDays  = product.estimated_delivery_days ?? 3;
  const delivCharge = product.delivery_charge ?? 0;
  const returnable  = product.is_returnable !== false;

  const hasReferralReward = product.referral_reward_type && product.referral_reward_type !== "none" && (product.referral_reward_value ?? 0) > 0;
  const rewardLabel = hasReferralReward
    ? product.referral_reward_type === "cash"    ? `Share & earn ₹${product.referral_reward_value}`
    : product.referral_reward_type === "percent" ? `Share & earn ${product.referral_reward_value}% back`
    : `Share & earn ${product.referral_reward_value} points`
    : null;

  const handleAddToCart = () => {
    addItem(product, qty, { color: selColor, size: selSize });
    toast("Added to cart!", "success");
  };

  const handleBuyNow = () => {
    addItem(product, qty, { color: selColor, size: selSize });
    window.location.href = "/checkout";
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <div className="pc" style={{ paddingTop: 20 }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: NG, textDecoration: "none", marginBottom: 20, opacity: 0.8 }}>
          <ChevronLeft style={{ width: 14, height: 14 }} /> Back
        </Link>

        <div className="pdp-grid">
          {/* ── Images ── */}
          <div>
            <div style={{ borderRadius: 16, overflow: "hidden", background: "var(--bg-elevated)", aspectRatio: "1", position: "relative", border: "1px solid var(--bd)", boxShadow: "var(--sh-md)" }}>
              <img src={currentImg} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "opacity 0.3s" }} />
              {discount > 0 && (
                <div style={{ position: "absolute", top: 12, left: 12, background: `linear-gradient(135deg,${NG},#00FF88)`, color: "#0D1117", fontSize: 13, fontWeight: 800, padding: "4px 11px", borderRadius: 99, boxShadow: "0 0 14px rgba(0,230,118,0.40)" }}>
                  {discount}% OFF
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} style={{ width: 60, height: 60, borderRadius: 9, overflow: "hidden", border: `2px solid ${i === imgIdx ? NG : "var(--bd)"}`, background: "var(--bg-elevated)", cursor: "pointer", padding: 0, transition: "all 0.15s", boxShadow: i === imgIdx ? `0 0 8px rgba(0,230,118,0.30)` : "none" }}>
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Details ── */}
          <div>
            {product.brand_name && (
              <p style={{ fontSize: 11, fontWeight: 700, color: NG, letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 5, opacity: 0.7 }}>{product.brand_name}</p>
            )}
            <h1 style={{ fontSize: "clamp(18px,2.5vw,24px)", fontWeight: 900, color: "var(--tx)", lineHeight: 1.35, marginBottom: 14 }}>{product.title}</h1>

            {/* Rating */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(0,230,118,0.10)", border: "1px solid rgba(0,230,118,0.22)", padding: "3px 9px", borderRadius: 6 }}>
                <span style={{ fontWeight: 700, color: NG, fontSize: 13 }}>4.2</span>
                <Star style={{ width: 12, height: 12, fill: NG, color: NG }} />
              </div>
              <span style={{ fontSize: 12, color: "var(--tx-3)" }}>1,234 ratings</span>
            </div>

            {/* Price */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 18, padding: "14px 16px", borderRadius: 12, background: "var(--bg-elevated)", border: "1px solid var(--bd)" }}>
              <span style={{ fontSize: 30, fontWeight: 900, color: "var(--tx)" }}>₹{(displayPrice * qty).toLocaleString()}</span>
              {discount > 0 && (
                <>
                  <span style={{ fontSize: 16, color: "var(--tx-3)", textDecoration: "line-through" }}>₹{displayMrp.toLocaleString()}</span>
                  <span style={{ fontSize: 14, color: NG, fontWeight: 700 }}>{discount}% off</span>
                </>
              )}
            </div>

            {/* Stock */}
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: displayStock > 0 ? NG : "#FF465A" }}>
              {displayStock > 0 ? `✓ In Stock — ${displayStock} available` : "✗ Out of Stock"}
            </p>

            {/* Colors */}
            {colors.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "var(--tx-2)" }}>Color: <span style={{ color: "var(--tx)", fontWeight: 400 }}>{selColor}</span></p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {colors.map(c => (
                    <button key={c} onClick={() => setSelColor(c)} style={{ padding: "6px 14px", borderRadius: 99, fontSize: 13, cursor: "pointer", border: `1.5px solid ${c === selColor ? NG : "var(--bd)"}`, background: c === selColor ? "rgba(0,230,118,0.08)" : "transparent", color: c === selColor ? NG : "var(--tx-2)", fontWeight: c === selColor ? 700 : 400, boxShadow: c === selColor ? `0 0 8px rgba(0,230,118,0.22)` : "none", transition: "all 0.15s" }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {sizes.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "var(--tx-2)" }}>Size: <span style={{ color: "var(--tx)", fontWeight: 400 }}>{selSize}</span></p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {sizes.map(s => (
                    <button key={s} onClick={() => setSelSize(s)} style={{ width: 44, height: 44, borderRadius: 9, fontSize: 13, cursor: "pointer", border: `1.5px solid ${s === selSize ? NG : "var(--bd)"}`, background: s === selSize ? "rgba(0,230,118,0.08)" : "transparent", color: s === selSize ? NG : "var(--tx-2)", fontWeight: s === selSize ? 700 : 400, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: s === selSize ? `0 0 8px rgba(0,230,118,0.22)` : "none", transition: "all 0.15s" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--tx-2)" }}>Qty</p>
              <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--bd)", borderRadius: 9, overflow: "hidden", background: "var(--bg-elevated)" }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 38, height: 38, border: "none", background: "transparent", cursor: "pointer", fontSize: 18, fontWeight: 700, color: "var(--tx-2)", transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = NG)} onMouseLeave={e => (e.currentTarget.style.color = "var(--tx-2)")}>−</button>
                <span style={{ width: 40, textAlign: "center", fontWeight: 800, color: "var(--tx)", fontSize: 15 }}>{qty}</span>
                <button onClick={() => setQty(Math.min(displayStock, qty + 1))} style={{ width: 38, height: 38, border: "none", background: "transparent", cursor: "pointer", fontSize: 18, fontWeight: 700, color: "var(--tx-2)", transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = NG)} onMouseLeave={e => (e.currentTarget.style.color = "var(--tx-2)")}>+</button>
              </div>
            </div>

            {/* ── Highlighted CTA Buttons ── */}
            <div style={{ display: "flex", gap: 12, marginBottom: 22 }}>
              {/* Add to Cart — outlined neon with glow */}
              <button onClick={handleAddToCart} disabled={displayStock === 0}
                style={{
                  flex: 1, padding: "14px 0", borderRadius: 10, cursor: displayStock === 0 ? "not-allowed" : "pointer",
                  border: `2px solid ${NG}`,
                  background: "rgba(0,230,118,0.06)",
                  color: NG, fontWeight: 800, fontSize: 15,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  boxShadow: displayStock > 0 ? `0 0 20px rgba(0,230,118,0.22), 0 0 40px rgba(0,230,118,0.08)` : "none",
                  transition: "all 0.2s",
                  opacity: displayStock === 0 ? 0.4 : 1,
                }}
                onMouseEnter={e => { if (displayStock > 0) { const b = e.currentTarget; b.style.background = "rgba(0,230,118,0.14)"; b.style.boxShadow = "0 0 28px rgba(0,230,118,0.38), 0 0 60px rgba(0,230,118,0.12)"; } }}
                onMouseLeave={e => { const b = e.currentTarget; b.style.background = "rgba(0,230,118,0.06)"; b.style.boxShadow = "0 0 20px rgba(0,230,118,0.22), 0 0 40px rgba(0,230,118,0.08)"; }}>
                <ShoppingCart style={{ width: 18, height: 18 }} />
                Add to Cart
              </button>

              {/* Buy Now — solid neon with stronger glow */}
              <button onClick={handleBuyNow} disabled={displayStock === 0}
                style={{
                  flex: 1, padding: "14px 0", borderRadius: 10, cursor: displayStock === 0 ? "not-allowed" : "pointer",
                  border: "2px solid transparent",
                  background: `linear-gradient(135deg, ${NG} 0%, #00FF88 100%)`,
                  color: "#0D1117", fontWeight: 900, fontSize: 15,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  boxShadow: displayStock > 0 ? `0 0 28px rgba(0,230,118,0.50), 0 4px 20px rgba(0,230,118,0.30)` : "none",
                  transition: "all 0.2s",
                  opacity: displayStock === 0 ? 0.4 : 1,
                  letterSpacing: "0.02em",
                }}
                onMouseEnter={e => { if (displayStock > 0) { const b = e.currentTarget; b.style.transform = "translateY(-2px)"; b.style.boxShadow = "0 0 40px rgba(0,230,118,0.65), 0 6px 28px rgba(0,230,118,0.40)"; } }}
                onMouseLeave={e => { const b = e.currentTarget; b.style.transform = "translateY(0)"; b.style.boxShadow = "0 0 28px rgba(0,230,118,0.50), 0 4px 20px rgba(0,230,118,0.30)"; }}>
                <Zap style={{ width: 18, height: 18 }} />
                Buy Now
              </button>
            </div>

            {/* Referral reward badge */}
            {rewardLabel && (
              <div style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(192,132,252,0.08)", border: "1px solid rgba(192,132,252,0.22)", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
                <Gift style={{ width: 16, height: 16, color: "#C084FC", flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#C084FC" }}>{rewardLabel}</p>
                  <p style={{ fontSize: 11, color: "var(--tx-3)", marginTop: 1 }}>Share your referral link — when a friend buys this, you earn automatically!</p>
                </div>
                <Link href="/profile" style={{ marginLeft: "auto", fontSize: 11, color: "#C084FC", textDecoration: "none", fontWeight: 700, padding: "4px 10px", border: "1px solid rgba(192,132,252,0.30)", borderRadius: 99, whiteSpace: "nowrap" }}>
                  My Link
                </Link>
              </div>
            )}

            {/* Delivery badges */}
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(0,230,118,0.07)", border: "1px solid rgba(0,230,118,0.18)", borderRadius: 99, padding: "6px 12px" }}>
                <Truck style={{ width: 13, height: 13, color: NG }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: NG }}>
                  {delivCharge === 0 ? "FREE Delivery" : `₹${delivCharge} Delivery`} in {delivDays}–{delivDays + 1} Days
                </span>
              </div>
              {returnable && (
                <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(96,165,250,0.07)", border: "1px solid rgba(96,165,250,0.20)", borderRadius: 99, padding: "6px 12px" }}>
                  <RefreshCw style={{ width: 13, height: 13, color: "#60A5FA" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#60A5FA" }}>7-Day Easy Return</span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(192,132,252,0.07)", border: "1px solid rgba(192,132,252,0.20)", borderRadius: 99, padding: "6px 12px" }}>
                <ShieldCheck style={{ width: 13, height: 13, color: "#C084FC" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#C084FC" }}>100% Genuine</span>
              </div>
            </div>

            {/* Pincode checker */}
            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--bd)", borderRadius: 12, padding: 14, marginBottom: 18 }}>
              <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 9, color: "var(--tx-2)", display: "flex", alignItems: "center", gap: 5 }}>
                <MapPin style={{ width: 13, height: 13 }} /> Check Delivery
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={pincode} onChange={e => { setPincode(e.target.value.replace(/\D/g,"").slice(0,6)); setPincMsg(""); }}
                  placeholder="Enter 6-digit pincode" className="inp" style={{ flex: 1 }} />
                <button onClick={() => {
                  if (pincode.length !== 6) { setPincMsg("Enter valid 6-digit pincode"); return; }
                  setPincMsg(`✓ Delivery in ${delivDays}–${delivDays + 1} days · ${delivCharge === 0 ? "FREE" : `₹${delivCharge}`}`);
                }} className="btn btn-dark" style={{ flexShrink: 0, padding: "8px 14px" }}>
                  Check
                </button>
              </div>
              {pincMsg && <p style={{ fontSize: 12, marginTop: 7, color: pincMsg.startsWith("✓") ? NG : "#FF465A", fontWeight: 600 }}>{pincMsg}</p>}
            </div>

            {/* Description */}
            {product.description && (
              <div style={{ paddingTop: 18, borderTop: "1px solid var(--bd)" }}>
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "var(--tx)" }}>Product Details</p>
                {product.brand_name && <p style={{ fontSize: 13, color: "var(--tx-3)", marginBottom: 3 }}>Brand: {product.brand_name}</p>}
                {product.sku && <p style={{ fontSize: 13, color: "var(--tx-3)", marginBottom: 8 }}>SKU: {product.sku}</p>}
                <p style={{ fontSize: 14, color: "var(--tx-2)", lineHeight: 1.85, whiteSpace: "pre-line" }}>{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Related Products ── */}
        {related.length > 0 && (
          <section style={{ marginTop: 52, paddingTop: 32, borderTop: "1px solid var(--bd)" }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: "var(--tx)", marginBottom: 18 }}>You Might Also Like</p>
            <div className="pgrid">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>

      {/* Product Reviews */}
      <div style={{ padding: "0 0 20px" }}>
        <div className="pc">
          {product && <ReviewSection productId={product.id} />}
        </div>
      </div>

      <div style={{ position: "fixed", bottom: 56, left: 0, right: 0, background: "rgba(13,17,23,0.96)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(0,230,118,0.20)", padding: "10px 14px", display: "flex", gap: 10, zIndex: 40 }} className="mob-cta">
        <button onClick={handleAddToCart} disabled={displayStock === 0}
          style={{ flex: 1, padding: "11px 0", borderRadius: 9, border: `2px solid ${NG}`, background: "rgba(0,230,118,0.08)", color: NG, fontWeight: 800, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          <ShoppingCart style={{ width: 15, height: 15 }} />Cart
        </button>
        <button onClick={handleBuyNow} disabled={displayStock === 0}
          style={{ flex: 1.5, padding: "11px 0", borderRadius: 9, border: "none", background: `linear-gradient(135deg,${NG},#00FF88)`, color: "#0D1117", fontWeight: 900, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, boxShadow: "0 0 20px rgba(0,230,118,0.45)" }}>
          <Zap style={{ width: 15, height: 15 }} />Buy Now
        </button>
      </div>
      <style>{`@media(min-width:768px){.mob-cta{display:none!important;}}`}</style>
    </div>
  );
}
