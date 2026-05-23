import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    paddingTop: 48,
    paddingBottom: 60,
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
    marginBottom: 32,
  },
  brandBlock: { flexDirection: 'column' },
  brandName: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: '#0ea5e9', letterSpacing: 2 },
  brandSub: { fontSize: 8, color: '#94a3b8', letterSpacing: 3, marginTop: 2 },

  docBlock: { alignItems: 'flex-end' },
  docTitle: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  docSub: { fontSize: 10, color: '#0ea5e9', marginTop: 4, fontFamily: 'Helvetica-Bold' },
  docMeta: { fontSize: 9, color: '#64748b', marginTop: 2 },

  // ── Divider ─────────────────────────────────────────────
  accentDivider: { height: 2, backgroundColor: '#0ea5e9', width: 60, marginBottom: 24 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginBottom: 20 },

  // ── Info row ─────────────────────────────────────────────
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  infoBlock: { flexDirection: 'column', width: '45%' },
  infoLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#94a3b8',
    letterSpacing: 2,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  infoValue: { fontSize: 11, color: '#1e293b', fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  infoMuted: { fontSize: 9, color: '#64748b' },

  // ── Status badge ─────────────────────────────────────────
  statusBadgeRow: { flexDirection: 'row', marginBottom: 20 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#0ea5e9',
  },
  statusBadgeArchived: { backgroundColor: '#64748b' },
  statusBadgeValidated: { backgroundColor: '#10b981' },
  statusBadgeDraft: { backgroundColor: '#f59e0b' },
  statusText: { fontSize: 8, color: '#ffffff', fontFamily: 'Helvetica-Bold', letterSpacing: 1 },

  // ── Summary box ──────────────────────────────────────────
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 4,
    marginBottom: 24,
  },
  summaryItem: { flexDirection: 'column', alignItems: 'center' },
  summaryLabel: { fontSize: 7, color: '#94a3b8', fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
  summaryValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginTop: 3 },

  // ── Table ────────────────────────────────────────────────
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
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

  // Columns
  colMaterial: { flex: 2 },
  colCategory: { flex: 1 },
  colUnit: { width: 50, textAlign: 'center' },
  colQty: { width: 55, textAlign: 'right' },
  colPrice: { width: 75, textAlign: 'right' },
  colTotal: { width: 80, textAlign: 'right' },

  thText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#94a3b8', letterSpacing: 1 },
  tdText: { fontSize: 9, color: '#334155' },
  tdBold: { fontSize: 9, color: '#0f172a', fontFamily: 'Helvetica-Bold' },
  tdAccent: { fontSize: 9, color: '#0ea5e9', fontFamily: 'Helvetica-Bold' },

  // ── Grand Total ───────────────────────────────────────────
  totalBox: {
    marginTop: 16,
    marginLeft: 'auto',
    width: 250,
  },
  totalFinalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 4,
    marginTop: 8,
  },
  totalFinalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  totalFinalValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#0ea5e9' },

  // ── Notes ─────────────────────────────────────────────────
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

  // ── Footer ────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  footerText: { fontSize: 8, color: '#cbd5e1' },
})

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', minimumFractionDigits: 2 }).format(n)

const fmtDate = (d: string) =>
  d
    ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—'

interface EstimationPDFProps {
  sheet: {
    id: string;
    title: string;
    status: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    project?: { name: string };
    estimation_items: Array<{
      id: string;
      material_name: string;
      category?: string;
      unit: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
  };
}

export function EstimationPDF({ sheet }: EstimationPDFProps) {
  const items = sheet.estimation_items ?? []
  const grandTotal = items.reduce((sum, i) => sum + (i.total_price ?? 0), 0)
  const itemCount = items.length

  const statusStyle =
    sheet.status === 'Validé'
      ? styles.statusBadgeValidated
      : sheet.status === 'Archivé'
      ? styles.statusBadgeArchived
      : styles.statusBadgeDraft

  return (
    <Document title={`Estimation — ${sheet.title}`} author="COREX Construction CRM">
      <Page size="A4" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.brandName}>COREX</Text>
            <Text style={styles.brandSub}>CONSTRUCTION CRM</Text>
          </View>
          <View style={styles.docBlock}>
            <Text style={styles.docTitle}>ESTIMATION</Text>
            <Text style={styles.docSub}>{sheet.title}</Text>
            <Text style={styles.docMeta}>Créée le {fmtDate(sheet.created_at)}</Text>
            <Text style={styles.docMeta}>Mise à jour le {fmtDate(sheet.updated_at)}</Text>
          </View>
        </View>

        <View style={styles.accentDivider} />

        {/* ── Project & Status ── */}
        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Projet</Text>
            <Text style={styles.infoValue}>{sheet.project?.name ?? '—'}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Statut</Text>
            <View style={styles.statusBadgeRow}>
              <View style={[styles.statusBadge, statusStyle]}>
                <Text style={styles.statusText}>{sheet.status?.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Summary ── */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>NB LIGNES</Text>
            <Text style={styles.summaryValue}>{itemCount}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>TOTAL ESTIMÉ</Text>
            <Text style={[styles.summaryValue, { color: '#0ea5e9' }]}>{fmt(grandTotal)}</Text>
          </View>
        </View>

        {/* ── Table header ── */}
        <View style={styles.tableHeader}>
          <Text style={[styles.thText, styles.colMaterial]}>MATÉRIAU</Text>
          <Text style={[styles.thText, styles.colCategory]}>CATÉGORIE</Text>
          <Text style={[styles.thText, styles.colUnit]}>UNITÉ</Text>
          <Text style={[styles.thText, styles.colQty]}>QTÉ</Text>
          <Text style={[styles.thText, styles.colPrice]}>PRIX UNIT.</Text>
          <Text style={[styles.thText, styles.colTotal]}>TOTAL</Text>
        </View>

        {/* ── Rows ── */}
        {items.map((item, i) => (
          <View key={item.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tdBold, styles.colMaterial]}>{item.material_name}</Text>
            <Text style={[styles.tdText, styles.colCategory]}>{item.category ?? '—'}</Text>
            <Text style={[styles.tdText, styles.colUnit]}>{item.unit}</Text>
            <Text style={[styles.tdText, styles.colQty]}>
              {Number(item.quantity).toLocaleString('fr-TN')}
            </Text>
            <Text style={[styles.tdText, styles.colPrice]}>{fmt(item.unit_price)}</Text>
            <Text style={[styles.tdAccent, styles.colTotal]}>{fmt(item.total_price ?? 0)}</Text>
          </View>
        ))}

        {/* ── Grand total ── */}
        <View style={styles.totalBox}>
          <View style={styles.totalFinalBox}>
            <Text style={styles.totalFinalLabel}>TOTAL GÉNÉRAL</Text>
            <Text style={styles.totalFinalValue}>{fmt(grandTotal)}</Text>
          </View>
        </View>

        {/* ── Notes ── */}
        {sheet.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>OBSERVATIONS</Text>
            <Text style={styles.notesText}>{sheet.notes}</Text>
          </View>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            COREX Construction — {sheet.title} — {sheet.project?.name}
          </Text>
          <Text style={styles.footerText}>
            Document généré le {new Date().toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
