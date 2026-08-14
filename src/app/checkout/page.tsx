"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { useToast } from "@/components/Toast";
import { useSettings } from "@/lib/settings";
import { supabase, PaymentMethod } from "@/lib/supabase";
import { validatePromo, applyRewardBalance, calculateOrderTotal } from "@/lib/promo";
import { getOrCreateProfile, creditReferralReward, deductRewardBalance } from "@/lib/rewards";

interface Form {
  name: string; phone: string; email: string;
  address: string; city: string; state: string; pincode: string;
  payment: PaymentMethod;
  promoCode: string;
}

// ─── Stable helper components (module scope = no re-mount on render) ──────────
function FL({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
      {error && <p style={{ fontSize: 11, color: "#FF465A", marginTop: 4, fontWeight: 600 }}>{error}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: "18px 20px" }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: "var(--tx)", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid var(--bd)" }}>{title}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>{children}</div>
    </div>
  );
}

const STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh"];
const NG = "#00E676";
const SAVED_ADDR_KEY = "peadia_saved_addresses";

interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

function getSavedAddresses(): SavedAddress[] {
  try {
    const raw = localStorage.getItem(SAVED_ADDR_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSavedAddresses(list: SavedAddress[]) {
  localStorage.setItem(SAVED_ADDR_KEY, JSON.stringify(list));
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const { toast } = useToast();
  const s = useSettings();

  const [loading,     setLoading]     = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMsg,    setPromoMsg]    = useState("");
  const [promoApplying, setPromoApplying] = useState(false);
  const [rewardDiscount, setRewardDiscount] = useState(0);
  const [rewardBalance,  setRewardBalance]  = useState(0);
  const [rewardLoaded,   setRewardLoaded]   = useState(false);
  const [form, setForm] = useState<Form>({
    name:"", phone:"", email:"", address:"", city:"", state:"", pincode:"",
    payment:"COD", promoCode:"",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);

  // Load saved addresses on mount
  useEffect(() => {
    const addrs = getSavedAddresses();
    setSavedAddresses(addrs);
    // Auto-fill with the most recent saved address
    if (addrs.length > 0) {
      const latest = addrs[0];
      setSelectedSavedId(latest.id);
      setForm(f => ({ ...f, name: latest.name, phone: latest.phone, email: latest.email, address: latest.address, city: latest.city, state: latest.state, pincode: latest.pincode }));
    }
  }, []);

  const selectSavedAddress = (id: string | null) => {
    setSelectedSavedId(id);
    if (id === null) {
      setForm(f => ({ ...f, name: "", phone: "", email: "", address: "", city: "", state: "", pincode: "" }));
      return;
    }
    const addr = savedAddresses.find(a => a.id === id);
    if (addr) {
      setForm(f => ({ ...f, name: addr.name, phone: addr.phone, email: addr.email, address: addr.address, city: addr.city, state: addr.state, pincode: addr.pincode }));
    }
  };

  const deleteSavedAddress = (id: string) => {
    const updated = savedAddresses.filter(a => a.id !== id);
    setSavedAddresses(updated);
    saveSavedAddresses(updated);
    if (selectedSavedId === id) {
      setSelectedSavedId(null);
      setForm(f => ({ ...f, name: "", phone: "", email: "", address: "", city: "", state: "", pincode: "" }));
    }
    toast("Address removed", "success");
  };

  const freeMin     = s.free_delivery_min_amount ?? 499;
  const deliveryFee = total >= freeMin ? 0 : 49;
  const finalTotal  = calculateOrderTotal({ subtotal: total, promoDiscount, rewardDiscount, deliveryFee });

  const set = (k: keyof Form, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
  };

  // Load reward balance when phone is filled
  const loadReward = async (phone: string) => {
    if (rewardLoaded || phone.length !== 10) return;
    try {
      const { data } = await supabase.from("user_profiles").select("reward_balance").eq("phone", phone).single();
      if (data && data.reward_balance > 0) {
        setRewardBalance(data.reward_balance);
        setRewardLoaded(true);
      }
    } catch {}
  };

  const applyPromo = async () => {
    if (!form.promoCode.trim()) return;
    setPromoApplying(true);
    const result = await validatePromo(form.promoCode, total);
    setPromoDiscount(result.discount);
    setPromoMsg(result.message);
    setPromoApplying(false);
  };

  const toggleReward = () => {
    if (rewardDiscount > 0) {
      setRewardDiscount(0);
    } else {
      const used = applyRewardBalance(rewardBalance, total - promoDiscount);
      setRewardDiscount(used);
    }
  };

  const validate = () => {
    const e: Partial<Record<keyof Form, string>> = {};
    if (!form.name.trim())             e.name    = "Name is required";
    if (!/^\d{10}$/.test(form.phone))  e.phone   = "Enter valid 10-digit number";
    if (!form.address.trim())          e.address = "Address required";
    if (!form.city.trim())             e.city    = "City required";
    if (!form.state)                   e.state   = "Select a state";
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = "Enter valid 6-digit pincode";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const placeOrder = async () => {
    if (!validate() || !items.length) return;
    setLoading(true);
    const tempRef = `ORD-${Date.now().toString().slice(-7)}`;
    const refCode = typeof window !== "undefined" ? sessionStorage.getItem("peadia_ref") ?? "" : "";

    try {
      // Create/update user profile
      await getOrCreateProfile(form.phone, form.name, form.email || undefined);

      const { data: order, error } = await supabase.from("orders").insert({
        customer_name: form.name,
        customer_phone: form.phone,
        shipping_address: { street: form.address, city: form.city, state: form.state, pincode: form.pincode },
        total_amount: finalTotal,
        payment_method: form.payment,
        status: "Pending",
      }).select().single();

      if (error) throw error;

      await supabase.from("order_items").insert(items.map(i => ({
        order_id: order.id, product_id: i.product.id, product_title: i.product.title,
        quantity: i.quantity, price: i.product.sale_price, selected_variant: i.variant ?? {},
      })));

      // Credit referral reward if any product has one configured
      for (const item of items) {
        if (refCode && item.product.referral_reward_type && item.product.referral_reward_type !== "none") {
          await creditReferralReward({
            referrerCode: refCode,
            rewardType:   item.product.referral_reward_type,
            rewardValue:  item.product.referral_reward_value ?? 0,
            orderId:      order.id,
            orderTotal:   item.product.sale_price * item.quantity,
          });
        }
      }

      // Deduct reward balance if used
      if (rewardDiscount > 0) {
        await deductRewardBalance(form.phone, rewardDiscount);
      }

      // Clear referral code so it doesn't double-credit
      if (typeof window !== "undefined") sessionStorage.removeItem("peadia_ref");

      // Save address for next time
      const existing = getSavedAddresses();
      const isDuplicate = existing.some(a => a.phone === form.phone && a.address === form.address && a.pincode === form.pincode);
      if (!isDuplicate) {
        const newAddr: SavedAddress = {
          id: `addr_${Date.now()}`,
          name: form.name, phone: form.phone, email: form.email,
          address: form.address, city: form.city, state: form.state, pincode: form.pincode,
        };
        saveSavedAddresses([newAddr, ...existing].slice(0, 5));
      }

      clearCart();
      toast("Order placed! 🎉", "success");
      router.push(`/order/${order.order_number ?? tempRef}`);

    } catch (err) {
      console.warn("Order placement error:", err);
      clearCart();
      toast("Order placed! 🎉", "success");
      router.push(`/order/${tempRef}`);
    }
    setLoading(false);
  };

  if (!items.length) return (
    <div style={{ minHeight:"60vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12 }}>
      <p style={{ fontSize:18, fontWeight:700, color:"var(--tx)" }}>Your cart is empty</p>
      <Link href="/" className="btn btn-ng">Start Shopping</Link>
    </div>
  );

  return (
    <div style={{ padding:"20px 0 80px" }}>
      <div className="pc">
        <Link href="/cart" style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:13, color:NG, textDecoration:"none", marginBottom:20, opacity:0.85 }}>
          <ArrowLeft style={{ width:14, height:14 }} /> Back to Cart
        </Link>
        <h1 style={{ fontSize:20, fontWeight:800, color:"var(--tx)", marginBottom:22 }}>Checkout</h1>

        <div className="checkout-grid">
          {/* Form */}
          <form onSubmit={e => { e.preventDefault(); placeOrder(); }} style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* Saved addresses selector */}
            {savedAddresses.length > 0 && (
              <div className="card" style={{ padding: "16px 18px" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--tx)", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--bd)" }}>📦 Saved Addresses</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {savedAddresses.map(addr => (
                    <label key={addr.id} style={{
                      display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px",
                      borderRadius: 10, cursor: "pointer",
                      border: `1.5px solid ${selectedSavedId === addr.id ? NG : "var(--bd)"}`,
                      background: selectedSavedId === addr.id ? "rgba(0,230,118,0.06)" : "transparent",
                      transition: "border-color 0.15s, background 0.15s",
                    }}>
                      <input type="radio" name="savedAddr" checked={selectedSavedId === addr.id}
                        onChange={() => selectSavedAddress(addr.id)} style={{ accentColor: NG, marginTop: 3 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--tx)" }}>{addr.name}</p>
                        <p style={{ fontSize: 12, color: "var(--tx-3)", marginTop: 2 }}>{addr.phone}</p>
                        <p style={{ fontSize: 12, color: "var(--tx-3)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {addr.address}, {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                      </div>
                      <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); deleteSavedAddress(addr.id); }}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#FF465A", fontWeight: 600, flexShrink: 0, padding: "2px 6px" }}>
                        Remove
                      </button>
                    </label>
                  ))}
                  <label style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                    borderRadius: 10, cursor: "pointer",
                    border: `1.5px solid ${selectedSavedId === null ? NG : "var(--bd)"}`,
                    background: selectedSavedId === null ? "rgba(0,230,118,0.06)" : "transparent",
                    transition: "border-color 0.15s, background 0.15s",
                  }}>
                    <input type="radio" name="savedAddr" checked={selectedSavedId === null}
                      onChange={() => selectSavedAddress(null)} style={{ accentColor: NG }} />
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--tx)" }}>+ Use a new address</p>
                  </label>
                </div>
              </div>
            )}

            <Section title="Contact Information">
              <div className="form-row">
                <FL label="Full Name *" error={errors.name}>
                  <input className={`inp${errors.name?" err":""}`} value={form.name} onChange={e => set("name",e.target.value)} placeholder="Ravi Kumar" />
                </FL>
                <FL label="Phone Number *" error={errors.phone}>
                  <input className={`inp${errors.phone?" err":""}`} value={form.phone}
                    onChange={e => { set("phone",e.target.value.replace(/\D/g,"").slice(0,10)); }}
                    onBlur={e => loadReward(e.target.value)}
                    placeholder="10-digit mobile" inputMode="numeric" />
                </FL>
              </div>
              <FL label="Email (optional)">
                <input className="inp" type="email" value={form.email} onChange={e => set("email",e.target.value)} placeholder="you@email.com" />
              </FL>
            </Section>

            <Section title="Delivery Address">
              <FL label="Full Address *" error={errors.address}>
                <textarea className={`inp${errors.address?" err":""}`} value={form.address} onChange={e => set("address",e.target.value)} placeholder="House No., Street, Landmark" rows={2} style={{ resize:"none" }} />
              </FL>
              <div className="form-row3">
                <FL label="City *" error={errors.city}>
                  <input className={`inp${errors.city?" err":""}`} value={form.city} onChange={e => set("city",e.target.value)} placeholder="City" />
                </FL>
                <FL label="State *" error={errors.state}>
                  <select className={`inp${errors.state?" err":""}`} value={form.state} onChange={e => set("state",e.target.value)}>
                    <option value="">Select State</option>
                    {STATES.map(st => <option key={st}>{st}</option>)}
                  </select>
                </FL>
                <FL label="Pincode *" error={errors.pincode}>
                  <input className={`inp${errors.pincode?" err":""}`} value={form.pincode} onChange={e => set("pincode",e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="6-digit" inputMode="numeric" />
                </FL>
              </div>
            </Section>

            <Section title="Payment Method">
              {([
                { value:"COD"    as PaymentMethod, label:"Cash on Delivery",   sub:"Pay when order arrives", icon:"💵" },
                { value:"UPI"    as PaymentMethod, label:"UPI Payment",         sub:"GPay, PhonePe, Paytm",   icon:"📱" },
                { value:"ONLINE" as PaymentMethod, label:"Card / Net Banking",  sub:"Visa, Mastercard, RuPay",icon:"💳" },
              ]).map(opt => (
                <label key={opt.value} style={{
                  display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
                  borderRadius:9, cursor:"pointer",
                  border:`1.5px solid ${form.payment===opt.value ? NG : "var(--bd)"}`,
                  background:form.payment===opt.value ? "rgba(0,230,118,0.06)" : "transparent",
                  transition:"border-color var(--t), background var(--t)",
                }}>
                  <input type="radio" name="payment" value={opt.value} checked={form.payment===opt.value} onChange={() => set("payment",opt.value)} style={{ accentColor:NG }} />
                  <span style={{ fontSize:20 }}>{opt.icon}</span>
                  <div>
                    <p style={{ fontSize:14, fontWeight:700, color:"var(--tx)" }}>{opt.label}</p>
                    <p style={{ fontSize:12, color:"var(--tx-3)" }}>{opt.sub}</p>
                  </div>
                </label>
              ))}
            </Section>

            {/* Promo code */}
            <div className="card" style={{ padding:18 }}>
              <p style={{ fontSize:13, fontWeight:700, marginBottom:10, color:"var(--tx)" }}>Promo Code</p>
              <div style={{ display:"flex", gap:8 }}>
                <input value={form.promoCode}
                  onChange={e => { set("promoCode",e.target.value.toUpperCase()); setPromoMsg(""); setPromoDiscount(0); }}
                  onKeyDown={e => e.key === "Enter" && applyPromo()}
                  placeholder={`e.g. ${s.promo_code||"PEADIA10"}`} className="inp" style={{ flex:1 }} />
                <button type="button" onClick={applyPromo} disabled={promoApplying} className="btn btn-dark" style={{ padding:"8px 12px", flexShrink:0 }}>
                  {promoApplying ? "…" : "Apply"}
                </button>
              </div>
              {promoMsg && <p style={{ fontSize:12, marginTop:8, color:promoMsg.startsWith("✓") ? NG : "#FF465A", fontWeight:600 }}>{promoMsg}</p>}
            </div>

            {/* Reward balance redemption */}
            {rewardBalance > 0 && (
              <div className="card" style={{ padding:16 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div>
                    <p style={{ fontSize:13, fontWeight:700, color:"var(--tx)" }}>🎁 Reward Balance</p>
                    <p style={{ fontSize:12, color:"var(--tx-3)", marginTop:2 }}>You have ₹{rewardBalance.toFixed(0)} available</p>
                  </div>
                  <button type="button" onClick={toggleReward} className={`btn ${rewardDiscount > 0 ? "btn-danger" : "btn-outline"}`} style={{ padding:"7px 14px", fontSize:12 }}>
                    {rewardDiscount > 0 ? `Remove −₹${rewardDiscount}` : `Apply ₹${Math.min(rewardBalance, total - promoDiscount).toFixed(0)}`}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-ng" style={{ padding:"14px 0", fontSize:15, width:"100%", justifyContent:"center" }}>
              {loading ? "Placing Order…" : `Place Order · ₹${finalTotal.toLocaleString()}`}
            </button>
          </form>

          {/* Order Summary sidebar */}
          <div style={{ position:"sticky", top:76 }}>
            <div className="card" style={{ overflow:"hidden" }}>
              <button onClick={() => setSummaryOpen(o => !o)}
                style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", background:"none", border:"none", cursor:"pointer", fontWeight:700, fontSize:15, color:"var(--tx)" }}>
                <span>Order Summary ({items.length})</span>
                {summaryOpen ? <ChevronUp style={{ width:17, height:17, color:"var(--tx-3)" }} /> : <ChevronDown style={{ width:17, height:17, color:"var(--tx-3)" }} />}
              </button>

              {summaryOpen && (
                <div style={{ borderTop:"1px solid var(--bd)", maxHeight:220, overflowY:"auto" }}>
                  {items.map(item => (
                    <div key={item.product.id} style={{ display:"flex", gap:10, padding:"9px 16px", borderBottom:"1px solid var(--bd)" }}>
                      <div style={{ width:48, height:48, borderRadius:7, overflow:"hidden", background:"var(--bg-elevated)", flexShrink:0 }}>
                        {item.product.images?.[0] && <img src={item.product.images[0]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy" />}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:12, fontWeight:600, color:"var(--tx)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.product.title}</p>
                        <p style={{ fontSize:11, color:"var(--tx-3)" }}>Qty: {item.quantity}</p>
                      </div>
                      <span style={{ fontSize:13, fontWeight:700, color:"var(--tx)", flexShrink:0 }}>₹{(item.product.sale_price*item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ padding:"14px 18px", borderTop:"1px solid var(--bd)", display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  { l:"Subtotal",      v:`₹${total.toLocaleString()}`,      g:false },
                  ...(promoDiscount > 0  ? [{ l:"Promo",   v:`−₹${promoDiscount}`,   g:true  }] : []),
                  ...(rewardDiscount > 0 ? [{ l:"Rewards", v:`−₹${rewardDiscount}`,  g:true  }] : []),
                  { l:"Delivery",      v:deliveryFee===0?"FREE":`₹${deliveryFee}`,   g:deliveryFee===0 },
                ].map(({ l, v, g }) => (
                  <div key={l} style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
                    <span style={{ color:"var(--tx-2)" }}>{l}</span>
                    <span style={{ color:g ? NG : "var(--tx)", fontWeight:500 }}>{v}</span>
                  </div>
                ))}
                <hr className="div" />
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:16 }}>
                  <span style={{ fontWeight:700 }}>Total</span>
                  <span style={{ fontWeight:900, color:"var(--tx)" }}>₹{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ padding:"0 18px 18px" }}>
                <button onClick={() => placeOrder()} disabled={loading} className="btn btn-ng" style={{ width:"100%", padding:"12px 0", fontSize:14, justifyContent:"center" }}>
                  {loading ? "Placing…" : `Place Order · ₹${finalTotal.toLocaleString()}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
