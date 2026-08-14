"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Eye, EyeOff, Image as ImgIcon, Info } from "lucide-react";
import { supabase, Banner } from "@/lib/supabase";
import { useToast } from "@/components/Toast";

const RECOMMENDED = { width: 1200, height: 400 };

interface Form { title:string; image_url:string; link_url:string; display_order:number; is_active:boolean; }
const blank: Form = { title:"", image_url:"", link_url:"", display_order:1, is_active:true };

function BannerSizeInfo() {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:8, background:"rgba(96,165,250,0.08)", border:"1px solid rgba(96,165,250,0.20)", borderRadius:8, padding:"10px 12px", marginBottom:16 }}>
      <Info style={{ width:15, height:15, color:"#60A5FA", flexShrink:0, marginTop:1 }} />
      <div>
        <p style={{ fontSize:12, fontWeight:700, color:"#60A5FA", marginBottom:3 }}>Recommended Banner Size</p>
        <p style={{ fontSize:12, color:"var(--tx-2)" }}>
          <strong>{RECOMMENDED.width} × {RECOMMENDED.height} px</strong> (3:1 aspect ratio) · JPEG or PNG · Max 2MB<br />
          Smaller images will be stretched. Use landscape orientation for best results.
        </p>
      </div>
    </div>
  );
}

export default function AdminBannersPage() {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form,    setForm]    = useState<Form>(blank);
  const [imgInfo, setImgInfo] = useState<{ w:number; h:number } | null>(null);

  useEffect(() => {
    async function load() {
      try { const { data } = await supabase.from("banners").select("*").order("display_order"); if (data) setBanners(data as Banner[]); } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const openNew  = () => { setEditing(null); setForm({ ...blank, display_order: banners.length + 1 }); setImgInfo(null); setModal(true); };
  const openEdit = (b: Banner) => { setEditing(b); setForm({ title:b.title, image_url:b.image_url, link_url:b.link_url??""  , display_order:b.display_order, is_active:b.is_active }); setImgInfo(null); setModal(true); };

  const checkImageSize = (url: string) => {
    if (!url) { setImgInfo(null); return; }
    const img = new Image();
    img.onload = () => setImgInfo({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => setImgInfo(null);
    img.src = url;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await supabase.from("banners").update(form).eq("id", editing.id);
        setBanners(p => p.map(b => b.id === editing.id ? { ...b, ...form } : b));
      } else {
        const id = crypto.randomUUID();
        await supabase.from("banners").insert({ id, ...form });
        setBanners(p => [...p, { id, ...form, created_at: new Date().toISOString() }]);
      }
      toast("Saved", "success");
    } catch { toast("Saved (offline)", "info"); }
    setModal(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    try { await supabase.from("banners").delete().eq("id", id); } catch {}
    setBanners(p => p.filter(b => b.id !== id));
    toast("Deleted", "info");
  };

  const toggle = async (b: Banner) => {
    const val = !b.is_active;
    try { await supabase.from("banners").update({ is_active: val }).eq("id", b.id); } catch {}
    setBanners(p => p.map(x => x.id === b.id ? { ...x, is_active: val } : x));
  };

  const sorted = [...banners].sort((a, b) => a.display_order - b.display_order);
  const NG = "#00E676";

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div><h1 className="admin-page-title">Banners</h1><p className="admin-page-sub">{banners.filter(b=>b.is_active).length} active</p></div>
        <button onClick={openNew} className="btn btn-ng" style={{ gap:5 }}><Plus style={{ width:13, height:13 }} />Add Banner</button>
      </div>

      <BannerSizeInfo />

      {/* Preview strip */}
      {sorted.filter(b=>b.is_active).length > 0 && (
        <div className="card" style={{ padding:14, marginBottom:16 }}>
          <p className="section-label" style={{ marginBottom:10 }}>Live Preview</p>
          <div style={{ display:"flex", gap:10, overflowX:"auto", paddingBottom:4 }}>
            {sorted.filter(b=>b.is_active).map(b => (
              <div key={b.id} style={{ flexShrink:0, width:200, borderRadius:8, overflow:"hidden", border:"1px solid var(--bd)" }}>
                <img src={b.image_url} alt={b.title} style={{ width:"100%", height:76, objectFit:"cover", display:"block" }} />
                <p style={{ padding:"5px 8px", fontSize:10, color:"var(--tx-2)", fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{b.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
        {loading ? Array.from({ length: 2 }).map((_, i) => <div key={i} className="shimmer" style={{ height:68 }} />)
        : sorted.length === 0 ? (
          <div className="card" style={{ padding:"44px 20px", textAlign:"center" }}>
            <ImgIcon style={{ width:28, height:28, color:"var(--tx-4)", margin:"0 auto 8px" }} />
            <p style={{ color:"var(--tx-3)" }}>No banners yet</p>
          </div>
        ) : sorted.map(b => (
          <div key={b.id} className="card" style={{ padding:"11px 14px", display:"flex", gap:12, alignItems:"center", opacity:b.is_active?1:0.5 }}>
            <div style={{ width:88, height:48, borderRadius:6, overflow:"hidden", flexShrink:0, border:"1px solid var(--bd)" }}>
              <img src={b.image_url} alt={b.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:13, fontWeight:600, color:"var(--tx)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{b.title}</p>
              {b.link_url && <p style={{ fontSize:11, color:NG, marginTop:1 }}>{b.link_url}</p>}
              <p style={{ fontSize:10, color:"var(--tx-3)", marginTop:1 }}>Order: {b.display_order} · Recommended: {RECOMMENDED.width}×{RECOMMENDED.height}px</p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
              <span style={{ fontSize:10, padding:"2px 7px", borderRadius:99, fontWeight:700, background:b.is_active?"rgba(0,230,118,0.10)":"rgba(255,255,255,0.05)", color:b.is_active?NG:"var(--tx-3)", border:`1px solid ${b.is_active?"rgba(0,230,118,0.22)":"rgba(255,255,255,0.08)"}` }}>
                {b.is_active?"Active":"Hidden"}
              </span>
              <button onClick={() => toggle(b)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--tx-3)", display:"flex", padding:4 }}>
                {b.is_active ? <EyeOff style={{ width:14, height:14 }} /> : <Eye style={{ width:14, height:14 }} />}
              </button>
              <button onClick={() => openEdit(b)} style={{ padding:"4px 7px", borderRadius:6, background:"rgba(96,165,250,0.10)", border:"1px solid rgba(96,165,250,0.20)", color:"#60A5FA", cursor:"pointer" }}>
                <Edit2 style={{ width:12, height:12 }} />
              </button>
              <button onClick={() => remove(b.id)} className="btn-danger btn btn-sm" style={{ padding:"4px 7px" }}>
                <Trash2 style={{ width:12, height:12 }} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className="modal-box" style={{ maxWidth:480 }}>
            <div className="neon-line" />
            <div style={{ padding:"14px 18px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <p style={{ fontSize:15, fontWeight:700, color:"#fff" }}>{editing?"Edit Banner":"Add Banner"}</p>
              <button onClick={() => setModal(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--tx-3)", display:"flex" }}><X style={{ width:16, height:16 }} /></button>
            </div>
            <form onSubmit={save} style={{ padding:18, display:"flex", flexDirection:"column", gap:13 }}>
              <BannerSizeInfo />
              <div><label className="field-label">Title</label><input className="inp" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} /></div>
              <div>
                <label className="field-label">Image URL * (recommended: {RECOMMENDED.width}×{RECOMMENDED.height}px)</label>
                <input required className="inp" value={form.image_url} onChange={e => { setForm(f=>({...f,image_url:e.target.value})); checkImageSize(e.target.value); }} placeholder="https://…" />
                {imgInfo && (
                  <p style={{ fontSize:11, marginTop:5, color: (imgInfo.w >= RECOMMENDED.width * 0.8 && Math.abs(imgInfo.w/imgInfo.h - 3) < 0.5) ? NG : "#FFC400", fontWeight:600 }}>
                    Detected: {imgInfo.w}×{imgInfo.h}px {imgInfo.w < RECOMMENDED.width * 0.8 ? "⚠ Image may appear blurry" : "✓ Good size"}
                  </p>
                )}
                {form.image_url && <img src={form.image_url} alt="preview" style={{ marginTop:8, width:"100%", height:76, objectFit:"cover", borderRadius:7, border:"1px solid rgba(255,255,255,0.08)" }} />}
              </div>
              <div><label className="field-label">Link URL</label><input className="inp" value={form.link_url} onChange={e => setForm(f=>({...f,link_url:e.target.value}))} placeholder="/category/all" /></div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div><label className="field-label">Display Order</label><input type="number" min={0} className="inp" value={form.display_order} onChange={e => setForm(f=>({...f,display_order:+e.target.value}))} /></div>
                <div style={{ paddingTop:20 }}>
                  <label style={{ display:"flex", alignItems:"center", gap:7, cursor:"pointer", fontSize:13, color:"var(--tx-2)" }}>
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(f=>({...f,is_active:e.target.checked}))} style={{ accentColor:"var(--ng)", width:14, height:14 }} />Active
                  </label>
                </div>
              </div>
              <div style={{ display:"flex", gap:10, paddingTop:4 }}>
                <button type="button" onClick={() => setModal(false)} className="btn btn-dark" style={{ flex:1, justifyContent:"center" }}>Cancel</button>
                <button type="submit" className="btn btn-ng" style={{ flex:1, justifyContent:"center" }}>{editing?"Save":"Add Banner"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
