/**
 * Promo Code System — peadia.in
 * 
 * Design:
 *  1. Admin configures promo_code + promo_discount_percent in store_settings
 *  2. Customers enter code at cart or checkout
 *  3. validatePromo() checks both the admin code AND local fallback codes
 *  4. discount is applied client-side; the final total is stored in orders.total_amount
 *
 * Reward integration:
 *  - Users can also redeem reward_balance as a discount
 *  - Referral rewards are credited after successful order placement
 */

import { fetchSettings } from "./settings";

export interface PromoResult {
  valid: boolean;
  type: "percent" | "flat" | null;
  value: number;          // percent (0-100) or flat ₹ amount
  discount: number;       // actual ₹ discount on the given subtotal
  message: string;
  code: string;
}

/** Static fallback codes (always work regardless of DB) */
const STATIC_CODES: Record<string, { type: "percent" | "flat"; value: number }> = {
  SAVE50:   { type: "flat",    value: 50  },
  FLAT100:  { type: "flat",    value: 100 },
  WELCOME:  { type: "percent", value: 15  },
  NEWUSER:  { type: "percent", value: 20  },
};

/**
 * Validate a promo code against store_settings (admin code) + static fallbacks.
 * @param code  Code entered by customer (will be uppercased)
 * @param subtotal  Cart subtotal BEFORE discount, in ₹
 */
export async function validatePromo(code: string, subtotal: number): Promise<PromoResult> {
  const upper = code.trim().toUpperCase();
  if (!upper) return { valid: false, type: null, value: 0, discount: 0, message: "Enter a promo code", code: upper };

  // 1. Check admin-configured code from store_settings
  try {
    const s = await fetchSettings();
    if (s.promo_code && upper === s.promo_code.toUpperCase()) {
      const pct     = s.promo_discount_percent ?? 10;
      const discount = Math.round(subtotal * pct / 100);
      return {
        valid: true, type: "percent", value: pct, discount,
        message: `✓ ${pct}% off applied! You save ₹${discount}`,
        code: upper,
      };
    }
  } catch { /* offline — fall through to static codes */ }

  // 2. Static fallback codes
  const sc = STATIC_CODES[upper];
  if (sc) {
    const discount = sc.type === "percent"
      ? Math.round(subtotal * sc.value / 100)
      : Math.min(sc.value, subtotal); // flat can't exceed subtotal
    return {
      valid: true, type: sc.type, value: sc.value, discount,
      message: sc.type === "percent"
        ? `✓ ${sc.value}% off! You save ₹${discount}`
        : `✓ Flat ₹${discount} off applied!`,
      code: upper,
    };
  }

  return { valid: false, type: null, value: 0, discount: 0, message: "✗ Invalid promo code", code: upper };
}

/**
 * Apply reward balance as a discount.
 * Returns the actual ₹ deducted (capped at total).
 */
export function applyRewardBalance(rewardBalance: number, total: number): number {
  return Math.min(Math.floor(rewardBalance), Math.floor(total));
}

/**
 * Calculate the final order total with all discounts applied.
 */
export function calculateOrderTotal(params: {
  subtotal: number;
  promoDiscount: number;
  rewardDiscount: number;
  deliveryFee: number;
}): number {
  const { subtotal, promoDiscount, rewardDiscount, deliveryFee } = params;
  return Math.max(0, subtotal - promoDiscount - rewardDiscount + deliveryFee);
}
