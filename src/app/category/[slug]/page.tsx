"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { supabase, Product, Category } from "@/lib/supabase";
import { demoProducts, demoCategories } from "@/lib/demoData";
import { ProductCard } from "@/components/ProductCard";

const NG = "#00E676";
const SORTS = [
  { value: "relevance",     label: "Relevance"          },
  { value: "price_asc",     label: "Price: Low to High" },
  { value: "price_desc",    label: "Price: High to Low" },
  { value: "discount_desc", label: "Best Discount"      },
];

export default function CategoryPage() {
  const { slug } = useParams() as { slug: string };
  const [products,   setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(demoCategories);
  const [sort,       setSort]       = useState("relevance");
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: cats } = await supabase.from("categories").select("*");
        if (cats?.length) setCategories(cats as Category[]);
      } catch {}
      try {
        const { data } = await supabase.from("products").select("*").eq("is_active", true);
        setProducts(data?.length ? data as Product[] : demoProducts);
      } catch { setProducts(demoProducts); }
      setLoading(false);
    }
    load();
  }, []);

  const cat = categories.find(c => c.slug === slug) ?? null;
  let filtered = slug === "all" ? products : cat ? products.filter(p => p.category_id === cat.id) : products;
  if (sort === "price_asc")     filtered = [...filtered].sort((a, b) => a.sale_price - b.sale_price);
  if (sort === "price_desc")    filtered = [...filtered].sort((a, b) => b.sale_price - a.sale_price);
  if (sort === "discount_desc") filtered = [...filtered].sort((a, b) => (b.mrp_price - b.sale_price) / b.mrp_price - (a.mrp_price - a.sale_price) / a.mrp_price);

  return (
    <div style={{ padding: "20px 0 48px" }}>
      <div className="pc">
        {/* Breadcrumb */}
        <p style={{ fontSize: 12, color: "var(--tx-3)", marginBottom: 18 }}>
          <Link href="/" style={{ color: NG, textDecoration: "none" }}>Home</Link>
          <span style={{ margin: "0 6px" }}>/</span>
          <span>{cat?.name ?? "All Products"}</span>
        </p>

        {/* Category chips */}
        <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 12, marginBottom: 18 }}>
          {[{ slug: "all", name: "All" }, ...categories].map(c => (
            <Link key={c.slug} href={`/category/${c.slug}`} style={{
              padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600,
              textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
              background: slug === c.slug ? NG : "var(--bg-card)",
              color: slug === c.slug ? "#0D1117" : "var(--tx-2)",
              border: `1px solid ${slug === c.slug ? "transparent" : "var(--bd)"}`,
            }}>
              {c.name}
            </Link>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-card)", border: "1px solid var(--bd)", borderRadius: 10, padding: "10px 16px", marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: "var(--tx-3)" }}>
            {loading ? "Loading…" : <><span style={{ color: "var(--tx)", fontWeight: 700 }}>{filtered.length}</span> products</>}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SlidersHorizontal style={{ width: 14, height: 14, color: "var(--tx-3)" }} />
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, fontWeight: 600, color: "var(--tx)", cursor: "pointer" }}>
              {SORTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="pgrid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <div className="shimmer" style={{ aspectRatio: "1", borderRadius: 12, marginBottom: 10 }} />
                <div className="shimmer" style={{ height: 14, width: "80%", marginBottom: 6 }} />
                <div className="shimmer" style={{ height: 16, width: "50%" }} />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="pgrid">{filtered.map(p => <ProductCard key={p.id} product={p} />)}</div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: "var(--tx)", marginBottom: 8 }}>No products found</p>
            <Link href="/category/all" style={{ color: NG, textDecoration: "none", fontSize: 14 }}>Browse all →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
