"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Shield, Zap, Lock } from "lucide-react";
import { useSettings } from "@/lib/settings";

const NG = "#00E676";

// Social icon SVGs (inline to avoid extra dependencies)
const SocialIcons = {
  Instagram: () => (
    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }} fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  Facebook: () => (
    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }} fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  Twitter: () => (
    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  YouTube: () => (
    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }} fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  TikTok: () => (
    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }} fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  ),
  WhatsApp: () => (
    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
};

export function Footer() {
  const s = useSettings();

  const quickLinks = [
    { label: "Home",         href: "/" },
    { label: "All Products", href: "/category/all" },
    { label: "Cart",         href: "/cart" },
    { label: "My Profile",   href: "/profile" },
    { label: "Contact Us",   href: "/contact" },
  ];
  const policies = ["Privacy Policy", "Return Policy", "Terms of Service"];

  const brandName = s.logo_name?.trim() || s.store_name?.trim() || "peadia.in";

  // Collect active social links
  const socials: { href: string; label: string; Icon: () => React.ReactElement; color: string }[] = [
    s.instagram_url && { href: s.instagram_url, label: "Instagram", Icon: SocialIcons.Instagram, color: "#E1306C" },
    s.facebook_url  && { href: s.facebook_url,  label: "Facebook",  Icon: SocialIcons.Facebook,  color: "#1877F2" },
    s.twitter_url   && { href: s.twitter_url,   label: "X / Twitter",Icon: SocialIcons.Twitter,  color: "#1DA1F2" },
    s.youtube_url   && { href: s.youtube_url,   label: "YouTube",   Icon: SocialIcons.YouTube,   color: "#FF0000" },
    s.tiktok_url    && { href: s.tiktok_url,    label: "TikTok",    Icon: SocialIcons.TikTok,    color: "#69C9D0" },
    s.whatsapp_number && {
      href: `https://wa.me/${s.whatsapp_number}`,
      label: "WhatsApp",
      Icon: SocialIcons.WhatsApp,
      color: "#25D366",
    },
  ].filter(Boolean) as { href: string; label: string; Icon: () => React.ReactElement; color: string }[];

  return (
    <footer style={{
      background: "#111820",
      borderTop: "1px solid rgba(255,255,255,0.07)",
      marginTop: 48,
      paddingBottom: 72,
    }}>
      <div className="neon-line" />
      <div className="pc" style={{ padding: "36px 16px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 28, marginBottom: 28 }} className="footer-grid">

          {/* ── Brand ── */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
              {s.logo_url ? (
                <img src={s.logo_url} alt={brandName} style={{ height: 28, width: "auto", borderRadius: 5, objectFit: "contain" }}
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: `linear-gradient(135deg,${NG},#00FF88)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Zap style={{ width: 13, height: 13, color: "#0D1117" }} />
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>
                    {brandName.includes(".")
                      ? <>{brandName.split(".")[0]}<span style={{ color: NG }}>.{brandName.split(".").slice(1).join(".")}</span></>
                      : brandName}
                  </span>
                </>
              )}
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, maxWidth: 260, marginBottom: 16 }}>
              India's fastest growing e-commerce platform. Quality products, fast delivery.
            </p>

            {/* Social media icons */}
            {socials.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {socials.map(({ href, label, Icon, color }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    title={label}
                    style={{
                      width: 36, height: 36, borderRadius: 9,
                      background: `${color}18`,
                      border: `1px solid ${color}35`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color,
                      textDecoration: "none",
                    }}
                    className="social-icon"
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* ── Links ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: NG, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 10 }}>Quick Links</p>
              {quickLinks.map(l => (
                <Link key={l.label} href={l.href} className="footer-link" style={{ display:"block", fontSize:13, color:"rgba(255,255,255,0.50)", textDecoration:"none", marginBottom:7 }}>
                  {l.label}
                </Link>
              ))}
            </div>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:NG, letterSpacing:"1px", textTransform:"uppercase", marginBottom:10 }}>Support</p>
              {policies.map(l => (
                <a key={l} href="#" className="footer-link" style={{ display:"block", fontSize:13, color:"rgba(255,255,255,0.50)", textDecoration:"none", marginBottom:7 }}>
                  {l}
                </a>
              ))}
            </div>
          </div>

          {/* ── Contact ── */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: NG, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 10 }}>Contact</p>
            {[
              { Icon: Phone,  text: s.contact_phone, href: `tel:${s.contact_phone}`         },
              { Icon: Mail,   text: s.contact_email,  href: `mailto:${s.contact_email}`      },
              { Icon: MapPin, text: s.address,         href: null                            },
            ].map(({ Icon, text, href }) => (
              <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 9 }}>
                <Icon style={{ width: 13, height: 13, color: NG, flexShrink: 0, marginTop: 2 }} />
                {href
                  ? <a href={href} style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>{text}</a>
                  : <p style={{ fontSize: 13, color: "rgba(255,255,255,0.50)" }}>{text}</p>}
              </div>
            ))}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
              {["COD", "UPI", "Cards"].map(p => (
                <span key={p} style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 4, padding: "3px 8px" }}>
                  ₹ {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>© 2026 {brandName} · All rights reserved</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
              <Shield style={{ width: 11, height: 11, color: NG, opacity: 0.5 }} /> Made in India
            </div>
            {/* Admin lock icon — desktop only */}
            <Link href="/admin" title="Admin Panel" className="admin-desktop-only footer-link"
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(255,255,255,0.25)", textDecoration: "none", padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)" }}>
              <Lock style={{ width: 11, height: 11 }} /> Admin
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @media(min-width:640px){ .footer-grid { grid-template-columns: 1.5fr 1fr 1fr !important; } }
        @media(min-width:1024px){ .footer-grid { grid-template-columns: 2fr 1fr 1.5fr !important; } }
        @media(max-width:480px){ .admin-desktop-only { display:none !important; } }
      `}</style>
    </footer>
  );
}
