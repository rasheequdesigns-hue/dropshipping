# peadia.in — Multi-Vendor E-Commerce Platform

A full-featured, mobile-first e-commerce platform built with **Next.js 16**, **Tailwind CSS v4**, **Supabase**, and **Zustand**.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
The `.env.local` file is already pre-configured with the Supabase keys.

### 3. Set Up Database
Run the SQL migration in **Supabase Dashboard → SQL Editor**:
```
supabase/migrations/001_initial_schema.sql
```
This creates all tables, indexes, RLS policies, and seeds demo data.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## 📂 Project Structure

```
peadia/
├── src/
│   ├── app/
│   │   ├── page.tsx                  ← Home page (banners, categories, products)
│   │   ├── category/[slug]/          ← Category listing with filters
│   │   ├── product/[id]/             ← Product detail page
│   │   ├── cart/                     ← Cart with coupon & delivery fee
│   │   ├── checkout/                 ← Frictionless checkout (name + phone only)
│   │   ├── order/[id]/               ← Order confirmation + WhatsApp share
│   │   └── admin/
│   │       ├── page.tsx              ← Dashboard (stats, recent orders)
│   │       ├── orders/               ← Order management + status updates
│   │       ├── products/             ← Full CRUD product management
│   │       ├── categories/           ← Category manager
│   │       └── banners/              ← Banner carousel manager
│   ├── components/
│   │   ├── Header.tsx                ← Sticky header with live search
│   │   ├── MobileNav.tsx             ← Bottom navigation bar
│   │   ├── ProductCard.tsx           ← Reusable product card
│   │   ├── CartProvider.tsx          ← Global cart context
│   │   └── Toast.tsx                 ← Toast notification system
│   └── lib/
│       ├── supabase.ts               ← Supabase client + TypeScript types
│       ├── store.ts                  ← Zustand cart store (persisted)
│       └── demoData.ts               ← Fallback demo data (no DB needed)
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql    ← Full DB schema + seed data
└── .env.local                        ← Supabase credentials
```

---

## ✨ Key Features

### Customer Storefront
| Page | Features |
|------|----------|
| **Home** | Auto-rotating banner carousel, category grid, flash deals, featured products, trending section, trust badges, footer |
| **Category** | Filter chips, sort by price/discount, product grid, breadcrumb |
| **Product Detail** | Multi-image gallery, variant selectors (color/size), quantity picker, pincode checker, sticky mobile CTA bar |
| **Cart** | Real-time totals, coupon codes (PEADIA10, SAVE50, WELCOME), delivery fee calculator, savings summary |
| **Checkout** | **No login required** — Name + Phone + Address + Payment method. Orders saved to Supabase. |
| **Order Confirmation** | Order ID, estimated delivery, WhatsApp share button, timeline |

### Admin Dashboard (`/admin`)
| Page | Features |
|------|----------|
| **Dashboard** | Revenue, order count, delivery stats, quick links, recent orders table |
| **Orders** | Search + filter by status, inline status update dropdown, slide-out order detail drawer, print packing slip |
| **Products** | Full CRUD, active/inactive toggle, category assignment, image preview |
| **Categories** | Card-based CRUD with live image preview, auto-slug generation |
| **Banners** | Live carousel preview, sort order, active/hidden toggle, full CRUD |

### Core Architecture
- **Phone-number checkout** — No password or OTP. Phone acts as customer identifier in DB.
- **Demo mode** — All pages work offline with embedded demo data. Connect Supabase to go live.
- **Persistent cart** — Cart state survives page refreshes via `localStorage` (Zustand persist).
- **Toast notifications** — Instant feedback on cart additions, order placement.
- **Mobile-first** — Bottom nav, swipeable elements, sticky CTAs optimised for Indian mobile networks.

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary (Orange) | `#FF9F00` |
| Secondary (Blue) | `#2874F0` |
| Accent (CTA) | `#FB641B` |
| Success (Green) | `#26A541` |
| Background | `#F1F3F6` |

---

## 🗄️ Database Schema

```
categories    → id, name, slug, image_url
products      → id, title, description, mrp_price, sale_price, stock, category_id, images[], variants{}, is_featured, is_active
orders        → id, order_number, customer_name, customer_phone, shipping_address{}, total_amount, payment_method, status
order_items   → id, order_id, product_id, quantity, price, variant{}
banners       → id, title, image_url, link_url, sort_order, is_active
```

---

## 🔑 Coupon Codes (Demo)
| Code | Discount |
|------|----------|
| `PEADIA10` | 10% off |
| `SAVE50` | ₹50 flat off |
| `WELCOME` | 15% off |

---

## 📦 Tech Stack
- **Next.js 16** (App Router, Turbopack)
- **Tailwind CSS v4**
- **Supabase JS v2** (PostgreSQL + RLS)
- **Zustand v5** (persisted cart)
- **Lucide React** (icons)
- **TypeScript** (strict mode, zero errors)
