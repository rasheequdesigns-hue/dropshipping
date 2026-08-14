"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Search, ShoppingCart, Moon, Sun, X, Zap } from "lucide-react";
import { useCart } from "./CartProvider";
import { useTheme } from "./ThemeProvider";
import { supabase, Product } from "@/lib/supabase";
import { demoProducts } from "@/lib/demoData";
import { useSettings } from "@/lib/settings";

const NG = "#00E676";

export function Header() {
  const { itemCount } = useCart();
  const { theme, toggle } = useTheme();
  const s = useSettings();
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<Product[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const lo = query.toLowerCase();
    setResults(demoProducts.filter(p => p.title.toLowerCase().includes(lo)).slice(0, 6));
    const t = setTimeout(async () => {
      try {
        const { data } = await supabase.from("products").select("id,title,images,sale_price").ilike("title", `%${query}%`).limit(6);
        if (data?.length) setResults(data as Product[]);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setResults([]); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Brand display — use logo_url if set, else logo_name or fallback "peadia.in"
  const logoUrl  = s.logo_url?.trim();
  const brandName = s.logo_name?.trim() || s.store_name?.trim() || "peadia.in";

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{
        background: theme === "light" ? "#FFFFFF" : (scrolled ? "#111820" : "#161B22"),
        borderBottom: `1px solid ${theme === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"}`,
        boxShadow: scrolled ? "0 1px 12px rgba(0,0,0,0.3)" : "none",
        transition: "background 0.2s, box-shadow 0.2s",
      }}>
        <div className="neon-line" />
        <div className="pc" style={{ display: "flex", alignItems: "center", gap: 10, height: 54 }}>

          {/* ── Logo ── */}
          <Link href="/" style={{ textDecoration: "none", flexShrink: 0, display: "flex", alignItems: "center", gap: 7 }}>
            {logoUrl ? (
              <img src={logoUrl} alt={brandName}
                style={{ height: 32, width: "auto", maxWidth: 160, borderRadius: 6, objectFit: "contain" }}
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div style={{ width: 28, height: 28, borderRadius: 7, background: `linear-gradient(135deg,${NG},#00FF88)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Zap style={{ width: 15, height: 15, color: "#0D1117" }} />
              </div>
            )}
            <span style={{ fontSize: 17, fontWeight: 800, color: "var(--tx)", letterSpacing: "-0.3px" }}>
              {brandName.includes(".") ? (
                <>
                  {brandName.split(".")[0]}
                  <span style={{ color: NG }}>.{brandName.split(".").slice(1).join(".")}</span>
                </>
              ) : (
                brandName
              )}
            </span>
          </Link>

          {/* Search — desktop */}
          <div ref={searchRef} style={{ flex: 1, maxWidth: 460, position: "relative" }} className="srch-desk">
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--bg-elevated)", border: "1.5px solid var(--bd)", borderRadius: 8, padding: "7px 12px", transition: "border-color 0.15s" }}
              onFocusCapture={e => (e.currentTarget.style.borderColor = NG)}
              onBlurCapture={e => (e.currentTarget.style.borderColor = "var(--bd)")}>
              <Search style={{ width: 14, height: 14, color: "var(--tx-3)", flexShrink: 0 }} />
              <input type="text" placeholder={`Search ${brandName}…`} value={query} onChange={e => setQuery(e.target.value)}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: "var(--tx)", minWidth: 0 }} />
              {query && (
                <button onClick={() => { setQuery(""); setResults([]); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--tx-3)", display: "flex", padding: 0 }}>
                  <X style={{ width: 13, height: 13 }} />
                </button>
              )}
            </div>
            {results.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "var(--bg-card)", border: "1px solid rgba(0,230,118,0.22)", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", overflow: "hidden", zIndex: 200 }}>
                {results.map((p, i) => (
                  <Link key={p.id} href={`/product/${p.id}`} onClick={() => { setQuery(""); setResults([]); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", textDecoration: "none", borderBottom: i < results.length - 1 ? "1px solid var(--bd)" : "none", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    {p.images?.[0] && (
                      <div style={{ width: 36, height: 36, borderRadius: 7, overflow: "hidden", flexShrink: 0, background: "var(--bg-elevated)" }}>
                        <img src={p.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--tx)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</p>
                      <p style={{ fontSize: 12, color: NG, fontWeight: 700 }}>₹{p.sale_price?.toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
            <button onClick={toggle}
              style={{ width: 34, height: 34, borderRadius: 8, background: "var(--bg-elevated)", border: "1px solid var(--bd)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--tx-2)", transition: "all 0.15s", flexShrink: 0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = NG; (e.currentTarget as HTMLButtonElement).style.color = NG; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--bd)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--tx-2)"; }}>
              {theme === "dark" ? <Sun style={{ width: 15, height: 15 }} /> : <Moon style={{ width: 15, height: 15 }} />}
            </button>

            {/* Profile link */}
            <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: 5, textDecoration: "none", background: "var(--bg-elevated)", border: "1px solid var(--bd)", borderRadius: 8, padding: "7px 11px", color: "var(--tx-2)", fontSize: 13, fontWeight: 600, transition: "all 0.15s", flexShrink: 0 }}
              onMouseEnter={e => { const a = e.currentTarget as HTMLAnchorElement; a.style.borderColor = NG; a.style.color = NG; }}
              onMouseLeave={e => { const a = e.currentTarget as HTMLAnchorElement; a.style.borderColor = "var(--bd)"; a.style.color = "var(--tx-2)"; }}>
              <span style={{ fontSize: 14 }}>👤</span>
              <span className="profile-lbl" style={{ display: "none" }}>Profile</span>
            </Link>

            <Link href="/cart"
              style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", position: "relative", background: "var(--bg-elevated)", border: "1px solid var(--bd)", borderRadius: 8, padding: "7px 12px", color: "var(--tx)", fontSize: 13, fontWeight: 600, transition: "all 0.15s", flexShrink: 0 }}
              onMouseEnter={e => { const a = e.currentTarget as HTMLAnchorElement; a.style.borderColor = NG; a.style.background = "rgba(0,230,118,0.06)"; }}
              onMouseLeave={e => { const a = e.currentTarget as HTMLAnchorElement; a.style.borderColor = "var(--bd)"; a.style.background = "var(--bg-elevated)"; }}>
              <ShoppingCart style={{ width: 16, height: 16 }} />
              <span className="cart-lbl" style={{ display: "none" }}>Cart</span>
              {itemCount > 0 && (
                <span style={{ position: "absolute", top: -7, right: -7, background: NG, color: "#0D1117", fontSize: 10, fontWeight: 900, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile search */}
        <div className="srch-mob" style={{ padding: "0 14px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--bg-elevated)", border: "1px solid var(--bd)", borderRadius: 8, padding: "7px 11px" }}>
            <Search style={{ width: 13, height: 13, color: "var(--tx-3)", flexShrink: 0 }} />
            <input type="text" placeholder={`Search ${brandName}…`} value={query} onChange={e => setQuery(e.target.value)}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: "var(--tx)" }} />
          </div>
        </div>
      </div>

      <style>{`
        @media(min-width:540px){ .cart-lbl { display:inline !important; } .profile-lbl { display:inline !important; } }
        @media(min-width:768px){ .srch-mob { display:none !important; } }
        @media(max-width:767px){ .srch-desk { display:none !important; } }
      `}</style>
    </header>
  );
}
