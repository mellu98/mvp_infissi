import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentCompanyId } from '@/lib/auth';
import { getCompanySettings } from '@/server/services/settings.service';
import { SettingsForm } from '@/components/settings/settings-form';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const companyId = await getCurrentCompanyId();
  const settings = await getCompanySettings(companyId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Impostazioni azienda</h1>
        <p className="text-sm text-muted-foreground">
          Queste informazioni compaiono in preventivi, contratti e documenti generati.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dati Link Infissi</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm initial={settings} />
        </CardContent>
      </Card>
    </div>
  );
}
