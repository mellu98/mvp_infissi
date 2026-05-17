import type { PdfCustomer } from './types';

export function formatCurrency(value: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value?: Date | string | null): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function customerDisplayName(customer: PdfCustomer): string {
  if (customer.type === 'BUSINESS') {
    return customer.companyName?.trim() || 'Azienda senza nome';
  }

  return [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim() || 'Cliente senza nome';
}

export function customerAddress(customer: PdfCustomer): string {
  return [
    customer.address,
    [customer.postalCode, customer.city, customer.province ? `(${customer.province})` : null]
      .filter(Boolean)
      .join(' '),
  ]
    .filter(Boolean)
    .join(' — ');
}
