"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Tag } from "lucide-react";
import { supabase, Category } from "@/lib/supabase";
import { useToast } from "@/components/Toast";

interface Form { name: string; slug: string; image_url: string; }
const blank: Form = { name: "", slug: "", image_url: "" };
const autoSlug = (n: string) => n.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const [cats,    setCats]    = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form,    setForm]    = useState<Form>(blank);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from("categories").select("*").order("name");
        if (data) setCats(data as Category[]);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const openNew  = () => { setEditing(null); setForm(blank); setModal(true); };
  const openEdit = (c: Category) => { setEditing(c); setForm({ name: c.name, slug: c.slug, image_url: c.image_url }); setModal(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, slug: form.slug || autoSlug(form.name) };
    try {
      if (editing) {
        await supabase.from("categories").update(payload).eq("id", editing.id);
        setCats(prev => prev.map(c => c.id === editing.id ? { ...c, ...payload } : c));
      } else {
        const id = crypto.randomUUID();
        await supabase.from("categories").insert({ id, ...payload });
        setCats(prev => [...prev, { id, ...payload }]);
      }
      toast(editing ? "Category updated" : "Category added", "success");
    } catch { toast("Saved (offline mode)", "info"); }
    setModal(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try { await supabase.from("categories").delete().eq("id", id); } catch {}
    setCats(prev => prev.filter(c => c.id !== id));
    toast("Deleted", "info");
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div><h1 className="admin-page-title">Categories</h1><p className="admin-page-sub">{cats.length} categories</p></div>
        <button onClick={openNew} className="btn btn-ng" style={{ gap: 6 }}><Plus style={{ width: 14, height: 14 }} />Add Category</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }} className="cat-admin-grid">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="shimmer" style={{ height: 140, borderRadius: 12 }} />
          ))
        ) : cats.length === 0 ? (
          <div style={{ gridColumn: "1/-1", padding: "60px 20px", textAlign: "center", background: "var(--bg-card)", borderRadius: 12 }}>
            <Tag style={{ width: 32, height: 32, color: "var(--tx-4)", margin: "0 auto 10px" }} />
            <p style={{ color: "var(--tx-3)" }}>No categories yet</p>
          </div>
        ) : cats.map(c => (
          <div key={c.id} className="card" style={{ overflow: "hidden", transition: "border-color 0.15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = "var(--ng-border)"}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = "var(--bd)"}>
            <div style={{ height: 110, background: "var(--bg-elevated)", overflow: "hidden" }}>
              {c.image_url && <img src={c.image_url} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            </div>
            <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--tx)" }}>{c.name}</p>
                <p style={{ fontSize: 11, color: "var(--tx-3)", marginTop: 1 }}>/{c.slug}</p>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => openEdit(c)} style={{ padding: "5px 7px", borderRadius: 6, background: "rgba(96,165,250,0.10)", border: "1px solid rgba(96,165,250,0.20)", color: "#60A5FA", cursor: "pointer" }}>
                  <Edit2 style={{ width: 13, height: 13 }} />
                </button>
                <button onClick={() => remove(c.id)} style={{ padding: "5px 7px", borderRadius: 6, background: "rgba(255,70,90,0.10)", border: "1px solid rgba(255,70,90,0.20)", color: "#FF465A", cursor: "pointer" }}>
                  <Trash2 style={{ width: 13, height: 13 }} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#1C2333", border: "1px solid rgba(0,230,118,0.18)", borderRadius: 14, width: "100%", maxWidth: 460, boxShadow: "0 16px 60px rgba(0,0,0,0.6)" }}>
            <div className="neon-line" />
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{editing ? "Edit Category" : "Add Category"}</p>
              <button onClick={() => setModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--tx-3)", display: "flex" }}><X style={{ width: 16, height: 16 }} /></button>
            </div>
            <form onSubmit={save} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="field-label">Category Name *</label>
                <input required className="inp" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))}
                  placeholder="e.g. Electronics" />
              </div>
              <div>
                <label className="field-label">Slug</label>
                <input className="inp" value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="auto-generated" />
              </div>
              <div>
                <label className="field-label">Image URL</label>
                <input className="inp" value={form.image_url}
                  onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://…" />
              </div>
              {form.image_url && (
                <img src={form.image_url} alt="preview" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(255,255,255,0.10)" }} />
              )}
              <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
                <button type="button" onClick={() => setModal(false)} className="btn btn-dark" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-ng" style={{ flex: 1 }}>{editing ? "Save Changes" : "Add Category"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`@media(max-width:700px){.cat-admin-grid{grid-template-columns:1fr 1fr!important;}}@media(max-width:480px){.cat-admin-grid{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
