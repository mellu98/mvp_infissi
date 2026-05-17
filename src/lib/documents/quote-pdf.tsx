import {
  Document as PdfDocument,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import type { PdfCompanySettings, PdfQuote } from './types';
import {
  customerAddress,
  customerDisplayName,
  formatCurrency,
  formatDate,
  formatNumber,
} from './format';

interface Props {
  quote: PdfQuote;
  settings: PdfCompanySettings;
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottom: '1 solid #d1d5db',
    paddingBottom: 14,
    marginBottom: 18,
  },
  brand: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  muted: { color: '#6b7280' },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 8 },
  section: { marginBottom: 16 },
  twoColumns: { flexDirection: 'row', gap: 16 },
  box: {
    flex: 1,
    border: '1 solid #e5e7eb',
    borderRadius: 4,
    padding: 10,
  },
  boxTitle: { fontSize: 10, fontWeight: 700, marginBottom: 6, color: '#374151' },
  table: { border: '1 solid #d1d5db' },
  row: { flexDirection: 'row', borderBottom: '1 solid #e5e7eb' },
  headerRow: { backgroundColor: '#f3f4f6', fontWeight: 700 },
  cell: { padding: 6, borderRight: '1 solid #e5e7eb' },
  desc: { width: '36%' },
  measures: { width: '16%' },
  qty: { width: '8%', textAlign: 'right' },
  money: { width: '13.333%', textAlign: 'right' },
  noRightBorder: { borderRight: 0 },
  explanation: { marginTop: 3, color: '#6b7280', fontSize: 7 },
  totals: { marginLeft: 'auto', width: 220, border: '1 solid #d1d5db' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 6,
    borderBottom: '1 solid #e5e7eb',
  },
  grandTotal: { fontSize: 12, fontWeight: 700, backgroundColor: '#f9fafb' },
  terms: {
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
    marginTop: 18,
    color: '#4b5563',
    lineHeight: 1.35,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 36,
    marginTop: 28,
  },
  signature: {
    flex: 1,
    borderTop: '1 solid #111827',
    paddingTop: 5,
    textAlign: 'center',
  },
});

export function QuotePdf({ quote, settings }: Props) {
  return (
    <PdfDocument
      title={`Preventivo ${quote.quoteNumber}`}
      author={settings.legalName}
      subject={`Preventivo per ${customerDisplayName(quote.customer)}`}
      language="it-IT"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>LINK INFISSI</Text>
            <Text>{settings.legalName}</Text>
            <Text style={styles.muted}>
              {settings.address}, {settings.postalCode} {settings.city} ({settings.province})
            </Text>
            <Text style={styles.muted}>
              P.IVA {settings.vatNumber} · CF {settings.taxCode}
            </Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text>{settings.email}</Text>
            <Text>{settings.phone}</Text>
            {settings.website ? <Text>{settings.website}</Text> : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Preventivo {quote.quoteNumber}</Text>
          <Text style={styles.muted}>
            Data: {formatDate(quote.createdAt)} · Validità: {formatDate(quote.validUntil)}
          </Text>
        </View>

        <View style={[styles.section, styles.twoColumns]}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Cliente</Text>
            <Text>{customerDisplayName(quote.customer)}</Text>
            <Text style={styles.muted}>{customerAddress(quote.customer)}</Text>
            {quote.customer.email ? <Text>{quote.customer.email}</Text> : null}
            {quote.customer.phone ? <Text>{quote.customer.phone}</Text> : null}
            {quote.customer.vatNumber ? <Text>P.IVA {quote.customer.vatNumber}</Text> : null}
            {quote.customer.taxCode ? <Text>CF {quote.customer.taxCode}</Text> : null}
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Riepilogo</Text>
            <Text>Righe: {quote.items.length}</Text>
            <Text>IVA: {formatNumber(quote.vatRate, 0)}%</Text>
            <Text>Sconto globale: {formatNumber(quote.globalDiscountPercentage, 2)}%</Text>
            <Text>Stato: {quote.status}</Text>
          </View>
        </View>

        <View style={[styles.section, styles.table]}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cell, styles.desc]}>Descrizione</Text>
            <Text style={[styles.cell, styles.measures]}>Misure</Text>
            <Text style={[styles.cell, styles.qty]}>Q.tà</Text>
            <Text style={[styles.cell, styles.money]}>Unitario</Text>
            <Text style={[styles.cell, styles.money]}>Optional</Text>
            <Text style={[styles.cell, styles.money, styles.noRightBorder]}>Totale</Text>
          </View>
          {quote.items.map((item, index) => (
            <View key={`${item.description}-${index}`} style={styles.row} wrap={false}>
              <View style={[styles.cell, styles.desc]}>
                <Text>{item.description}</Text>
                {item.calculationExplanation ? (
                  <Text style={styles.explanation}>{item.calculationExplanation}</Text>
                ) : null}
              </View>
              <Text style={[styles.cell, styles.measures]}>{formatMeasures(item)}</Text>
              <Text style={[styles.cell, styles.qty]}>{formatNumber(item.quantity, 2)}</Text>
              <Text style={[styles.cell, styles.money]}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={[styles.cell, styles.money]}>{formatCurrency(item.optionsTotal)}</Text>
              <Text style={[styles.cell, styles.money, styles.noRightBorder]}>
                {formatCurrency(item.total)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotale</Text>
            <Text>{formatCurrency(quote.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Sconti</Text>
            <Text>{formatCurrency(quote.discountTotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>IVA</Text>
            <Text>{formatCurrency(quote.vatTotal)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text>Totale</Text>
            <Text>{formatCurrency(quote.grandTotal)}</Text>
          </View>
        </View>

        {quote.notes ? (
          <View style={styles.terms}>
            <Text style={styles.boxTitle}>Note</Text>
            <Text>{quote.notes}</Text>
          </View>
        ) : null}

        <View style={styles.terms}>
          <Text style={styles.boxTitle}>Condizioni</Text>
          <Text>
            {settings.quoteTerms ||
              'Validità offerta come indicata. Misure e disponibilità materiali da confermare in fase esecutiva.'}
          </Text>
        </View>

        <View style={styles.signatureRow}>
          <Text style={styles.signature}>Firma cliente per accettazione</Text>
          <Text style={styles.signature}>LINK INFISSI</Text>
        </View>
      </Page>
    </PdfDocument>
  );
}

function formatMeasures(item: PdfQuote['items'][number]): string {
  const parts: string[] = [];
  if (item.widthCm && item.heightCm) {
    parts.push(`${formatNumber(item.widthCm, 0)}×${formatNumber(item.heightCm, 0)} cm`);
  }
  if (item.lengthCm) parts.push(`${formatNumber(item.lengthCm, 0)} cm`);
  if (item.areaMq) parts.push(`${formatNumber(item.areaMq, 2)} mq`);
  return parts.join(' · ') || '—';
}
