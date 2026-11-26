import { PageTitle } from "@/components/admin/AdminShell";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireAdmin } from "@/lib/admin/auth";
import { getSettingsUncached } from "@/lib/data/settings";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await getSettingsUncached();
  return (
    <>
      <PageTitle title="Settings" description="Store-wide settings. Changes go live immediately." />
      <SettingsForm settings={settings} />
    </>
  );
}
