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
} from './format';

interface Props {
  quote: PdfQuote;
  settings: PdfCompanySettings;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#111827',
    lineHeight: 1.35,
  },
  header: {
    borderBottom: '1 solid #111827',
    paddingBottom: 12,
    marginBottom: 18,
  },
  brand: { fontSize: 18, fontWeight: 700 },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 12 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginBottom: 5 },
  box: { border: '1 solid #d1d5db', padding: 10, borderRadius: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottom: '1 solid #e5e7eb',
    paddingVertical: 4,
  },
  muted: { color: '#6b7280' },
  signatureRow: {
    flexDirection: 'row',
    gap: 40,
    marginTop: 34,
  },
  signature: {
    flex: 1,
    borderTop: '1 solid #111827',
    paddingTop: 6,
    textAlign: 'center',
  },
});

export function ContractPdf({ quote, settings }: Props) {
  return (
    <PdfDocument
      title={`Contratto ${quote.quoteNumber}`}
      author={settings.legalName}
      subject={`Contratto per preventivo ${quote.quoteNumber}`}
      language="it-IT"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>LINK INFISSI</Text>
          <Text>
            {settings.legalName} — P.IVA {settings.vatNumber} — {settings.email}
          </Text>
        </View>

        <Text style={styles.title}>Contratto di fornitura e posa</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Parti</Text>
          <Text>
            Fornitore: {settings.legalName}, con sede in {settings.address}, {settings.postalCode}{' '}
            {settings.city} ({settings.province}), P.IVA {settings.vatNumber}.
          </Text>
          <Text>
            Cliente: {customerDisplayName(quote.customer)}
            {customerAddress(quote.customer) ? `, ${customerAddress(quote.customer)}` : ''}.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Oggetto</Text>
          <Text>
            Il presente contratto recepisce il preventivo {quote.quoteNumber} del{' '}
            {formatDate(quote.createdAt)} e riguarda la fornitura/posa dei prodotti indicati
            nel riepilogo seguente.
          </Text>
        </View>

        <View style={[styles.section, styles.box]}>
          <Text style={styles.sectionTitle}>3. Riepilogo economico</Text>
          {quote.items.map((item, index) => (
            <View key={`${item.description}-${index}`} style={styles.row}>
              <Text>
                {item.description} × {item.quantity}
              </Text>
              <Text>{formatCurrency(item.total)}</Text>
            </View>
          ))}
          <View style={styles.row}>
            <Text>Subtotale</Text>
            <Text>{formatCurrency(quote.subtotal)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Sconti</Text>
            <Text>{formatCurrency(quote.discountTotal)}</Text>
          </View>
          <View style={styles.row}>
            <Text>IVA</Text>
            <Text>{formatCurrency(quote.vatTotal)}</Text>
          </View>
          <View style={[styles.row, { borderBottom: 0, fontWeight: 700 }]}>
            <Text>Totale contratto</Text>
            <Text>{formatCurrency(quote.grandTotal)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Condizioni operative</Text>
          <Text>
            Misure, colori e varianti devono essere confermati prima dell&apos;ordine definitivo.
            Eventuali opere murarie, smaltimenti speciali o extra non espressamente indicati sono
            esclusi salvo diverso accordo scritto.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Condizioni contrattuali</Text>
          <Text style={styles.muted}>
            {settings.contractTerms ||
              'Acconto, saldo e tempi di consegna saranno confermati in fase di accettazione. Il cliente approva il preventivo allegato e autorizza l’avvio dell’ordine.'}
          </Text>
        </View>

        <View style={styles.signatureRow}>
          <Text style={styles.signature}>Firma cliente</Text>
          <Text style={styles.signature}>LINK INFISSI</Text>
        </View>
      </Page>
    </PdfDocument>
  );
}
