"use client";

import { useReducedMotionSafe } from "@/lib/hooks";
import { motion } from "motion/react";
import { useEffect } from "react";
import { trackPurchase } from "@/lib/analytics";
import { t } from "@/lib/i18n";

/** A gift box whose lid lifts, and a "Shukriya" card rises out of it. */
export function GiftBox({ name, orderNumber }: { name: string; orderNumber: string }) {
  const reduce = useReducedMotionSafe();
  const ease = [0.22, 1, 0.36, 1] as const;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("tanzaib-last-order");
      if (!raw) return;
      const o = JSON.parse(raw) as { number: string; total: number; items: { id: string; name: string; price: number; quantity: number }[] };
      if (o.number === orderNumber) {
        trackPurchase(o.number, o.total, o.items);
        sessionStorage.removeItem("tanzaib-last-order");
      }
    } catch {}
  }, [orderNumber]);

  return (
    <div className="relative mx-auto h-[300px] w-[280px]" aria-hidden>
      {/* card */}
      <motion.div
        className="absolute left-1/2 z-10 w-[200px] -translate-x-1/2 border border-brass/60 bg-ivory px-5 py-6 text-center shadow-[0_20px_40px_-20px_rgba(28,26,23,0.5)]"
        initial={reduce ? { bottom: 150, opacity: 1 } : { bottom: 40, opacity: 0 }}
        animate={{ bottom: 150, opacity: 1 }}
        transition={{ delay: reduce ? 0 : 1.15, duration: 1.3, ease }}
      >
        <p className="urdu text-3xl leading-[2.4] text-brass-deep">{t.success.urdu}</p>
        <p className="eyebrow mt-3 text-[0.6rem] text-taupe">{t.success.eyebrow}, {name.split(" ")[0]}</p>
      </motion.div>
      {/* box body */}
      <div className="absolute bottom-0 left-1/2 z-20 h-[130px] w-[220px] -translate-x-1/2" style={{ background: "linear-gradient(180deg,#2a2622,#1c1a17)" }}>
        <div className="absolute inset-y-0 left-1/2 w-6 -translate-x-1/2" style={{ background: "linear-gradient(90deg,#84652f,#d9c4a0,#84652f)" }} />
        <p className="absolute inset-x-0 bottom-4 text-center font-serif text-xs tracking-[0.5em] text-brass-soft">TANZAIB</p>
      </div>
      {/* lid */}
      <motion.div
        className="absolute bottom-[122px] left-1/2 z-30 h-[34px] w-[236px] -translate-x-1/2 origin-left"
        style={{ background: "linear-gradient(180deg,#3a342e,#24201c)" }}
        initial={{ rotate: 0, y: 0, x: "-50%" }}
        animate={reduce ? { rotate: -12, y: -60, x: "-60%", opacity: 0.0 } : { rotate: [0, -6, -14], y: [0, -40, -70], x: ["-50%", "-52%", "-64%"], opacity: [1, 1, 0] }}
        transition={{ duration: reduce ? 0 : 1.4, delay: reduce ? 0 : 0.4, ease, times: [0, 0.4, 1] }}
      >
        <div className="absolute inset-y-0 left-1/2 w-6 -translate-x-1/2" style={{ background: "linear-gradient(90deg,#84652f,#d9c4a0,#84652f)" }} />
        <svg viewBox="0 0 80 30" className="absolute -top-6 left-1/2 w-20 -translate-x-1/2" fill="none" stroke="#B08D57" strokeWidth="2">
          <path d="M40 28 C25 5 8 10 16 20 C22 27 34 26 40 28 C46 26 58 27 64 20 C72 10 55 5 40 28 Z" fill="#B08D57" fillOpacity="0.85" />
        </svg>
      </motion.div>
    </div>
  );
}
