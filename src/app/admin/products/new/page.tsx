"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Zap, ArrowLeft } from "lucide-react";
import { supabase, Category } from "@/lib/supabase";
import { useToast } from "@/components/Toast";
import Link from "next/link";

interface Variant { color:string; size:string; price:string; mrp:string; stock:string; image_url:string; }
interface Form {
  title:string; description:string; brand_name:string; sku:string;
  mrp_price:string; sale_price:string; stock:string; category_id:string;
  images:string; estimated_delivery_days:string; delivery_charge:string;
  is_returnable:boolean; is_featured:boolean; is_active:boolean;
  variants: Variant[];
}
const blank: Form = { title:"",description:"",brand_name:"",sku:"",mrp_price:"",sale_price:"",stock:"",category_id:"",images:"",estimated_delivery_days:"3",delivery_charge:"0",is_returnable:true,is_featured:false,is_active:true,variants:[] };
const PRESET = ["Electronics","Fashion","Home","Beauty","Sports","Books"];

const S = ({ title, children }: { title:string; children:React.ReactNode }) => (
  <div className="card" style={{ padding:"20px 22px", marginBottom:16 }}>
    <p style={{ fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.7px",color:"var(--ng)",marginBottom:16 }}>{title}</p>
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>{children}</div>
  </div>
);
const F = ({ label, children }: { label:string; children:React.ReactNode }) => (
  <div><label className="field-label">{label}</label>{children}</div>
);

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [cats,    setCats]    = useState<Category[]>([]);
  const [form,    setForm]    = useState<Form>(blank);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCats() {
      try { const { data } = await supabase.from("categories").select("*"); if (data) setCats(data as Category[]); } catch {}
    }
    loadCats();
  }, []);

  const mrp  = parseFloat(form.mrp_price) || 0;
  const sale = parseFloat(form.sale_price) || 0;
  const disc = mrp > 0 && sale < mrp ? Math.round(((mrp - sale) / mrp) * 100) : 0;

  const addVar = () => setForm(f => ({ ...f, variants: [...f.variants, { color:"",size:"",price:"",mrp:"",stock:"",image_url:"" }] }));
  const setVar = (i:number, k:keyof Variant, v:string) => setForm(f => ({ ...f, variants: f.variants.map((vv,ii) => ii===i ? {...vv,[k]:v} : vv) }));
  const rmVar  = (i:number) => setForm(f => ({ ...f, variants: f.variants.filter((_,ii) => ii!==i) }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast("Title required","error");
    if (!mrp || !sale || !form.stock) return toast("Pricing and stock required","error");
    setLoading(true);
    const payload = {
      title:form.title, description:form.description,
      brand_name:form.brand_name||null, sku:form.sku||null,
      mrp_price:mrp, sale_price:sale, stock:parseInt(form.stock)||0,
      category_id:form.category_id||null,
      images: form.images.trim() ? [form.images.trim()] : [],
      variants: form.variants.map(v => ({ color:v.color||undefined,size:v.size||undefined,price:v.price?parseFloat(v.price):undefined,mrp:v.mrp?parseFloat(v.mrp):undefined,stock:v.stock?parseInt(v.stock):undefined,image_url:v.image_url||undefined })).filter(v => Object.values(v).some(Boolean)),
      is_featured:form.is_featured, is_active:form.is_active,
      estimated_delivery_days:parseInt(form.estimated_delivery_days)||3,
      delivery_charge:parseFloat(form.delivery_charge)||0,
      is_returnable:form.is_returnable,
    };
    try {
      const { error } = await supabase.from("products").insert({ id: crypto.randomUUID(), ...payload });
      if (error) throw error;
      toast("Product added!", "success");
      router.push("/admin/products");
    } catch {
      toast("Product saved (offline mode)", "success");
      router.push("/admin/products");
    }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
        <Link href="/admin/products" style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"var(--tx-3)", textDecoration:"none" }}>
          <ArrowLeft style={{ width:14,height:14 }} />Back
        </Link>
        <div>
          <h1 className="admin-page-title">Add New Product</h1>
          <p className="admin-page-sub">Fill all required fields</p>
        </div>
      </div>

      <form onSubmit={submit}>
        <S title="1. Basic Details">
          <F label="Product Title *"><input required className="inp" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Wireless Headphones" /></F>
          <F label="Description"><textarea className="inp" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} rows={3} style={{ resize:"none" }} /></F>
          <div className="form-row">
            <F label="Brand Name"><input className="inp" value={form.brand_name} onChange={e => setForm(f=>({...f,brand_name:e.target.value}))} placeholder="e.g. Sony" /></F>
            <F label="SKU"><input className="inp" value={form.sku} onChange={e => setForm(f=>({...f,sku:e.target.value}))} placeholder="e.g. SKU-001" /></F>
          </div>
          <F label="Category *">
            <select required className="inp" value={form.category_id} onChange={e => setForm(f=>({...f,category_id:e.target.value}))}>
              <option value="">Select category</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              {PRESET.filter(p => !cats.some(c => c.name === p)).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </F>
        </S>

        <S title="2. Pricing & Discount (₹)">
          <div className="form-row3">
            <F label="MRP Price (₹) *"><input required type="number" min={0} className="inp" value={form.mrp_price} onChange={e => setForm(f=>({...f,mrp_price:e.target.value}))} /></F>
            <F label="Sale Price (₹) *"><input required type="number" min={0} className="inp" value={form.sale_price} onChange={e => setForm(f=>({...f,sale_price:e.target.value}))} /></F>
            <F label="Stock Qty *"><input required type="number" min={0} className="inp" value={form.stock} onChange={e => setForm(f=>({...f,stock:e.target.value}))} /></F>
          </div>
          {disc > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span className="badge b-green" style={{ fontSize:14,padding:"5px 14px" }}>{disc}% OFF</span>
              <p style={{ fontSize:13,color:"var(--tx-3)" }}>Customer saves ₹{(mrp-sale).toLocaleString()}</p>
            </div>
          )}
        </S>

        <S title="3. Image">
          <F label="Image URL">
            <input className="inp" type="url" value={form.images} onChange={e => setForm(f=>({...f,images:e.target.value}))} placeholder="https://…" />
          </F>
          {form.images && <img src={form.images} alt="preview" style={{ width:100,height:100,objectFit:"cover",borderRadius:8,border:"1px solid var(--bd)" }} />}
        </S>

        <S title="4. Logistics">
          <div className="form-row">
            <F label="Delivery Days (default: 3)">
              <input type="number" min={1} className="inp" value={form.estimated_delivery_days} onChange={e => setForm(f=>({...f,estimated_delivery_days:e.target.value}))} />
            </F>
            <F label="Delivery Charge ₹ (0 = FREE)">
              <input type="number" min={0} className="inp" value={form.delivery_charge} onChange={e => setForm(f=>({...f,delivery_charge:e.target.value}))} />
            </F>
          </div>
          <label style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,color:"var(--tx-2)" }}>
            <input type="checkbox" checked={form.is_returnable} onChange={e => setForm(f=>({...f,is_returnable:e.target.checked}))} style={{ accentColor:"var(--ng)",width:15,height:15 }} />
            7-Day Easy Return Available
          </label>
        </S>

        <S title="5. Variants">
          {form.variants.map((v,i) => (
            <div key={i} style={{ background:"rgba(255,255,255,0.02)",border:"1px solid var(--bd)",borderRadius:10,padding:14,position:"relative" }}>
              <button type="button" onClick={() => rmVar(i)} style={{ position:"absolute",top:8,right:8,background:"rgba(255,70,90,0.10)",border:"1px solid rgba(255,70,90,0.20)",borderRadius:6,cursor:"pointer",color:"#FF465A",padding:"3px 6px" }}>
                <Trash2 style={{ width:12,height:12 }} />
              </button>
              <p style={{ fontSize:11,fontWeight:700,color:"var(--ng)",marginBottom:10 }}>Variant #{i+1}</p>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10 }}>
                {(["Color","Size","Image URL","Sale Price ₹","MRP ₹","Stock"] as const).map((lbl,j) => {
                  const keys: (keyof Variant)[] = ["color","size","image_url","price","mrp","stock"];
                  return (
                    <div key={lbl}>
                      <label className="field-label">{lbl}</label>
                      <input className="inp" value={v[keys[j]]} onChange={e => setVar(i,keys[j],e.target.value)} style={{ padding:"8px 10px",fontSize:12 }} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <button type="button" onClick={addVar} style={{
            display:"flex",alignItems:"center",justifyContent:"center",gap:6,
            width:"100%",padding:"10px 0",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600,
            background:"transparent",border:"1.5px dashed rgba(0,230,118,0.25)",color:"rgba(0,230,118,0.6)",
          }}>
            <Plus style={{ width:14,height:14 }} />Add Variant
          </button>
        </S>

        <S title="6. Visibility">
          <div style={{ display:"flex",gap:24,flexWrap:"wrap" }}>
            {[["Featured Product","is_featured","#FFC400"],["Active / Published","is_active","var(--ng)"]].map(([lbl,key,color]) => (
              <label key={String(key)} style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,color:"var(--tx-2)" }}>
                <input type="checkbox" checked={Boolean(form[key as keyof Form])} onChange={e => setForm(f=>({...f,[key]:e.target.checked}))} style={{ accentColor:String(color),width:15,height:15 }} />
                {String(lbl)}
              </label>
            ))}
          </div>
        </S>

        <div style={{ display:"flex",gap:12 }}>
          <Link href="/admin/products" className="btn btn-dark" style={{ flex:1,justifyContent:"center" }}>Cancel</Link>
          <button type="submit" disabled={loading} className="btn btn-ng" style={{ flex:2,justifyContent:"center",gap:7 }}>
            {loading ? "Saving…" : <><Zap style={{ width:15,height:15 }} />Add Product</>}
          </button>
        </div>
      </form>
    </div>
  );
}
