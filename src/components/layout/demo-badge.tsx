import { Badge } from '@/components/ui/badge';

/**
 * Persistent reminder that the seed prices are demo-only.
 * Toggled by the env flag NEXT_PUBLIC_SHOW_DEMO_BADGE (default: true).
 */
export function DemoBadge() {
  const enabled = (process.env.NEXT_PUBLIC_SHOW_DEMO_BADGE ?? 'true') !== 'false';
  if (!enabled) return null;
  return (
    <Badge variant="warning" className="uppercase tracking-wide">
      Dati demo — prezzi non reali
    </Badge>
  );
}
