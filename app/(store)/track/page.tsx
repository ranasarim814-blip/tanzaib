import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/store/PageHeader";
import { TrackForm } from "@/components/store/order/TrackForm";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Check the status of your Tanzaib order with your order number and phone.",
  alternates: { canonical: "/track" },
};

export default function TrackPage() {
  return (
    <>
      <PageHeader eyebrow="Order status" title="Track your order" urdu="آرڈر کی صورتحال" body="Enter the order number from your confirmation and the phone number you ordered with." />
      <div className="container-luxe pb-28">
        <Suspense fallback={<div className="mx-auto h-24 max-w-2xl skeleton" />}>
          <TrackForm />
        </Suspense>
      </div>
    </>
  );
}
