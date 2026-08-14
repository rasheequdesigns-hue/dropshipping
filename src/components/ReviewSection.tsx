"use client";

import { useState, useEffect } from "react";
import { Star, Send, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";

const NG = "#00E676";

interface Review {
  id: string;
  product_id: string | null;
  name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ReviewSectionProps {
  productId?: string;
  title?: string;
  showSummary?: boolean;
}

// Defined at module scope to avoid remount focus-loss bug
function StarRow({ rating, onChange, size = 22 }: { rating: number; onChange?: (r: number) => void; size?: number }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHovered(n)}
          onMouseLeave={() => onChange && setHovered(0)}
          aria-label={`Rate ${n} stars`}
          style={{ background: "none", border: "none", cursor: onChange ? "pointer" : "default", padding: 2, lineHeight: 1 }}>
          <Star style={{ width: size, height: size }}
            fill={(hovered || rating) >= n ? "#FFC400" : "transparent"}
            stroke={(hovered || rating) >= n ? "#FFC400" : "rgba(255,255,255,0.25)"} />
        </button>
      ))}
    </div>
  );
}

const LABELS = ["", "Terrible", "Poor", "Okay", "Good", "Excellent"];

function FieldWrap({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
      {error && <p style={{ fontSize: 11, color: "#FF465A", marginTop: 4, fontWeight: 600 }}>{error}</p>}
    </div>
  );
}

export function ReviewSection({ productId, title, showSummary = true }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState<{ name?: string; rating?: string; comment?: string }>({});

  useEffect(() => { loadReviews(); }, [productId]);

  async function loadReviews() {
    setLoading(true);
    try {
      let query = supabase.from("reviews").select("*")
        .order("created_at", { ascending: false }).limit(30);
      if (productId) query = query.eq("product_id", productId);
      else query = query.is("product_id", null);
      const { data } = await query;
      if (data) setReviews(data as Review[]);
    } catch {}
    setLoading(false);
  }

  function validate() {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Your name is required";
    if (!rating) e.rating = "Please select a rating";
    if (comment.trim().length < 5) e.comment = "Write at least a few words";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await supabase.from("reviews").insert({
        product_id: productId ?? null,
        name: name.trim(), rating, comment: comment.trim(),
        is_approved: true,
      });
      setSubmitted(true);
      setName(""); setRating(0); setComment(""); setErrors({});
      await loadReviews();
    } catch {}
    setSubmitting(false);
  }

  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const dist = [5, 4, 3, 2, 1].map(n => ({
    n,
    count: reviews.filter(r => r.rating === n).length,
    pct: reviews.length > 0 ? (reviews.filter(r => r.rating === n).length / reviews.length) * 100 : 0,
  }));

  const badgeColor = (r: number) => r >= 4 ? NG : r === 3 ? "#FFC400" : "#FF465A";
  const badgeBg = (r: number) => r >= 4 ? "rgba(0,230,118,0.1)" : r === 3 ? "rgba(255,196,0,0.1)" : "rgba(255,70,90,0.1)";
  const badgeBorder = (r: number) => r >= 4 ? "rgba(0,230,118,0.25)" : r === 3 ? "rgba(255,196,0,0.25)" : "rgba(255,70,90,0.25)";

  return (
    <div style={{ marginTop: 48 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <MessageSquare style={{ width: 20, height: 20, color: NG }} />
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--tx)", letterSpacing: "-0.3px" }}>
          {title ?? (productId ? "Customer Reviews" : "What Our Customers Say")}
        </h2>
        {reviews.length > 0 && (
          <span style={{ fontSize: 12, color: NG, background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.25)", padding: "2px 9px", borderRadius: 99, fontWeight: 700 }}>
            {reviews.length}
          </span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
        {showSummary && reviews.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 20, background: "linear-gradient(145deg, rgba(0,230,118,0.04), rgba(0,230,118,0.01))", border: "1px solid rgba(0,230,118,0.15)", borderRadius: 20, padding: "24px", alignItems: "center" }}>
            <div style={{ textAlign: "center", minWidth: 90 }}>
              <p style={{ fontSize: 56, fontWeight: 900, color: "var(--tx)", lineHeight: 1, letterSpacing: "-2px" }}>{avg.toFixed(1)}</p>
              <StarRow rating={Math.round(avg)} size={16} />
              <p style={{ fontSize: 11, color: "var(--tx-3)", marginTop: 6 }}>{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {dist.map(({ n, count, pct }) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "var(--tx-3)", width: 14, textAlign: "right", fontWeight: 600 }}>{n}</span>
                  <Star style={{ width: 11, height: 11, fill: "#FFC400", stroke: "#FFC400" }} />
                  <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #FFC400, #FFD740)", borderRadius: 99, transition: "width 0.5s ease" }} />
                  </div>
                  <span style={{ fontSize: 11, color: "var(--tx-3)", width: 18, fontWeight: 600 }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Write review form */}
        <div className="card" style={{ padding: "24px", overflow: "hidden" }}>
          <div className="neon-line" style={{ margin: "-24px -24px 20px" }} />
          <p style={{ fontSize: 15, fontWeight: 800, color: "var(--tx)", marginBottom: 18 }}>Write a Review</p>
          {submitted ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🎉</div>
              <p style={{ fontSize: 17, fontWeight: 800, color: "var(--tx)", marginBottom: 6 }}>Thank you!</p>
              <p style={{ fontSize: 13, color: "var(--tx-3)" }}>Your review is now live.</p>
              <button onClick={() => setSubmitted(false)} className="btn btn-dark" style={{ marginTop: 16 }}>Write Another</button>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <FieldWrap label="Your Rating *" error={errors.rating}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <StarRow rating={rating} onChange={setRating} size={30} />
                  {rating > 0 && <span style={{ fontSize: 13, color: "#FFC400", fontWeight: 700, background: "rgba(255,196,0,0.1)", padding: "2px 10px", borderRadius: 99 }}>{LABELS[rating]}</span>}
                </div>
              </FieldWrap>
              <FieldWrap label="Your Name *" error={errors.name}>
                <input className={`inp${errors.name ? " err" : ""}`} value={name}
                  onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: "" })); }}
                  placeholder="Ravi Kumar" />
              </FieldWrap>
              <FieldWrap label="Your Review *" error={errors.comment}>
                <textarea className={`inp${errors.comment ? " err" : ""}`} value={comment}
                  onChange={e => { setComment(e.target.value); setErrors(p => ({ ...p, comment: "" })); }}
                  placeholder="Tell others about your experience..." rows={3} style={{ resize: "none" }} />
              </FieldWrap>
              <button type="submit" disabled={submitting} className="btn btn-ng" style={{ gap: 7, justifyContent: "center" }}>
                <Send style={{ width: 14, height: 14 }} />
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          )}
        </div>

        {/* Review list */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[...Array(3)].map((_, i) => <div key={i} className="shimmer" style={{ height: 120, borderRadius: 16 }} />)}
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", background: "linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20 }}>
            <Star style={{ width: 32, height: 32, color: "rgba(255,196,0,0.4)", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 16, fontWeight: 800, color: "var(--tx-2)", marginBottom: 6 }}>No reviews yet</p>
            <p style={{ fontSize: 13, color: "var(--tx-3)" }}>Be the first to share your experience!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
            {reviews.map(r => (
              <div key={r.id} style={{
                background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 18, padding: "22px 24px",
                position: "relative", overflow: "hidden",
                boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "rgba(0,230,118,0.22)"; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 10px 36px rgba(0,0,0,0.22)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "rgba(255,255,255,0.08)"; el.style.transform = "translateY(0)"; el.style.boxShadow = "0 4px 24px rgba(0,0,0,0.12)"; }}
              >
                {/* Decorative quote */}
                <div style={{ position: "absolute", top: -22, right: 16, fontSize: 120, color: "rgba(0,230,118,0.04)", fontWeight: 900, fontFamily: "serif", lineHeight: 1, pointerEvents: "none", userSelect: "none" }}>"</div>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: "linear-gradient(135deg,rgba(0,230,118,0.15),rgba(0,230,118,0.05))", border: "1px solid rgba(0,230,118,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 19, fontWeight: 900, color: NG }}>
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "var(--tx)", marginBottom: 4 }}>{r.name}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <StarRow rating={r.rating} size={13} />
                      <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: "var(--tx-3)", fontWeight: 500 }}>
                        {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, fontSize: 11, fontWeight: 900, color: badgeColor(r.rating), background: badgeBg(r.rating), border: `1px solid ${badgeBorder(r.rating)}`, padding: "3px 10px", borderRadius: 99 }}>
                    {LABELS[r.rating]}
                  </div>
                </div>

                {/* Comment */}
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.75, fontStyle: "italic", position: "relative", zIndex: 1 }}>
                  &ldquo;{r.comment}&rdquo;
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
