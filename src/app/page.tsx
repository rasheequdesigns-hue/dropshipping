"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight, Zap, TrendingUp, Truck, RefreshCw, ShieldCheck, Headphones } from "lucide-react";
import { supabase, Product, Category, Banner } from "@/lib/supabase";
import { demoProducts, demoCategories, demoBanners } from "@/lib/demoData";
import { ProductCard } from "@/components/ProductCard";
import { ReviewSection } from "@/components/ReviewSection";

const NG = "#00E676";

export default function HomePage() {
  const [products,   setProducts]   = useState<Product[]>(demoProducts);
  const [categories, setCategories] = useState<Category[]>(demoCategories);
  const [banners,    setBanners]    = useState<Banner[]>(demoBanners);
  const [idx,        setIdx]        = useState(0);
  const [paused,     setPaused]     = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => setIdx(i => (i + 1) % Math.max(1, banners.length)), [banners.length]);

  useEffect(() => {
    if (paused || banners.length <= 1) return;
    timerRef.current = setInterval(next, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, next, banners.length]);

  useEffect(() => {
    async function load() {
      // Fetch active products — if RLS blocks it, fall back to all products
      try {
        const { data, error } = await supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(48);
        if (!error && data?.length) { setProducts(data as Product[]); }
        else if (error) {
          // RLS might block anon — try without filter
          const { data: all } = await supabase.from("products").select("*").order("created_at", { ascending: false }).limit(48);
          if (all?.length) setProducts(all as Product[]);
        }
      } catch {}
      try { const { data } = await supabase.from("categories").select("*"); if (data?.length) setCategories(data as Category[]); } catch {}
      try { const { data } = await supabase.from("banners").select("*").eq("is_active", true).order("display_order"); if (data?.length) setBanners(data as Banner[]); } catch {}
    }
    load();
  }, []);

  const featured  = products.filter(p => p.is_featured).slice(0, 8);
  const trending  = products.slice(0, 8);
  const hasBanners = banners.length > 0;

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Hero Banner */}
      {hasBanners && (
        <section style={{ padding: "20px 0 0" }}>
          <div className="pc">
            <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", height: 260, background: "#1C2333" }} className="banner-h"
              onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
              {banners.map((b, i) => (
                <div key={b.id} style={{ position: "absolute", inset: 0, opacity: i === idx ? 1 : 0, transition: "opacity 0.5s ease", pointerEvents: i === idx ? "auto" : "none" }}>
                  <Link href={b.link_url || "/"} style={{ display: "block", height: "100%" }}>
                    <img src={b.image_url} alt={b.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(13,17,23,0.70) 0%, transparent 60%)" }} />
                    <div style={{ position: "absolute", bottom: 22, left: 24 }}>
                      <p style={{ color: NG, fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6 }}>Featured</p>
                      <p style={{ color: "#fff", fontWeight: 800, fontSize: "clamp(16px,2.5vw,24px)", maxWidth: 400 }}>{b.title}</p>
                      <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 5, background: NG, color: "#0D1117", padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                        Shop Now <ArrowRight style={{ width: 13, height: 13 }} />
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
              {banners.length > 1 && (
                <>
                  {[{ dir: "prev", pos: { left: 10 }, fn: () => setIdx(i => (i - 1 + banners.length) % banners.length) },
                    { dir: "next", pos: { right: 10 }, fn: next }].map(({ dir, pos, fn }) => (
                    <button key={dir} onClick={fn} style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", ...pos, width: 34, height: 34, borderRadius: 8, background: "rgba(13,17,23,0.65)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {dir === "prev" ? <ChevronLeft style={{ width: 16, height: 16 }} /> : <ChevronRight style={{ width: 16, height: 16 }} />}
                    </button>
                  ))}
                  <div style={{ position: "absolute", bottom: 10, right: 14, display: "flex", gap: 5 }}>
                    {banners.map((_, i) => (
                      <button key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 99, background: i === idx ? NG : "rgba(255,255,255,0.30)", border: "none", cursor: "pointer", transition: "all 0.3s" }} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section style={{ padding: "32px 0 0" }}>
          <div className="pc">
            <SectionHeader title="Categories" href="/category/all" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12 }} className="cat-grid">
              {categories.map(c => (
                <Link key={c.id} href={`/category/${c.slug}`} style={{ textDecoration: "none", textAlign: "center" }}>
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--bd)", borderRadius: 12, padding: "14px 8px", transition: "all 0.15s", cursor: "pointer" }}
                    onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = "rgba(0,230,118,0.30)"; d.style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = "var(--bd)"; d.style.background = "var(--bg-card)"; }}>
                    <div style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", margin: "0 auto 8px", background: "var(--bg-elevated)" }}>
                      <img src={c.image_url} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--tx)" }}>{c.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section style={{ padding: "32px 0 0" }}>
          <div className="pc">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <Zap style={{ width: 18, height: 18, color: NG, fill: NG }} />
              <p style={{ fontSize: 18, fontWeight: 800, color: "var(--tx)" }}>Featured Products</p>
            </div>
            <div className="pgrid">{featured.map(p => <ProductCard key={p.id} product={p} />)}</div>
          </div>
        </section>
      )}

      {/* Trending */}
      {trending.length > 0 && (
        <section style={{ padding: "32px 0 0" }}>
          <div className="pc">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <TrendingUp style={{ width: 18, height: 18, color: "#60A5FA" }} />
              <p style={{ fontSize: 18, fontWeight: 800, color: "var(--tx)" }}>Trending Now</p>
            </div>
            <div className="pgrid">{trending.map(p => <ProductCard key={p.id} product={p} />)}</div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {products.length === 0 && (
        <section style={{ padding: "60px 0" }}>
          <div className="pc" style={{ textAlign: "center" }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: "var(--tx)", marginBottom: 8 }}>Welcome to peadia.in</p>
            <p style={{ fontSize: 14, color: "var(--tx-3)", marginBottom: 20 }}>Add your first products via the Admin panel to get started</p>
            <Link href="/admin/products/new" className="btn btn-ng" style={{ display: "inline-flex" }}>Go to Admin</Link>
          </div>
        </section>
      )}

      {/* Trust badges — redesigned */}
      <section style={{ padding: "36px 0 0" }}>
        <div className="pc">
          <div className="trust-strip">
            {[{ Icon: Truck,       label: "Free Delivery",  sub: "On orders above ₹499", c: "#60A5FA", bg: "rgba(96,165,250,0.08)",  bd: "rgba(96,165,250,0.18)"  },
              { Icon: RefreshCw,   label: "Easy Returns",   sub: "7-day hassle-free",    c: NG,        bg: "rgba(0,230,118,0.07)",   bd: "rgba(0,230,118,0.18)"   },
              { Icon: ShieldCheck, label: "Secure Payment", sub: "100% safe checkout",   c: "#C084FC", bg: "rgba(192,132,252,0.08)", bd: "rgba(192,132,252,0.18)" },
              { Icon: Headphones,  label: "24/7 Support",   sub: "Always here to help",  c: "#FB923C", bg: "rgba(251,146,60,0.08)",  bd: "rgba(251,146,60,0.18)"  },
            ].map(({ Icon, label, sub, c, bg, bd }) => (
              <div key={label} style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 18px", background:bg, border:`1px solid ${bd}`, borderRadius:14, transition:"transform 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
                <div style={{ width:46, height:46, borderRadius:12, background:"rgba(255,255,255,0.06)", border:`1px solid ${c}40`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Icon style={{ width:22, height:22, color:c }} />
                </div>
                <div>
                  <p style={{ fontSize:14, fontWeight:800, color:"var(--tx)", marginBottom:2 }}>{label}</p>
                  <p style={{ fontSize:12, color:"var(--tx-3)", lineHeight:1.4 }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Site Reviews Section */}
      <section style={{ padding: "40px 0 0" }}>
        <div className="pc">
          <ReviewSection title="What Our Customers Say" showSummary />
        </div>
      </section>

      <style>{`
        @media(max-width:700px){ .banner-h{height:180px!important;} .cat-grid{grid-template-columns:repeat(3,1fr)!important;} .trust-grid{grid-template-columns:repeat(2,1fr)!important;} }
      `}</style>
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
      <p style={{ fontSize: 18, fontWeight: 800, color: "var(--tx)" }}>{title}</p>
      <Link href={href} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: NG, textDecoration: "none", fontWeight: 600 }}>
        View All <ArrowRight style={{ width: 13, height: 13 }} />
      </Link>
    </div>
  );
}
