"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Search, Package } from "lucide-react";
import { supabase, Product, Category } from "@/lib/supabase";
import { useToast } from "@/components/Toast";
import { AddProductModal } from "@/components/AddProductModal";

export default function AdminProductsPage() {
  const { toast } = useToast();
  const [products,   setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editProd,   setEditProd]   = useState<Product | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [{ data: p }, { data: c }] = await Promise.all([
          supabase.from("products").select("*").order("created_at", { ascending: false }),
          supabase.from("categories").select("*"),
        ]);
        if (p) setProducts(p as Product[]);
        if (c) setCategories(c as Category[]);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const toggle = async (prod: Product) => {
    const val = !prod.is_active;
    try { await supabase.from("products").update({ is_active: val }).eq("id", prod.id); } catch {}
    setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, is_active: val } : p));
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product permanently?")) return;
    try { await supabase.from("products").delete().eq("id", id); } catch {}
    setProducts(prev => prev.filter(p => p.id !== id));
    toast("Product deleted", "info");
  };

  const openAdd  = () => { setEditProd(null); setModalOpen(true); };
  const openEdit = (p: Product) => { setEditProd(p); setModalOpen(true); };

  const handleSaved = (saved: Product) => {
    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
  };

  const visible = search.trim()
    ? products.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    : products;

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div><h1 className="admin-page-title">Products</h1><p className="admin-page-sub">{products.length} products</p></div>
        <button onClick={openAdd} className="btn btn-ng" style={{ gap:5 }}>
          <Plus style={{ width:13, height:13 }} />Add Product
        </button>
      </div>

      <div style={{ position:"relative", maxWidth:280, marginBottom:16 }}>
        <Search style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", width:13, height:13, color:"var(--tx-3)" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" className="inp" style={{ paddingLeft:30 }} />
      </div>

      <div className="card" style={{ overflow:"hidden" }}>
        {loading ? (
          <div style={{ padding:40, textAlign:"center", color:"var(--tx-3)" }}>Loading…</div>
        ) : visible.length === 0 ? (
          <div style={{ padding:"52px 20px", textAlign:"center" }}>
            <Package style={{ width:32, height:32, color:"var(--tx-4)", margin:"0 auto 10px" }} />
            <p style={{ color:"var(--tx-3)", marginBottom:12 }}>No products yet</p>
            <button onClick={openAdd} className="btn btn-ng" style={{ gap:5 }}><Plus style={{ width:13, height:13 }} />Add first product</button>
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>{["Product","Category","MRP","Sale","Stock","Payments","Status","Actions"].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {visible.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:9, minWidth:160 }}>
                        <div style={{ width:38, height:38, borderRadius:7, overflow:"hidden", background:"var(--bg-elevated)", flexShrink:0, border:"1px solid var(--bd)" }}>
                          {p.images?.[0] && <img src={p.images[0]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />}
                        </div>
                        <div>
                          <p style={{ fontWeight:600, fontSize:12, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.title}</p>
                          {p.brand_name && <p style={{ fontSize:10, color:"var(--tx-3)" }}>{p.brand_name}</p>}
                        </div>
                      </div>
                    </td>
                    <td style={{ color:"var(--tx-3)", fontSize:12, whiteSpace:"nowrap" }}>{categories.find(c => c.id === p.category_id)?.name ?? "—"}</td>
                    <td style={{ color:"var(--tx-3)", textDecoration:"line-through", fontSize:12 }}>₹{p.mrp_price}</td>
                    <td style={{ fontWeight:700, color:"var(--ng)", fontSize:13 }}>₹{p.sale_price}</td>
                    <td style={{ color:p.stock < 5 ? "#FF465A":"var(--tx)", fontSize:12 }}>{p.stock}</td>
                    <td>
                      <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
                        {(p.accepted_payments ?? ["COD","UPI","ONLINE"]).map(pm => (
                          <span key={pm} className="badge b-gray" style={{ fontSize:9 }}>{pm}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <button onClick={() => toggle(p)} style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"flex" }}>
                        {p.is_active ? <ToggleRight style={{ width:26, height:26, color:"var(--ng)" }} /> : <ToggleLeft style={{ width:26, height:26, color:"var(--tx-3)" }} />}
                      </button>
                    </td>
                    <td>
                      <div style={{ display:"flex", gap:5 }}>
                        <button onClick={() => openEdit(p)} className="btn btn-sm" style={{ background:"rgba(96,165,250,0.10)", border:"1px solid rgba(96,165,250,0.20)", color:"#60A5FA", padding:"4px 7px" }}>
                          <Edit2 style={{ width:12, height:12 }} />
                        </button>
                        <button onClick={() => remove(p.id)} className="btn btn-sm btn-danger" style={{ padding:"4px 7px" }}>
                          <Trash2 style={{ width:12, height:12 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        editProduct={editProd}
        categories={categories}
      />
    </div>
  );
}
