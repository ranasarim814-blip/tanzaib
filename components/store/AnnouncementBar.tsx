import { getSettings } from "@/lib/data/catalog";

export async function AnnouncementBar() {
  const s = await getSettings();
  if (!s.announcement) return null;
  return (
    <div className="bg-ink text-ivory">
      <p className="container-luxe py-2.5 text-center text-[0.65rem] tracking-[0.2em] uppercase text-brass-soft">
        {s.announcement}
      </p>
    </div>
  );
}
