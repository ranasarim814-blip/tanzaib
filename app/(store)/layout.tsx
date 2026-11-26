import { Suspense } from "react";
import { AnnouncementBar } from "@/components/store/AnnouncementBar";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { CartDrawer } from "@/components/store/CartDrawer";
import { FlyToBag } from "@/components/store/FlyToBag";
import { WhatsAppFloat } from "@/components/store/WhatsAppFloat";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Cursor } from "@/components/motion/Cursor";
import { getRenderTime, getSettings } from "@/lib/data/catalog";
import { NowProvider } from "@/lib/now";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const [settings, renderTime] = await Promise.all([getSettings(), getRenderTime()]);
  return (
    <NowProvider iso={renderTime}>
      <a href="#main" className="sr-only z-[100] bg-ink px-4 py-3 text-ivory focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <AnnouncementBar />
      <Suspense fallback={<div className="h-16 bg-ivory lg:h-20" />}>
        <Header />
      </Suspense>
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <CartDrawer rules={{ delivery_charge: settings.delivery_charge, free_delivery_threshold: settings.free_delivery_threshold }} />
      <FlyToBag />
      <WhatsAppFloat />
      <Suspense fallback={null}>
        <SmoothScroll />
      </Suspense>
      <Cursor />
    </NowProvider>
  );
}
