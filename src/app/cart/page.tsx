"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { useSettings } from "@/lib/settings";
import { validatePromo } from "@/lib/promo";

const NG = "#00E676";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, total, itemCount } = useCart();
  const s = useSettings();
  const [coupon,    setCoupon]    = useState("");
  const [discount,  setDiscount]  = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [applying,  setApplying]  = useState(false);

  const freeMin     = s.free_delivery_min_amount ?? 499;
  const deliveryFee = total >= freeMin ? 0 : 49;
  const finalTotal  = total - discount + deliveryFee;
  const savedAmt    = items.reduce((a, i) => a + (i.product.mrp_price - i.product.sale_price) * i.quantity, 0);

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setApplying(true);
    const result = await validatePromo(coupon, total);
    setDiscount(result.discount);
    setCouponMsg(result.message);
    setApplying(false);
  };

  if (itemCount === 0) return (
    <div style={{ minHeight:"70vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:20 }}>
      <ShoppingBag style={{ width:52, height:52, color:"var(--tx-4)" }} />
      <p style={{ fontSize:20, fontWeight:700, color:"var(--tx)" }}>Your cart is empty</p>
      <p style={{ fontSize:14, color:"var(--tx-3)" }}>Add some products to get started!</p>
      <Link href="/" className="btn btn-ng">Continue Shopping</Link>
    </div>
  );

  return (
    <div style={{ padding:"24px 0 60px" }}>
      <div className="pc">
        <h1 style={{ fontSize:20, fontWeight:800, color:"var(--tx)", marginBottom:20 }}>
          Cart <span style={{ fontSize:14, fontWeight:400, color:"var(--tx-3)" }}>({itemCount})</span>
        </h1>

        <div className="cart-grid">
          {/* Items */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {items.map(item => {
              const key = `${item.product.id}-${JSON.stringify(item.variant)}`;
              const lineTotal = item.product.sale_price * item.quantity;
              const lineSaved = (item.product.mrp_price - item.product.sale_price) * item.quantity;
              return (
                <div key={key} className="card" style={{ padding:14, display:"flex", gap:12 }}>
                  <Link href={`/product/${item.product.id}`} style={{ display:"block", flexShrink:0 }}>
                    <div style={{ width:84, height:84, borderRadius:10, overflow:"hidden", background:"var(--bg-elevated)", border:"1px solid var(--bd)" }}>
                      {item.product.images?.[0] && <img src={item.product.images[0]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy" />}
                    </div>
                  </Link>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:14, fontWeight:600, color:"var(--tx)", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{item.product.title}</p>
                    {item.variant && (
                      <p style={{ fontSize:11, color:"var(--tx-3)", marginTop:2 }}>
                        {[item.variant.color && `Color: ${item.variant.color}`, item.variant.size && `Size: ${item.variant.size}`].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:10 }}>
                      <div>
                        <span style={{ fontSize:16, fontWeight:800, color:"var(--tx)" }}>₹{lineTotal.toLocaleString()}</span>
                        {lineSaved > 0 && <span style={{ fontSize:11, color:NG, marginLeft:8 }}>₹{lineSaved.toLocaleString()} saved</span>}
                      </div>
                      {/* Qty control — no JS hover handlers */}
                      <div style={{ display:"flex", alignItems:"center", border:"1px solid var(--bd)", borderRadius:7, overflow:"hidden" }}>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant)} className="btn btn-dark" style={{ width:32, height:32, padding:0, borderRadius:0, border:"none" }}>
                          <Minus style={{ width:13, height:13 }} />
                        </button>
                        <span style={{ width:36, textAlign:"center", fontWeight:700, color:"var(--tx)", fontSize:14 }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant)} className="btn btn-dark" style={{ width:32, height:32, padding:0, borderRadius:0, border:"none" }}>
                          <Plus style={{ width:13, height:13 }} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.product.id, item.variant)}
                    style={{ alignSelf:"flex-start", background:"transparent", border:"none", cursor:"pointer", color:"var(--tx-3)", padding:4, transition:"color var(--t)" }}
                    className="hover-ng">
                    <Trash2 style={{ width:16, height:16 }} />
                  </button>
                </div>
              );
            })}

            {deliveryFee === 0 ? (
              <div style={{ background:"rgba(0,230,118,0.06)", border:"1px solid rgba(0,230,118,0.20)", borderRadius:10, padding:"11px 14px", fontSize:13, color:NG, fontWeight:600 }}>
                🎉 You get FREE delivery on this order!
              </div>
            ) : (
              <div style={{ background:"rgba(96,165,250,0.06)", border:"1px solid rgba(96,165,250,0.20)", borderRadius:10, padding:"11px 14px", fontSize:13, color:"#60A5FA", fontWeight:600 }}>
                Add ₹{freeMin - total} more for FREE delivery!
              </div>
            )}
          </div>

          {/* Summary */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {/* Coupon */}
            <div className="card" style={{ padding:18 }}>
              <p style={{ fontSize:14, fontWeight:700, marginBottom:12, display:"flex", alignItems:"center", gap:6, color:"var(--tx)" }}>
                <Tag style={{ width:14, height:14, color:NG }} /> Apply Coupon
              </p>
              <div style={{ display:"flex", gap:8 }}>
                <input value={coupon}
                  onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponMsg(""); setDiscount(0); }}
                  onKeyDown={e => e.key === "Enter" && applyCoupon()}
                  placeholder={`e.g. ${s.promo_code || "PEADIA10"}`} className="inp" style={{ flex:1 }} />
                <button onClick={applyCoupon} disabled={applying} className="btn btn-dark" style={{ padding:"8px 12px", flexShrink:0 }}>
                  {applying ? "…" : "Apply"}
                </button>
              </div>
              {couponMsg && (
                <p style={{ fontSize:12, marginTop:8, color:couponMsg.startsWith("✓") ? NG : "#FF465A", fontWeight:600 }}>{couponMsg}</p>
              )}
              <p style={{ fontSize:11, color:"var(--tx-3)", marginTop:6 }}>
                Try: {s.promo_code || "PEADIA10"}, SAVE50, WELCOME, FLAT100
              </p>
            </div>

            {/* Price details */}
            <div className="card" style={{ padding:18 }}>
              <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.8px", color:"var(--tx-3)", marginBottom:14 }}>Price Details</p>
              <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
                {[
                  { l:`Price (${itemCount} items)`, v:`₹${total.toLocaleString()}`, g:false, b:false },
                  ...(savedAmt > 0 ? [{ l:"Discount on MRP", v:`−₹${savedAmt.toLocaleString()}`, g:true, b:false }] : []),
                  ...(discount > 0  ? [{ l:"Coupon Discount",  v:`−₹${discount}`,               g:true, b:false }] : []),
                  { l:"Delivery", v:deliveryFee===0 ? "FREE" : `₹${deliveryFee}`, g:deliveryFee===0, b:false },
                ].map(({ l, v, g, b }) => (
                  <div key={l} style={{ display:"flex", justifyContent:"space-between", fontSize:14 }}>
                    <span style={{ color:"var(--tx-2)" }}>{l}</span>
                    <span style={{ color:g ? NG : "var(--tx)", fontWeight:b ? 800 : 500 }}>{v}</span>
                  </div>
                ))}
                <hr className="div" />
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:16 }}>
                  <span style={{ fontWeight:700, color:"var(--tx)" }}>Total</span>
                  <span style={{ fontWeight:900, color:"var(--tx)" }}>₹{finalTotal.toLocaleString()}</span>
                </div>
                {(savedAmt + discount) > 0 && (
                  <div style={{ background:"rgba(0,230,118,0.07)", border:"1px solid rgba(0,230,118,0.18)", borderRadius:8, padding:"9px 12px", textAlign:"center", fontSize:13, fontWeight:700, color:NG }}>
                    You save ₹{(savedAmt + discount).toLocaleString()} on this order 🎉
                  </div>
                )}
              </div>
            </div>

            <Link href="/checkout" className="btn btn-ng" style={{ padding:"15px 0", fontSize:15, justifyContent:"center", textDecoration:"none" }}>
              Checkout <ArrowRight style={{ width:17, height:17 }} />
            </Link>
            <button onClick={clearCart} style={{ background:"none", border:"1px solid var(--bd)", borderRadius:8, padding:"10px 0", fontSize:13, color:"var(--tx-3)", cursor:"pointer", width:"100%", transition:"border-color var(--t)" }} className="hover-ng">
              Clear Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
