import { SettingsForm } from "@/components/admin/SettingsForm";
import { getSettings } from "@/lib/data/repository";

export const metadata = { title: "Definições" };

export default async function DefinicoesPage() {
  const settings = await getSettings();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-navy">Definições</h1>
        <p className="mt-1 text-sm text-text-muted">Parâmetros do sistema de reservas.</p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
