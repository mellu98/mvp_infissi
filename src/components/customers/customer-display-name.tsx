import type { Customer } from '@prisma/client';

export function customerDisplayName(c: Pick<Customer, 'type' | 'firstName' | 'lastName' | 'companyName'>): string {
  if (c.type === 'BUSINESS') return c.companyName?.trim() || 'Azienda senza nome';
  const parts = [c.firstName, c.lastName].filter(Boolean).join(' ').trim();
  return parts || 'Cliente senza nome';
}

export function leadStatusLabel(status: string): string {
  switch (status) {
    case 'NEW':
      return 'Nuovo';
    case 'CONTACTED':
      return 'Contattato';
    case 'SURVEY':
      return 'Sopralluogo';
    case 'QUOTE_SENT':
      return 'Preventivo inviato';
    case 'ACCEPTED':
      return 'Accettato';
    case 'LOST':
      return 'Perso';
    default:
      return status;
  }
}

export function leadStatusVariant(status: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' {
  switch (status) {
    case 'NEW':
      return 'info';
    case 'CONTACTED':
      return 'secondary';
    case 'SURVEY':
      return 'warning';
    case 'QUOTE_SENT':
      return 'warning';
    case 'ACCEPTED':
      return 'success';
    case 'LOST':
      return 'destructive';
    default:
      return 'default';
  }
}
