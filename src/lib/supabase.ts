import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  || "https://placeholder.supabase.co";
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
export const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  title: string;
  description: string;
  brand_name?: string;
  sku?: string;
  mrp_price: number;
  sale_price: number;
  stock: number;
  category_id: string;
  images: string[];
  variants: Array<{ size?:string; color?:string; price?:number; mrp?:number; stock?:number; image_url?:string }>;
  is_featured: boolean;
  is_active: boolean;
  estimated_delivery_days?: number;
  delivery_charge?: number;
  is_returnable?: boolean;
  accepted_payments?: string[];
  referral_reward_type?: string;
  referral_reward_value?: number;
  reward_expiry_days?: number;
  source_link?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  created_at?: string;
}

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export type OrderStatus = "Pending"|"Processing"|"Shipped"|"Out for Delivery"|"Delivered"|"Cancelled";
export type PaymentMethod = "COD"|"UPI"|"ONLINE";

export interface Order {
  id: string;
  order_number: number | string;
  customer_name: string;
  customer_phone: string;
  shipping_address: { street?:string; address?:string; city:string; state:string; pincode:string };
  total_amount: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_title: string;
  quantity: number;
  price: number;
  selected_variant?: { size?:string; color?:string };
  product?: Product;
}

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: { size?:string; color?:string };
}

export interface ContactMessage {
  id: string;
  customer_name: string;
  customer_phone: string;
  email?: string;
  subject?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

/** Profile created when customer first orders or clicks a referral link */
export interface UserProfile {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  referral_code: string;
  referred_by: string | null;
  reward_balance: number;
  reward_points: number;
  created_at: string;
}

export interface StoreSettings {
  id: number;
  store_name: string;
  contact_phone: string;
  contact_email: string;
  address: string;
  whatsapp_number: string;
  announcement_text: string;
  free_delivery_min_amount: number;
  promo_code: string;
  promo_discount_percent: number;
  is_announcement_active: boolean;
  // Auth
  admin_password_hash: string;
  // Branding
  logo_url: string;
  logo_name: string;
  // Payment
  upi_id: string;
  upi_name: string;
  qr_code_url: string;
  bank_name: string;
  bank_account_number: string;
  bank_ifsc: string;
  bank_holder_name: string;
  payment_note: string;
  // Social media
  instagram_url: string;
  facebook_url: string;
  twitter_url: string;
  youtube_url: string;
  tiktok_url: string;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  id: 1,
  store_name: "peadia.in",
  contact_phone: "+91 9526569313",
  contact_email: "rasheequ.designs@gmail.com",
  address: "Malappuram, Kerala, India",
  whatsapp_number: "919526569313",
  announcement_text: "Special Offer: Get Free Delivery on all orders above ₹499 · Use code PEADIA10 for 10% off",
  free_delivery_min_amount: 499,
  promo_code: "PEADIA10",
  promo_discount_percent: 10,
  is_announcement_active: true,
  admin_password_hash: "peadia2024",
  logo_url: "",
  logo_name: "",
  upi_id: "rasheequ@upi",
  upi_name: "peadia.in",
  qr_code_url: "",
  bank_name: "",
  bank_account_number: "",
  bank_ifsc: "",
  bank_holder_name: "",
  payment_note: "Please include your Order ID in the payment note.",
  instagram_url: "",
  facebook_url: "",
  twitter_url: "",
  youtube_url: "",
  tiktok_url: "",
};
