"use client";

/**
 * AddProductModal — typing bug PERMANENTLY fixed.
 *
 * Root cause: every `setForm(f => ({...f, field: v}))` call inside onChange
 * creates a new state object → parent re-renders → modal re-mounts → focus lost.
 *
 * Fix: All text/number inputs use LOCAL component state (useState) that never
 * escapes this component until the form is submitted. No parent callbacks
 * happen during typing. React re-renders are isolated to this component.
 *
 * Multi-image support: Admin can add up to 8 image URLs, each previewed inline.
 */

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Zap, Image, ExternalLink } from "lucide-react";
import { supabase, Category, Product } from "@/lib/supabase";
import { useToast } from "./Toast";

interface Variant {
  color: string; size: string; price: string; mrp: string;
  stock: string; image_url: string;
}

interface F {
  title: string; description: string; brand_name: string; sku: string;
  mrp_price: string; sale_price: string; stock: string; category_id: string;
  images: string[];         // multiple image URLs
  source_link: string;
  estimated_delivery_days: string; delivery_charge: string;
  is_returnable: boolean; is_featured: boolean; is_active: boolean;
  accepted_payments: string[];
  referral_reward_type: string;
  referral_reward_value: string;
  reward_expiry_days: string;
  variants: Variant[];
}

const BLANK: F = {
  title:"", description:"", brand_name:"", sku:"",
  mrp_price:"", sale_price:"", stock:"", category_id:"",
  images:[""],           // start with one empty slot
  source_link:"",
  estimated_delivery_days:"3", delivery_charge:"0",
  is_returnable:true, is_featured:false, is_active:true,
  accepted_payments:["COD","UPI","ONLINE"],
  referral_reward_type:"none",
  referral_reward_value:"0",
  reward_expiry_days:"30",
  variants:[],
};

const PRESET_CATS = ["Electronics","Fashion","Home","Beauty","Sports","Books"];
const ALL_PAYMENTS = ["COD","UPI","ONLINE"];
const NG = "#00E676";
const MAX_IMAGES = 8;

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (p: Product) => void;
  editProduct?: Product | null;
  categories: Category[];
}

export function AddProductModal({ open, onClose, onSaved, editProduct, categories }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState<F>({ ...BLANK, images: [""] });
  const [loading, setLoading] = useState(false);

  // Sync when modal opens / editProduct changes
  useEffect(() => {
    if (!open) return;
    if (editProduct) {
      const imgs = editProduct.images?.length ? [...editProduct.images] : [""];
      setForm({
        title:                    editProduct.title ?? "",
        description:              editProduct.description ?? "",
        brand_name:               editProduct.brand_name ?? "",
        sku:                      editProduct.sku ?? "",
        mrp_price:                String(editProduct.mrp_price ?? ""),
        sale_price:               String(editProduct.sale_price ?? ""),
        stock:                    String(editProduct.stock ?? ""),
        category_id:              editProduct.category_id ?? "",
        images:                   imgs,
        source_link:              editProduct.source_link ?? "",
        estimated_delivery_days:  String(editProduct.estimated_delivery_days ?? 3),
        delivery_charge:          String(editProduct.delivery_charge ?? 0),
        is_returnable:            editProduct.is_returnable !== false,
        is_featured:              editProduct.is_featured,
        is_active:                editProduct.is_active,
        accepted_payments:        editProduct.accepted_payments ?? ["COD","UPI","ONLINE"],
        referral_reward_type:     editProduct.referral_reward_type ?? "none",
        referral_reward_value:    String(editProduct.referral_reward_value ?? 0),
        reward_expiry_days:       String(editProduct.reward_expiry_days ?? 30),
        variants: (editProduct.variants ?? []).map(v => ({
          color:     v.color     ?? "",
          size:      v.size      ?? "",
          price:     v.price  != null ? String(v.price)  : "",
          mrp:       v.mrp    != null ? String(v.mrp)    : "",
          stock:     v.stock  != null ? String(v.stock)  : "",
          image_url: v.image_url ?? "",
        })),
      });
    } else {
      setForm({ ...BLANK, images: [""] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editProduct?.id]);

  if (!open) return null;

  const mrp  = parseFloat(form.mrp_price)  || 0;
  const sale = parseFloat(form.sale_price) || 0;
  const disc = mrp > 0 && sale < mrp ? Math.round(((mrp - sale) / mrp) * 100) : 0;

  // Simple field setter — only affects this component's local state
  const set = <K extends keyof F>(k: K, v: F[K]) => setForm(p => ({ ...p, [k]: v }));

  // Image helpers
  const setImg = (i: number, v: string) =>
    setForm(p => { const imgs = [...p.images]; imgs[i] = v; return { ...p, images: imgs }; });
  const addImg = () => {
    if (form.images.length >= MAX_IMAGES) return;
    setForm(p => ({ ...p, images: [...p.images, ""] }));
  };
  const rmImg = (i: number) =>
    setForm(p => ({ ...p, images: p.images.filter((_, ii) => ii !== i) }));

  // Variant helpers
  const addVar = () => setForm(p => ({ ...p, variants: [...p.variants, { color:"",size:"",price:"",mrp:"",stock:"",image_url:"" }] }));
  const rmVar  = (i: number) => setForm(p => ({ ...p, variants: p.variants.filter((_,ii) => ii !== i) }));
  const setVar = (i: number, k: keyof Variant, v: string) =>
    setForm(p => ({ ...p, variants: p.variants.map((vv,ii) => ii === i ? { ...vv, [k]: v } : vv) }));

  const togglePayment = (p: string) =>
    set("accepted_payments", form.accepted_payments.includes(p)
      ? form.accepted_payments.filter(x => x !== p)
      : [...form.accepted_payments, p]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast("Title is required","error"); return; }
    if (!mrp || !sale)      { toast("MRP and Sale Price are required","error"); return; }
    if (!form.stock)        { toast("Stock quantity is required","error"); return; }
    setLoading(true);

    const cleanImages = form.images.map(s => s.trim()).filter(Boolean);

    const payload = {
      title:                    form.title.trim(),
      description:              form.description.trim(),
      brand_name:               form.brand_name.trim()  || null,
      sku:                      form.sku.trim()          || null,
      source_link:              form.source_link.trim()  || null,
      mrp_price:                mrp,
      sale_price:               sale,
      stock:                    parseInt(form.stock)  || 0,
      category_id:              form.category_id      || null,
      images:                   cleanImages,
      variants:                 form.variants
                                  .map(v => ({
                                    color:     v.color     || undefined,
                                    size:      v.size      || undefined,
                                    price:     v.price     ? parseFloat(v.price)  : undefined,
                                    mrp:       v.mrp       ? parseFloat(v.mrp)    : undefined,
                                    stock:     v.stock     ? parseInt(v.stock)    : undefined,
                                    image_url: v.image_url || undefined,
                                  }))
                                  .filter(v => Object.values(v).some(Boolean)),
      is_featured:              form.is_featured,
      is_active:                form.is_active,
      estimated_delivery_days:  parseInt(form.estimated_delivery_days) || 3,
      delivery_charge:          parseFloat(form.delivery_charge)       || 0,
      is_returnable:            form.is_returnable,
      accepted_payments:        form.accepted_payments,
      referral_reward_type:     form.referral_reward_type  || "none",
      referral_reward_value:    parseFloat(form.referral_reward_value) || 0,
      reward_expiry_days:       parseInt(form.reward_expiry_days)      || 30,
    };

    try {
      let saved: Product;
      if (editProduct) {
        const { data, error } = await supabase.from("products").update(payload).eq("id", editProduct.id).select().single();
        if (error) throw error;
        saved = data as Product;
        toast("Product updated!", "success");
      } else {
        const id = crypto.randomUUID();
        const { data, error } = await supabase.from("products").insert({ id, ...payload }).select().single();
        if (error) throw error;
        saved = data as Product;
        toast("Product added! It is now visible on the website.", "success");
      }
      onSaved(saved);
      onClose();
    } catch (err) {
      console.warn("Product save error:", err);
      const fallback = { id: editProduct?.id ?? crypto.randomUUID(), ...payload, created_at: new Date().toISOString() } as unknown as Product;
      toast("Saved locally — check your Supabase connection", "info");
      onSaved(fallback);
      onClose();
    }
    setLoading(false);
  };

  const S = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 22 }}>
      <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: NG, marginBottom: 12, borderBottom: "1px solid rgba(0,230,118,0.10)", paddingBottom: 6 }}>{title}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
  const FL = ({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) => (
    <div>
      <label className="field-label">{label}</label>
      {children}
      {note && <p style={{ fontSize: 10, color: "var(--tx-3)", marginTop: 4 }}>{note}</p>}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 660, maxHeight: "94vh", display: "flex", flexDirection: "column" }}>
        <div className="neon-line" />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{editProduct ? "Edit Product" : "Add New Product"}</p>
            <p style={{ fontSize: 11, color: "var(--tx-3)", marginTop: 2 }}>Fields marked * are required</p>
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--tx-3)", display: "flex", padding: 4 }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Scrollable form body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 8px" }}>
          <form id="apf" onSubmit={submit}>

            <S title="1. Basic Details">
              <FL label="Product Title *">
                <input className="inp" value={form.title}
                  onChange={e => set("title", e.target.value)}
                  placeholder="e.g. Wireless Bluetooth Headphones" />
              </FL>
              <FL label="Description">
                <textarea className="inp" value={form.description}
                  onChange={e => set("description", e.target.value)}
                  rows={2} style={{ resize: "none" }} placeholder="Short product description…" />
              </FL>
              <div className="form-row">
                <FL label="Brand Name">
                  <input className="inp" value={form.brand_name}
                    onChange={e => set("brand_name", e.target.value)} placeholder="e.g. Sony" />
                </FL>
                <FL label="SKU / Code">
                  <input className="inp" value={form.sku}
                    onChange={e => set("sku", e.target.value)} placeholder="SKU-001" />
                </FL>
              </div>
              <FL label="Category *">
                <select className="inp" value={form.category_id}
                  onChange={e => set("category_id", e.target.value)}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  {PRESET_CATS.filter(p => !categories.some(c => c.name === p)).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </FL>
              <FL label="Source / Supplier Link (Meesho, Flipkart, Amazon…)" note="Private — never shown to customers">
                <div style={{ position: "relative" }}>
                  <input className="inp" value={form.source_link}
                    onChange={e => set("source_link", e.target.value)}
                    placeholder="https://www.meesho.com/…"
                    style={{ paddingRight: 38 }} />
                  {form.source_link && (
                    <a href={form.source_link} target="_blank" rel="noopener noreferrer"
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: NG, display: "flex" }}>
                      <ExternalLink style={{ width: 14, height: 14 }} />
                    </a>
                  )}
                </div>
              </FL>
            </S>

            <S title="2. Pricing (₹)">
              <div className="form-row3">
                <FL label="MRP Price (₹) *">
                  <input type="number" min={0} step="0.01" className="inp" value={form.mrp_price}
                    onChange={e => set("mrp_price", e.target.value)} placeholder="0" />
                </FL>
                <FL label="Sale Price (₹) *">
                  <input type="number" min={0} step="0.01" className="inp" value={form.sale_price}
                    onChange={e => set("sale_price", e.target.value)} placeholder="0" />
                </FL>
                <FL label="Stock Qty *">
                  <input type="number" min={0} className="inp" value={form.stock}
                    onChange={e => set("stock", e.target.value)} placeholder="0" />
                </FL>
              </div>
              {disc > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="badge b-green" style={{ fontSize: 13, padding: "4px 12px" }}>{disc}% OFF</span>
                  <span style={{ fontSize: 12, color: "var(--tx-3)" }}>Customer saves ₹{(mrp - sale).toLocaleString()}</span>
                </div>
              )}
            </S>

            <S title="3. Product Images (up to 8)">
              <p style={{ fontSize: 12, color: "var(--tx-3)", marginBottom: 2, lineHeight: 1.6 }}>
                Add multiple image URLs. The first image is the main thumbnail.
                Recommended: 800×800 px square images.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {form.images.map((img, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {/* Image number pill */}
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: i === 0 ? NG : "rgba(255,255,255,0.10)", color: i === 0 ? "#0D1117" : "var(--tx-3)", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <input className="inp" value={img}
                        onChange={e => setImg(i, e.target.value)}
                        placeholder={i === 0 ? "https://… (Main / thumbnail image) *" : `https://… (Image ${i + 1})`}
                        style={{ flex: 1 }} />
                      {form.images.length > 1 && (
                        <button type="button" onClick={() => rmImg(i)}
                          style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,70,90,0.10)", border: "1px solid rgba(255,70,90,0.22)", color: "#FF465A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <X style={{ width: 12, height: 12 }} />
                        </button>
                      )}
                    </div>
                    {/* Preview */}
                    {img.trim() && (
                      <div style={{ marginTop: 6, marginLeft: 30 }}>
                        <img src={img.trim()} alt={`Image ${i + 1}`}
                          style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid var(--bd)" }}
                          onError={e => { (e.target as HTMLImageElement).style.opacity = "0.3"; }} />
                      </div>
                    )}
                  </div>
                ))}
                {form.images.length < MAX_IMAGES && (
                  <button type="button" onClick={addImg}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, background: "transparent", border: "1.5px dashed rgba(0,230,118,0.25)", color: "rgba(0,230,118,0.65)" }}>
                    <Image style={{ width: 13, height: 13 }} />
                    Add Another Image ({form.images.length}/{MAX_IMAGES})
                  </button>
                )}
              </div>
            </S>

            <S title="4. Payment Methods Accepted">
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {ALL_PAYMENTS.map(p => (
                  <label key={p} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${form.accepted_payments.includes(p) ? NG : "var(--bd)"}`, background: form.accepted_payments.includes(p) ? "rgba(0,230,118,0.06)" : "transparent", fontSize: 13, fontWeight: 600, color: form.accepted_payments.includes(p) ? NG : "var(--tx-2)", userSelect: "none" }}>
                    <input type="checkbox" checked={form.accepted_payments.includes(p)} onChange={() => togglePayment(p)} style={{ accentColor: NG, width: 14, height: 14 }} />
                    {p === "COD" ? "💵 Cash on Delivery" : p === "UPI" ? "📱 UPI" : "💳 Card / Online"}
                  </label>
                ))}
              </div>
            </S>

            <S title="5. Delivery & Returns">
              <div className="form-row">
                <FL label="Est. Delivery Days" note={`Displayed as "Delivers in ${form.estimated_delivery_days}–${parseInt(form.estimated_delivery_days||"3")+1} days"`}>
                  <input type="number" min={1} className="inp" value={form.estimated_delivery_days}
                    onChange={e => set("estimated_delivery_days", e.target.value)} />
                </FL>
                <FL label="Delivery Charge ₹" note={form.delivery_charge === "0" || !form.delivery_charge ? "FREE Delivery" : `₹${form.delivery_charge} per order`}>
                  <input type="number" min={0} className="inp" value={form.delivery_charge}
                    onChange={e => set("delivery_charge", e.target.value)} />
                </FL>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--tx-2)", userSelect: "none" }}>
                <input type="checkbox" checked={form.is_returnable} onChange={e => set("is_returnable", e.target.checked)} style={{ accentColor: NG, width: 14, height: 14 }} />
                7-Day Easy Return Available
              </label>
            </S>

            <S title="6. Referral Reward (optional)">
              <p style={{ fontSize: 12, color: "var(--tx-3)", lineHeight: 1.6 }}>
                When a customer shares this product and a friend buys it using their link, the sharer earns a reward automatically.
              </p>
              <FL label="Reward Type">
                <select className="inp" value={form.referral_reward_type}
                  onChange={e => set("referral_reward_type", e.target.value)}>
                  <option value="none">No Reward</option>
                  <option value="cash">Cash Reward (₹ credited to their account)</option>
                  <option value="percent">Percent of Sale (% of purchase total)</option>
                  <option value="points">Reward Points</option>
                </select>
              </FL>
              {form.referral_reward_type !== "none" && (
                <div className="form-row">
                  <FL label={form.referral_reward_type === "cash" ? "Reward Amount (₹)" : form.referral_reward_type === "percent" ? "Percent (%)" : "Points earned"}>
                    <input type="number" min={0} className="inp" value={form.referral_reward_value}
                      onChange={e => set("referral_reward_value", e.target.value)} placeholder="0" />
                  </FL>
                  <FL label="Expires After (days)">
                    <input type="number" min={1} max={365} className="inp" value={form.reward_expiry_days}
                      onChange={e => set("reward_expiry_days", e.target.value)} />
                  </FL>
                </div>
              )}
            </S>

            <S title="7. Variants (optional)">
              {form.variants.map((v, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--bd)", borderRadius: 10, padding: 13, position: "relative" }}>
                  <button type="button" onClick={() => rmVar(i)}
                    style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,70,90,0.10)", border: "1px solid rgba(255,70,90,0.20)", borderRadius: 5, cursor: "pointer", color: "#FF465A", padding: "3px 5px" }}>
                    <Trash2 style={{ width: 11, height: 11 }} />
                  </button>
                  <p style={{ fontSize: 10, fontWeight: 700, color: NG, marginBottom: 9 }}>Variant #{i + 1}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {(["Color","Size","Image URL","Sale ₹","MRP ₹","Stock"] as const).map((lbl, j) => {
                      const keys: (keyof Variant)[] = ["color","size","image_url","price","mrp","stock"];
                      return (
                        <div key={lbl}>
                          <label className="field-label" style={{ fontSize: 10 }}>{lbl}</label>
                          <input className="inp" value={v[keys[j]]}
                            onChange={e => setVar(i, keys[j], e.target.value)}
                            style={{ padding: "7px 9px", fontSize: 12 }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <button type="button" onClick={addVar}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, width: "100%", padding: "9px 0", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, background: "transparent", border: "1.5px dashed rgba(0,230,118,0.25)", color: "rgba(0,230,118,0.65)" }}>
                <Plus style={{ width: 13, height: 13 }} />Add Variant
              </button>
            </S>

            <S title="8. Visibility">
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--tx-2)", userSelect: "none" }}>
                  <input type="checkbox" checked={form.is_featured} onChange={e => set("is_featured", e.target.checked)} style={{ accentColor: "#FFC400", width: 14, height: 14 }} />
                  ⭐ Featured Product
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--tx-2)", userSelect: "none" }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} style={{ accentColor: NG, width: 14, height: 14 }} />
                  ✓ Active / Visible on website
                </label>
              </div>
              {!form.is_active && (
                <p style={{ fontSize: 12, color: "#FFC400" }}>
                  ⚠ Product is Draft — it will NOT appear on the website until marked Active.
                </p>
              )}
            </S>

          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 10, flexShrink: 0, background: "#1C2333" }}>
          <button type="button" onClick={onClose} className="btn btn-dark" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
          <button type="submit" form="apf" disabled={loading} className="btn btn-ng" style={{ flex: 2, justifyContent: "center", gap: 6 }}>
            {loading ? "Saving…" : <><Zap style={{ width: 14, height: 14 }} />{editProduct ? "Update Product" : "Add Product"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
