/**
 * demoData.ts — EMPTY fallbacks
 * All data is loaded from Supabase.
 * These empty arrays prevent runtime errors when the DB is unreachable.
 */
import { Product, Category, Banner, Order } from "./supabase";

export const demoProducts:   Product[]  = [];
export const demoCategories: Category[] = [];
export const demoBanners:    Banner[]   = [];
export const demoOrders:     Order[]    = [];
