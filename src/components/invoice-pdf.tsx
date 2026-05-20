import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a2e',
  },

  // ── Header ──────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 36,
  },
  brandBlock: { flexDirection: 'column' },
  brandName: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: '#0ea5e9', letterSpacing: 2 },
  brandSub: { fontSize: 8, color: '#94a3b8', letterSpacing: 3, marginTop: 2 },

  invoiceBlock: { alignItems: 'flex-end' },
  invoiceTitle: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  invoiceNumber: { fontSize: 11, color: '#0ea5e9', marginTop: 4, fontFamily: 'Helvetica-Bold' },
  invoiceMeta: { fontSize: 9, color: '#64748b', marginTop: 2 },

  // ── Divider ─────────────────────────────────────────────
  divider: { height: 1, backgroundColor: '#e2e8f0', marginBottom: 24 },
  accentDivider: { height: 2, backgroundColor: '#0ea5e9', width: 60, marginBottom: 24 },

  // ── Two-column info section ──────────────────────────────
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  infoBlock: { flexDirection: 'column', width: '45%' },
  infoLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#94a3b8', letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' },
  infoValue: { fontSize: 10, color: '#1e293b', fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  infoMuted: { fontSize: 9, color: '#64748b' },

  // ── Line items table ─────────────────────────────────────
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 0,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  colDesc: { flex: 1 },
  colQty: { width: 50, textAlign: 'center' },
  colPrice: { width: 80, textAlign: 'right' },
  colTotal: { width: 80, textAlign: 'right' },
  thText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#94a3b8', letterSpacing: 1 },
  tdText: { fontSize: 9, color: '#334155' },
  tdTextBold: { fontSize: 9, color: '#0f172a', fontFamily: 'Helvetica-Bold' },

  // ── Totals ───────────────────────────────────────────────
  totalsBox: {
    marginTop: 16,
    marginLeft: 'auto',
    width: 240,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { fontSize: 9, color: '#64748b' },
  totalValue: { fontSize: 9, color: '#334155', fontFamily: 'Helvetica-Bold' },
  totalFinalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 4,
    marginTop: 6,
  },
  totalFinalLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  totalFinalValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#0ea5e9' },

  // ── Notes & Status ───────────────────────────────────────
  notesBox: {
    marginTop: 28,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#0ea5e9',
  },
  notesLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#94a3b8', letterSpacing: 2, marginBottom: 4 },
  notesText: { fontSize: 9, color: '#64748b', lineHeight: 1.5 },

  // ── Footer ───────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: { fontSize: 8, color: '#cbd5e1' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#0ea5e9',
    borderRadius: 20,
  },
  statusText: { fontSize: 8, color: '#ffffff', fontFamily: 'Helvetica-Bold' },
})

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(n)

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'

export function InvoicePDF({ invoice }: { invoice: any }) {
  const lineItems: any[] = invoice.line_items || []

  return (
    <Document
      title={`Facture ${invoice.invoice_number}`}
      author="COREX Construction CRM"
    >
      <Page size="A4" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.brandName}>{invoice.company_name?.toUpperCase() || 'COREX'}</Text>
            <Text style={styles.brandSub}>Construction CRM</Text>
          </View>
          <View style={styles.invoiceBlock}>
            <Text style={styles.invoiceTitle}>FACTURE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
            <Text style={styles.invoiceMeta}>Émise le {fmtDate(invoice.created_at)}</Text>
            {invoice.due_date && (
              <Text style={styles.invoiceMeta}>Échéance : {fmtDate(invoice.due_date)}</Text>
            )}
          </View>
        </View>

        <View style={styles.accentDivider} />

        {/* ── Parties ── */}
        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Émetteur</Text>
            <Text style={styles.infoValue}>{invoice.company_name || 'COREX Construction'}</Text>
            <Text style={styles.infoMuted}>{invoice.company_email || 'construction@corex.tn'}</Text>
            {invoice.company_tax_number && (
              <Text style={[styles.infoMuted, { marginTop: 2 }]}>
                Matricule Fiscale: {invoice.company_tax_number}
              </Text>
            )}
            <Text style={[styles.infoMuted, { marginTop: 2 }]}>
              {invoice.company_address || 'Boulevard de l\'Environnement\nLa Marsa, Tunis 2046'}
            </Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Facturer à</Text>
            <Text style={styles.infoValue}>{invoice.client_name}</Text>
            {invoice.client_email && <Text style={styles.infoMuted}>{invoice.client_email}</Text>}
            {invoice.client_address && <Text style={styles.infoMuted}>{invoice.client_address}</Text>}
          </View>
        </View>

        {invoice.project?.name && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.infoLabel}>Projet</Text>
            <Text style={styles.infoValue}>{invoice.project.name}</Text>
          </View>
        )}

        {/* ── Line items table ── */}
        <View style={styles.tableHeader}>
          <Text style={[styles.thText, styles.colDesc]}>DESCRIPTION</Text>
          <Text style={[styles.thText, styles.colQty]}>QTÉ</Text>
          <Text style={[styles.thText, styles.colPrice]}>PRIX UNIT.</Text>
          <Text style={[styles.thText, styles.colTotal]}>TOTAL HT</Text>
        </View>

        {lineItems.map((item: any, i: number) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tdText, styles.colDesc]}>{item.description || '—'}</Text>
            <Text style={[styles.tdText, styles.colQty]}>{item.quantity}</Text>
            <Text style={[styles.tdText, styles.colPrice]}>{fmt(item.unit_price)}</Text>
            <Text style={[styles.tdTextBold, styles.colTotal]}>
              {fmt(item.quantity * item.unit_price)}
            </Text>
          </View>
        ))}

        {/* ── Totals ── */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total HT</Text>
            <Text style={styles.totalValue}>{fmt(invoice.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA ({invoice.tax_percentage}%)</Text>
            <Text style={styles.totalValue}>{fmt(invoice.tax_amount)}</Text>
          </View>
          <View style={styles.totalFinalBox}>
            <Text style={styles.totalFinalLabel}>TOTAL TTC</Text>
            <Text style={styles.totalFinalValue}>{fmt(invoice.total)}</Text>
          </View>
        </View>

        {/* ── Notes ── */}
        {invoice.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>NOTES & CONDITIONS</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{invoice.company_name || 'COREX Construction'} — {invoice.invoice_number}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{invoice.status?.toUpperCase() || 'BROUILLON'}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
