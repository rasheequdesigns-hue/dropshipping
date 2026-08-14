"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingCart, Tag, Image,
  ArrowLeft, Users, MessageSquare, Settings, Plus, Zap, BarChart2,
} from "lucide-react";
import { AdminAuth } from "@/components/AdminAuth";

const NAV = [
  { href: "/admin",            label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/orders",     label: "Orders",    Icon: ShoppingCart    },
  { href: "/admin/products",   label: "Products",  Icon: Package         },
  { href: "/admin/categories", label: "Categories",Icon: Tag             },
  { href: "/admin/banners",    label: "Banners",   Icon: Image           },
  { href: "/admin/users",      label: "Customers", Icon: Users           },
  { href: "/admin/messages",   label: "Messages",  Icon: MessageSquare   },
  { href: "/admin/investor",  label: "Investors",  Icon: BarChart2      },
  { href: "/admin/settings",   label: "Settings",  Icon: Settings        },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (h: string) => h === "/admin" ? pathname === h : pathname.startsWith(h);

  return (
    <AdminAuth>
      <div style={{ minHeight: "100vh", background: "#0D1117", display: "flex", flexDirection: "column" }}>

        {/* Top Header */}
        <header style={{ position: "sticky", top: 0, zIndex: 50, background: "#161B22", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="neon-line" />
          <div className="pc" style={{ display: "flex", alignItems: "center", gap: 10, height: 52 }}>
            <Link href="/" className="hover-ng"
              style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.40)", textDecoration:"none", padding:"5px 8px", borderRadius:6, flexShrink:0 }}>
              <ArrowLeft style={{ width:13, height:13 }} /><span className="back-lbl">Store</span>
            </Link>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.10)", flexShrink: 0 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg,#00E676,#00FF88)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Zap style={{ width: 13, height: 13, color: "#0D1117" }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>peadia.in</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#00E676", background: "rgba(0,230,118,0.12)", border: "1px solid rgba(0,230,118,0.25)", padding: "1px 6px", borderRadius: 99 }}>ADMIN</span>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <Link href="/admin/products" className="btn btn-ng btn-sm" style={{ gap: 5, whiteSpace: "nowrap" }}>
                <Plus style={{ width: 12, height: 12 }} /><span className="new-prod-lbl">New Product</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Body */}
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

          {/* Sidebar */}
          <aside className="admin-sidebar" style={{ width: 200, flexShrink: 0, background: "#161B22", borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", padding: "16px 10px", position: "sticky", top: 53, height: "calc(100vh - 53px)", overflowY: "auto" }}>
            <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {NAV.map(({ href, label, Icon }) => {
                const a = isActive(href);
                return (
                  <Link key={href} href={href}
                    className={`admin-nav-link${a ? " active" : ""}`}
                    style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 10px", borderRadius:7, textDecoration:"none", background:a ? "rgba(0,230,118,0.10)" : "transparent", color:a ? "#00E676" : "rgba(255,255,255,0.55)", fontWeight:a ? 700 : 400, fontSize:13, border:a ? "1px solid rgba(0,230,118,0.22)" : "1px solid transparent" }}>
                    <Icon style={{ width:15, height:15, flexShrink:0 }} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Mobile tabs */}
          <div className="admin-tabs" style={{ display: "none", overflowX: "auto", gap: 5, padding: "8px 12px", background: "#161B22", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
            {NAV.map(({ href, label, Icon }) => {
              const a = isActive(href);
              return (
                <Link key={href} href={href} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 99, whiteSpace: "nowrap", textDecoration: "none", fontSize: 11, fontWeight: a ? 700 : 500, background: a ? "rgba(0,230,118,0.12)" : "rgba(255,255,255,0.04)", color: a ? "#00E676" : "rgba(255,255,255,0.50)", border: `1px solid ${a ? "rgba(0,230,118,0.25)" : "rgba(255,255,255,0.07)"}`, flexShrink: 0 }}>
                  <Icon style={{ width: 11, height: 11 }} />{label}
                </Link>
              );
            })}
          </div>

          {/* Main */}
          <main style={{ flex: 1, minWidth: 0, padding: "20px 16px 48px", overflowY: "auto" }} className="admin-main">
            {children}
          </main>
        </div>

        <style>{`
          @media(min-width:768px){
            .admin-sidebar { display:flex !important; }
            .admin-tabs    { display:none  !important; }
            .admin-main    { padding: 24px 28px 48px !important; }
            .back-lbl      { display:inline !important; }
            .new-prod-lbl  { display:inline !important; }
          }
          @media(max-width:767px){
            .admin-sidebar { display:none !important; }
            .admin-tabs    { display:flex !important; width:100%; }
            .back-lbl      { display:none !important; }
            .new-prod-lbl  { display:none !important; }
          }
        `}</style>
      </div>
    </AdminAuth>
  );
}
