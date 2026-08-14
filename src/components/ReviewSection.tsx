"use client";

import { useState, useEffect } from "react";
import { Star, Send, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Review {
  id: string;
  product_id: string | null;
  name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ReviewSectionProps {
  productId?: string;         // pass for product reviews, omit for site-wide
  title?: string;             // section heading
  showSummary?: boolean;      // show avg rating banner
}

function StarRow({ rating, onChange, size = 22 }: { rating: number; onChange?: (r: number) => void; size?: number }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHovered(n)}
          onMouseLeave={() => onChange && setHovered(0)}
          aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
          style={{ background: "none", border: "none", cursor: onChange ? "pointer" : "default", padding: 2, lineHeight: 1 }}
        >
          <Star
            style={{ width: size, height: size }}
            fill={(hovered || rating) >= n ? "#FFC400" : "transparent"}
            stroke={(hovered || rating) >= n ? "#FFC400" : "rgba(255,255,255,0.25)"}
          />
        </button>
      ))}
    </div>
  );
}

const LABELS = ["", "Terrible", "Poor", "Okay", "Good", "Excellent"];

export function ReviewSection({ productId, title, showSummary = true }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState<{ name?: string; rating?: string; comment?: string }>({});

  useEffect(() => {
    loadReviews();
  }, [productId]);

  async function loadReviews() {
    setLoading(true);
    try {
      let query = supabase
        .from("reviews")
        .select("*")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (productId) {
        query = query.eq("product_id", productId);
      } else {
        query = query.is("product_id", null);
      }

      const { data } = await query;
      if (data) setReviews(data as Review[]);
    } catch { }
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
        name: name.trim(),
        rating,
        comment: comment.trim(),
        is_approved: false,
      });
      setSubmitted(true);
      setName(""); setRating(0); setComment(""); setErrors({});
    } catch { }
    setSubmitting(false);
  }

  const avg = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)
    : 0;

  const dist = [5, 4, 3, 2, 1].map(n => ({
    n,
    count: reviews.filter(r => r.rating === n).length,
    pct: reviews.length > 0 ? (reviews.filter(r => r.rating === n).length / reviews.length) * 100 : 0,
  }));

  return (
    <div style={{ marginTop: 48 }}>
      {/* Heading */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <MessageSquare style={{ width: 20, height: 20, color: "var(--ng)" }} />
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--tx)" }}>
          {title ?? (productId ? "Customer Reviews" : "What Our Customers Say")}
        </h2>
        {reviews.length > 0 && (
          <span style={{ fontSize: 12, color: "var(--tx-3)", background: "var(--bg-elevated)", border: "1px solid var(--bd)", padding: "2px 9px", borderRadius: 99 }}>
            {reviews.length}
          </span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
        {/* Summary + Distribution */}
        {showSummary && reviews.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 20, background: "var(--bg-card)", border: "1px solid var(--bd)", borderRadius: 16, padding: "20px 22px", alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 52, fontWeight: 900, color: "var(--tx)", lineHeight: 1 }}>{avg.toFixed(1)}</p>
              <StarRow rating={Math.round(avg)} size={16} />
              <p style={{ fontSize: 11, color: "var(--tx-3)", marginTop: 4 }}>{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {dist.map(({ n, count, pct }) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "var(--tx-3)", width: 14, textAlign: "right" }}>{n}</span>
                  <Star style={{ width: 11, height: 11, fill: "#FFC400", stroke: "#FFC400" }} />
                  <div style={{ flex: 1, height: 6, background: "var(--bg-elevated)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "#FFC400", borderRadius: 99, transition: "width 0.4s ease" }} />
                  </div>
                  <span style={{ fontSize: 11, color: "var(--tx-3)", width: 18 }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Write a review form */}
        <div className="card" style={{ padding: "20px 22px" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--tx)", marginBottom: 16 }}>Write a Review</p>

          {submitted ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--tx)", marginBottom: 6 }}>Thank you!</p>
              <p style={{ fontSize: 13, color: "var(--tx-3)" }}>Your review has been submitted and will appear after approval.</p>
              <button onClick={() => setSubmitted(false)} className="btn btn-dark" style={{ marginTop: 16 }}>Write Another</button>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="field-label">Your Rating *</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <StarRow rating={rating} onChange={setRating} size={28} />
                  {rating > 0 && <span style={{ fontSize: 13, color: "#FFC400", fontWeight: 600 }}>{LABELS[rating]}</span>}
                </div>
                {errors.rating && <p style={{ fontSize: 11, color: "#FF465A", marginTop: 4, fontWeight: 600 }}>{errors.rating}</p>}
              </div>

              <div>
                <label className="field-label">Your Name *</label>
                <input
                  className={`inp${errors.name ? " err" : ""}`}
                  value={name}
                  onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: "" })); }}
                  placeholder="Ravi Kumar"
                />
                {errors.name && <p style={{ fontSize: 11, color: "#FF465A", marginTop: 4, fontWeight: 600 }}>{errors.name}</p>}
              </div>

              <div>
                <label className="field-label">Your Review *</label>
                <textarea
                  className={`inp${errors.comment ? " err" : ""}`}
                  value={comment}
                  onChange={e => { setComment(e.target.value); setErrors(p => ({ ...p, comment: "" })); }}
                  placeholder="Tell others about your experience…"
                  rows={3}
                  style={{ resize: "none" }}
                />
                {errors.comment && <p style={{ fontSize: 11, color: "#FF465A", marginTop: 4, fontWeight: 600 }}>{errors.comment}</p>}
              </div>

              <button type="submit" disabled={submitting} className="btn btn-ng" style={{ gap: 7, justifyContent: "center" }}>
                <Send style={{ width: 14, height: 14 }} />
                {submitting ? "Submitting…" : "Submit Review"}
              </button>
            </form>
          )}
        </div>

        {/* Reviews list */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[...Array(3)].map((_, i) => <div key={i} className="shimmer" style={{ height: 90, borderRadius: 14 }} />)}
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", background: "var(--bg-card)", border: "1px solid var(--bd)", borderRadius: 16 }}>
            <Star style={{ width: 28, height: 28, color: "var(--tx-4)", margin: "0 auto 10px" }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--tx-2)", marginBottom: 4 }}>No reviews yet</p>
            <p style={{ fontSize: 13, color: "var(--tx-3)" }}>Be the first to share your experience!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {reviews.map(r => (
              <div key={r.id} style={{ background: "var(--bg-card)", border: "1px solid var(--bd)", borderRadius: 14, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "var(--tx)" }}>{r.name}</p>
                    <StarRow rating={r.rating} size={14} />
                  </div>
                  <span style={{ fontSize: 11, color: "var(--tx-3)", flexShrink: 0, marginTop: 2 }}>
                    {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "var(--tx-2)", lineHeight: 1.6 }}>{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
