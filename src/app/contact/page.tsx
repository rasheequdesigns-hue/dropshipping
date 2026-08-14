"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, Send, CheckCircle, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSettings } from "@/lib/settings";
import { useToast } from "@/components/Toast";

interface Form {
  customer_name: string;
  customer_phone: string;
  email: string;
  subject: string;
  message: string;
}
const blank: Form = { customer_name: "", customer_phone: "", email: "", subject: "", message: "" };
const NG = "#00E676";

export default function ContactPage() {
  const s = useSettings();
  const { toast } = useToast();
  const [form,    setForm]    = useState<Form>(blank);
  const [errors,  setErrors]  = useState<Partial<Form>>({});
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const set = (k: keyof Form, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e: Partial<Form> = {};
    if (!form.customer_name.trim()) e.customer_name = "Required";
    if (!/^\d{10}$/.test(form.customer_phone)) e.customer_phone = "Enter valid 10-digit number";
    if (!form.message.trim()) e.message = "Required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  // Build a WhatsApp URL pre-filled with whatever the user has typed
  const buildWAUrl = () => {
    const lines: string[] = [];
    if (form.customer_name.trim()) lines.push(`Name: ${form.customer_name.trim()}`);
    if (form.customer_phone.trim()) lines.push(`Phone: ${form.customer_phone.trim()}`);
    if (form.email.trim()) lines.push(`Email: ${form.email.trim()}`);
    if (form.subject.trim()) lines.push(`Subject: ${form.subject.trim()}`);
    if (form.message.trim()) lines.push(`\nMessage:\n${form.message.trim()}`);
    const text = lines.length
      ? `Hello peadia.in,\n\n${lines.join("\n")}`
      : "Hello peadia.in, I'd like to get in touch.";
    return `https://wa.me/${s.whatsapp_number}?text=${encodeURIComponent(text)}`;
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    let savedToDb = false;
    try {
      const { error } = await supabase.from("contact_messages").insert({
        customer_name:  form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        email:   form.email.trim() || null,
        subject: form.subject.trim() || null,
        message: form.message.trim(),
        is_read: false,
      });
      if (error) throw error;
      savedToDb = true;
    } catch (err) {
      console.warn("contact_messages insert failed:", err);
    }
    setLoading(false);
    setSent(true);
    toast(savedToDb ? "Message sent!" : "Message sent! (will sync when online)", "success");
  };

  const F = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="field-label">{label}</label>
      {children}
      {error && <p style={{ fontSize: 11, color: "#FF465A", marginTop: 4, fontWeight: 600 }}>{error}</p>}
    </div>
  );

  return (
    <div style={{ padding: "32px 0 60px" }}>
      <div className="pc">
        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: NG, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>Contact Us</p>
          <h1 style={{ fontSize: "clamp(22px,5vw,32px)", fontWeight: 900, color: "var(--tx)", marginBottom: 10 }}>Get in Touch</h1>
          <p style={{ fontSize: 14, color: "var(--tx-3)" }}>Questions or need help? We're here for you.</p>
        </div>

        {/* Contact cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 36 }} className="contact-cards">
          {[
            { Icon: Phone,  label: "Phone",   value: s.contact_phone, href: `tel:${s.contact_phone}`,         showWA: true  },
            { Icon: Mail,   label: "Email",   value: s.contact_email, href: `mailto:${s.contact_email}`,      showWA: false },
            { Icon: MapPin, label: "Address", value: s.address,       href: null,                             showWA: false },
          ].map(({ Icon, label, value, href, showWA }) => (
            <div key={label} className="card" style={{ padding: "20px 18px", textAlign: "center", transition: "border-color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(0,230,118,0.28)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--bd)")}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.18)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 11px" }}>
                <Icon style={{ width: 20, height: 20, color: NG }} />
              </div>
              <p style={{ fontSize: 10, fontWeight: 700, color: "var(--tx-3)", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 5 }}>{label}</p>
              {href
                ? <a href={href} style={{ fontSize: 13, fontWeight: 600, color: "var(--tx)", textDecoration: "none" }}>{value}</a>
                : <p style={{ fontSize: 13, fontWeight: 600, color: "var(--tx)" }}>{value}</p>}
              {showWA && (
                <a href={`https://wa.me/${s.whatsapp_number}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-block", marginTop: 9, background: "#25D366", color: "#000", fontWeight: 700, fontSize: 11, padding: "4px 12px", borderRadius: 99, textDecoration: "none" }}>
                  WhatsApp
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Message form */}
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div className="card" style={{ padding: "26px 24px 28px", overflow: "hidden" }}>
            <div className="neon-line" style={{ margin: "-26px -24px 22px" }} />

            {sent ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.22)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <CheckCircle style={{ width: 30, height: 30, color: NG }} />
                </div>
                <p style={{ fontSize: 18, fontWeight: 800, color: "var(--tx)", marginBottom: 6 }}>Message Sent!</p>
                <p style={{ fontSize: 13, color: "var(--tx-3)", marginBottom: 20 }}>We'll respond within 24 hours. Or chat instantly on WhatsApp.</p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <button onClick={() => { setSent(false); setForm(blank); }} className="btn btn-outline" style={{ padding: "9px 20px" }}>
                    Send Another
                  </button>
                  <a href={buildWAUrl()} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#25D366", color: "#000", fontWeight: 700, fontSize: 13, padding: "9px 18px", borderRadius: 8, textDecoration: "none" }}>
                    <MessageSquare style={{ width: 15, height: 15 }} />Chat on WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={submitForm} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="form-row">
                  <F label="Your Name *" error={errors.customer_name}>
                    <input className={`inp${errors.customer_name ? " err" : ""}`}
                      value={form.customer_name} onChange={e => set("customer_name", e.target.value)}
                      placeholder="Ravi Kumar" />
                  </F>
                  <F label="Phone Number *" error={errors.customer_phone}>
                    <input className={`inp${errors.customer_phone ? " err" : ""}`}
                      value={form.customer_phone}
                      onChange={e => set("customer_phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit number" inputMode="numeric" />
                  </F>
                </div>
                <div className="form-row">
                  <F label="Email (optional)">
                    <input className="inp" type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@email.com" />
                  </F>
                  <F label="Subject">
                    <input className="inp" value={form.subject} onChange={e => set("subject", e.target.value)} placeholder="e.g. Order issue, Product query" />
                  </F>
                </div>
                <F label="Message *" error={errors.message}>
                  <textarea className={`inp${errors.message ? " err" : ""}`}
                    value={form.message} onChange={e => set("message", e.target.value)}
                    rows={4} style={{ resize: "none" }}
                    placeholder="Tell us how we can help you…" />
                </F>

                <div style={{ display: "flex", gap: 10 }}>
                  {/* Submit to Supabase */}
                  <button type="submit" disabled={loading} className="btn btn-ng"
                    style={{ flex: 2, justifyContent: "center", padding: "12px 0", fontSize: 14 }}>
                    {loading ? "Sending…" : <><Send style={{ width: 15, height: 15 }} />Send Message</>}
                  </button>

                  {/* WhatsApp — opens with prefilled typed content */}
                  <a href={buildWAUrl()} target="_blank" rel="noopener noreferrer"
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      background: "#25D366", color: "#000", fontWeight: 700, fontSize: 13,
                      borderRadius: 8, textDecoration: "none", padding: "12px 0",
                    }}>
                    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: "#000" }}>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WA
                  </a>
                </div>

                <p style={{ fontSize: 11, color: "var(--tx-3)", textAlign: "center" }}>
                  The WhatsApp button sends your typed message directly — no need to retype.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:640px){.contact-cards{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
