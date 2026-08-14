"use client";

import Link from "next/link";
import { Star, ShoppingCart } from "lucide-react";
import { Product } from "@/lib/supabase";
import { useCart } from "./CartProvider";
import { useToast } from "./Toast";

const NG = "#00E676";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { toast }   = useToast();

  const discount = product.mrp_price > product.sale_price
    ? Math.round(((product.mrp_price - product.sale_price) / product.mrp_price) * 100) : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    addItem(product);
    toast("Added to cart!", "success");
  };

  return (
    <Link href={`/product/${product.id}`} className="pcard" style={{ display:"block", textDecoration:"none" }}>
      {/* Image */}
      <div className="pcard-img">
        {product.images?.[0]
          ? <img src={product.images[0]} alt={product.title} loading="lazy" />
          : <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", color:"var(--tx-4)", fontSize:12 }}>No Image</div>}
        {discount > 0 && (
          <div style={{ position:"absolute", top:8, left:8, background:NG, color:"#0D1117", fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:4 }}>
            {discount}% OFF
          </div>
        )}
        {product.is_featured && (
          <div style={{ position:"absolute", top:8, right:8, background:"rgba(255,196,0,0.15)", border:"1px solid rgba(255,196,0,0.35)", color:"#FFC400", fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:4 }}>
            ★ Featured
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding:"12px 13px 13px" }}>
        {product.brand_name && (
          <p style={{ fontSize:10, fontWeight:700, color:NG, letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:3, opacity:0.7 }}>{product.brand_name}</p>
        )}
        <p style={{ fontSize:13, fontWeight:500, color:"var(--tx)", lineHeight:1.45, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden", minHeight:37, marginBottom:8 }}>
          {product.title}
        </p>

        {/* Rating */}
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:3, background:"rgba(0,230,118,0.08)", border:"1px solid rgba(0,230,118,0.18)", borderRadius:4, padding:"2px 6px" }}>
            <span style={{ fontSize:11, fontWeight:700, color:NG }}>4.2</span>
            <Star style={{ width:10, height:10, fill:NG, color:NG }} />
          </div>
          <span style={{ fontSize:10, color:"var(--tx-3)" }}>(124)</span>
        </div>

        {/* Price */}
        <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:10 }}>
          <span style={{ fontSize:17, fontWeight:800, color:"var(--tx)" }}>₹{product.sale_price.toLocaleString()}</span>
          {discount > 0 && <span style={{ fontSize:12, color:"var(--tx-3)", textDecoration:"line-through" }}>₹{product.mrp_price.toLocaleString()}</span>}
        </div>

        {/* Add to cart — pure CSS hover via .btn classes */}
        <button onClick={handleAdd} disabled={product.stock === 0}
          className={product.stock === 0 ? "btn btn-dark" : "btn btn-outline"}
          style={{ width:"100%", padding:"8px 0", fontSize:12, justifyContent:"center", gap:5, borderRadius:7 }}>
          <ShoppingCart style={{ width:13, height:13 }} />
          {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </Link>
  );
}
