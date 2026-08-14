"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3x3, ShoppingCart, User } from "lucide-react";
import { useCart } from "./CartProvider";

const links = [
  { href: "/",             label: "Home",    Icon: Home        },
  { href: "/category/all", label: "Browse",  Icon: Grid3x3     },
  { href: "/cart",         label: "Cart",    Icon: ShoppingCart },
  { href: "/profile",      label: "Profile", Icon: User        },
];
const NG = "#00E676";

export function MobileNav() {
  const { itemCount } = useCart();
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="mob-nav">
      {links.map(({ href, label, Icon }) => {
        const active = pathname === href;
        const isCart = href === "/cart";
        return (
          <Link key={href} href={href} className="mob-link"
            style={{ textDecoration:"none", display:"flex", flexDirection:"column", alignItems:"center", gap:3, minWidth:52, position:"relative" }}>
            <div style={{
              width:40, height:30, borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center",
              background: active ? "rgba(0,230,118,0.10)" : "transparent",
              border: active ? "1px solid rgba(0,230,118,0.20)" : "1px solid transparent",
            }}>
              <Icon style={{ width:19, height:19, color: active ? NG : "var(--tx-3)" }} />
              {isCart && itemCount > 0 && (
                <span style={{ position:"absolute", top:0, right:4, background:NG, color:"#0D1117", fontSize:9, fontWeight:900, borderRadius:"50%", width:15, height:15, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </div>
            <span style={{ fontSize:10, fontWeight:active ? 700 : 400, color:active ? NG : "var(--tx-3)" }}>
              {label}
            </span>
          </Link>
        );
      })}

      <style>{`
        /* CSS-only active state animation — no JS handlers */
        .mob-link:active > div { transform: scale(0.92); }
      `}</style>
    </nav>
  );
}
