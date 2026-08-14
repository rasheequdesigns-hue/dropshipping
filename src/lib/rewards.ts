/**
 * Referral & Rewards System — peadia.in
 *
 * HOW IT WORKS:
 *
 * 1. SHARING A PRODUCT
 *    - Customer visits /profile, enters phone → gets a unique referral_code
 *    - They share a link like: peadia.in/product/[id]?ref=PE123456ABC
 *    - The referral code is stored in sessionStorage on the recipient's device
 *
 * 2. PLACING AN ORDER WITH A REFERRAL
 *    - At checkout, we read sessionStorage "peadia_ref" to get the referral code
 *    - After the order is placed, creditReferralReward() is called
 *    - The referrer's reward_balance / reward_points are updated in user_profiles
 *    - A reward_transactions record is created for audit trail
 *
 * 3. REDEEMING REWARDS
 *    - Customer visits /profile, sees their reward_balance
 *    - At checkout, they can optionally apply their reward balance as a discount
 *    - After order is placed, deductRewardBalance() deducts the used amount
 *
 * 4. ADMIN CONTROL
 *    - Admin sets referral_reward_type + referral_reward_value per product
 *    - Admin can view/edit/grant rewards in /admin/users
 *    - All transactions logged in reward_transactions table
 */

import { supabase } from "./supabase";

export function generateCode(phone: string): string {
  const base = phone.slice(-6);
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `PE${base}${rand}`;
}

/** Get or create a user profile by phone number */
export async function getOrCreateProfile(phone: string, name?: string, email?: string) {
  try {
    const { data: existing } = await supabase
      .from("user_profiles").select("*").eq("phone", phone).single();
    if (existing) return existing;
    const { data } = await supabase
      .from("user_profiles")
      .insert({ phone, name: name || null, email: email || null, referral_code: generateCode(phone) })
      .select().single();
    return data;
  } catch { return null; }
}

/**
 * Credit referral reward to the referrer when a referred order is placed.
 * Called from checkout after order is created.
 */
export async function creditReferralReward(params: {
  referrerCode: string;       // from sessionStorage "peadia_ref"
  rewardType: string;         // product.referral_reward_type
  rewardValue: number;        // product.referral_reward_value
  orderId: string;
  orderTotal: number;
}): Promise<void> {
  const { referrerCode, rewardType, rewardValue, orderId, orderTotal } = params;
  if (!referrerCode || rewardType === "none" || !rewardValue) return;

  try {
    const { data: referrer } = await supabase
      .from("user_profiles")
      .select("id, phone, reward_balance, reward_points")
      .eq("referral_code", referrerCode)
      .single();
    if (!referrer) return;

    let cash   = 0;
    let points = 0;

    switch (rewardType) {
      case "cash":    cash   = rewardValue;                              break;
      case "percent": cash   = Math.round(orderTotal * rewardValue / 100); break;
      case "points":  points = Math.round(rewardValue);                  break;
    }

    await supabase.from("user_profiles").update({
      reward_balance: (referrer.reward_balance ?? 0) + cash,
      reward_points:  (referrer.reward_points  ?? 0) + points,
    }).eq("id", referrer.id);

    await supabase.from("reward_transactions").insert({
      phone:       referrer.phone,
      type:        "referral_earn",
      amount:      cash,
      points,
      order_id:    orderId,
      description: `Referral reward for order #${orderId.slice(-6)} — ${
        rewardType === "cash"    ? `₹${cash}` :
        rewardType === "percent" ? `${rewardValue}% = ₹${cash}` :
        `${points} points`
      }`,
    });
  } catch (e) { console.warn("creditReferralReward error:", e); }
}

/**
 * Deduct reward balance after a customer redeems it at checkout.
 */
export async function deductRewardBalance(phone: string, amount: number): Promise<void> {
  if (!phone || !amount) return;
  try {
    const { data: profile } = await supabase
      .from("user_profiles").select("id, reward_balance").eq("phone", phone).single();
    if (!profile) return;
    const newBalance = Math.max(0, (profile.reward_balance ?? 0) - amount);
    await supabase.from("user_profiles").update({ reward_balance: newBalance }).eq("id", profile.id);
    await supabase.from("reward_transactions").insert({
      phone, type: "purchase_redeem", amount: -amount, points: 0,
      description: `Reward redeemed at checkout — ₹${amount}`,
    });
  } catch (e) { console.warn("deductRewardBalance error:", e); }
}

/** Fetch profile + transaction history + orders for a phone number */
export async function fetchProfileByPhone(phone: string) {
  try {
    const [{ data: profile }, { data: txns }, { data: orders }] = await Promise.all([
      supabase.from("user_profiles").select("*").eq("phone", phone).single(),
      supabase.from("reward_transactions").select("*").eq("phone", phone).order("created_at", { ascending: false }),
      supabase.from("orders").select("*").eq("customer_phone", phone).order("created_at", { ascending: false }),
    ]);
    return { profile, txns: txns ?? [], orders: orders ?? [] };
  } catch {
    return { profile: null, txns: [], orders: [] };
  }
}
