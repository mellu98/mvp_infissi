export type QuoteStatusValue =
  | 'DRAFT'
  | 'CALCULATED'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED';

export const QUOTE_STATUSES: QuoteStatusValue[] = [
  'DRAFT',
  'CALCULATED',
  'SENT',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED',
];

export const QUOTE_STATUS_LABELS: Record<QuoteStatusValue, string> = {
  DRAFT: 'Bozza',
  CALCULATED: 'Calcolato',
  SENT: 'Inviato',
  ACCEPTED: 'Accettato',
  REJECTED: 'Rifiutato',
  EXPIRED: 'Scaduto',
};

export function quoteStatusLabel(status: string): string {
  return QUOTE_STATUS_LABELS[status as QuoteStatusValue] ?? status;
}

export function quoteStatusVariant(
  status: string
): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' {
  switch (status) {
    case 'DRAFT':
      return 'secondary';
    case 'CALCULATED':
      return 'info';
    case 'SENT':
      return 'warning';
    case 'ACCEPTED':
      return 'success';
    case 'REJECTED':
    case 'EXPIRED':
      return 'destructive';
    default:
      return 'default';
  }
}
