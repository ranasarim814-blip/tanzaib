"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveSettings } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import type { StoreSettings } from "@/lib/types";

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const field = (name: keyof StoreSettings, label: string, hint?: string, type = "text") => (
    <div className="space-y-1.5">
      <Label htmlFor={`st-${name}`}>{label}</Label>
      <Input id={`st-${name}`} name={name} type={type} defaultValue={String(settings[name] ?? "")} aria-invalid={Boolean(errors[name])} />
      {hint && !errors[name] && <p className="text-xs text-muted-foreground">{hint}</p>}
      <FieldError>{errors[name]}</FieldError>
    </div>
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        setErrors({});
        start(async () => {
          const r = await saveSettings(data);
          if (r.ok) toast.success("Settings saved — the store updates right away");
          else {
            toast.error(r.error);
            setErrors(r.fieldErrors ?? {});
          }
        });
      }}
      className="space-y-6"
    >
      <Card>
        <CardHeader><CardTitle>Delivery</CardTitle></CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          {field("delivery_charge", "Delivery charge (Rs.)", "Flat charge per order", "number")}
          {field("free_delivery_threshold", "Free delivery from (Rs.)", "Orders of this amount or more ship free. 0 = always free.", "number")}
          {field("ready_to_wear_days", "Ready-to-wear delivery time", "e.g. 5–7 working days")}
          {field("made_to_order_weeks", "Made-to-order delivery time", "e.g. 2–4 weeks")}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Contact & social</CardTitle></CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          {field("whatsapp_number", "WhatsApp number", "International format, e.g. +923001234567")}
          {field("instagram", "Instagram URL")}
          {field("facebook", "Facebook URL")}
          {field("tiktok", "TikTok URL")}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Homepage</CardTitle></CardHeader>
        <CardContent className="grid gap-5">
          {field("announcement", "Announcement bar", "Leave empty to hide the bar")}
          <div className="grid gap-5 md:grid-cols-2">
            {field("hero_eyebrow", "Wardrobe hero — small label")}
            {field("hero_title", "Wardrobe hero — title")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-hero_subtitle">Wardrobe hero — subtitle</Label>
            <Textarea id="st-hero_subtitle" name="hero_subtitle" rows={2} defaultValue={settings.hero_subtitle} />
            <FieldError>{errors.hero_subtitle}</FieldError>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save settings"}</Button>
      </div>
    </form>
  );
}
