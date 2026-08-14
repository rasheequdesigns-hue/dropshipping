import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { CartProvider } from "@/components/CartProvider";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Footer } from "@/components/Footer";
import { PromoPopup } from "@/components/PromoPopup";
import { PageLoader } from "@/components/PageLoader";

export const metadata: Metadata = {
  metadataBase: new URL("https://peadia.in"),
  title: "peadia.in — Shop Online | Electronics, Fashion & More",
  description: "India's fastest growing e-commerce platform. Free delivery on orders above ₹499, easy returns, and Cash on Delivery available.",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    type: "website",
    siteName: "peadia.in",
    url: "https://peadia.in",
    title: "peadia.in — Shop Online | Electronics, Fashion & More",
    description: "India's fastest growing e-commerce platform. Free delivery, easy returns, COD available.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "peadia.in — Shop Online" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@peadia_in",
    title: "peadia.in — Shop Online | Electronics, Fashion & More",
    description: "India's fastest growing e-commerce platform. Free delivery, easy returns, COD available.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0D1117",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <PageLoader />
        <ThemeProvider>
          <ToastProvider>
            <CartProvider>
              <Header />
              <main>{children}</main>
              <Footer />
              <MobileNav />
              <PromoPopup />
            </CartProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
