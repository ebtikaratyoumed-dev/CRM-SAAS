import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register a modern font if possible, or use standard
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Bold.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottom: 2,
    borderBottomColor: '#1e293b',
    paddingBottom: 10,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#020617',
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#020617',
    textAlign: 'right',
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  companyInfo: {
    width: '45%',
  },
  clientInfo: {
    width: '45%',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    textTransform: 'uppercase',
    color: '#64748b',
  },
  table: {
    width: 'auto',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    color: '#ffffff',
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    padding: 8,
  },
  dt: { width: '50%' },
  qty: { width: '15%', textAlign: 'center' },
  up: { width: '15%', textAlign: 'right' },
  val: { width: '20%', textAlign: 'right' },
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  totalsTable: {
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 4,
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#1e293b',
    color: '#ffffff',
    marginTop: 10,
    borderRadius: 4,
    fontWeight: 'bold',
    fontSize: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTop: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    color: '#94a3b8',
    fontSize: 8,
  },
  notes: {
    marginTop: 30,
    padding: 10,
    backgroundColor: '#fffdf2',
    borderLeftWidth: 3,
    borderLeftColor: '#eab308',
  }
});

interface InvoicePDFProps {
  data: {
    invoice_number: string;
    issue_date: string;
    due_date: string;
    client_name: string;
    client_address: string;
    line_items: any[];
    subtotal: number;
    tax_amount: number;
    total: number;
    notes?: string;
  };
}

export function InvoicePDF({ data }: InvoicePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>COREX</Text>
            <Text>Gérez vos chantiers, simplement.</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>FACTURE</Text>
            <Text style={{ textAlign: 'right', marginTop: 5 }}>N° {data.invoice_number}</Text>
          </View>
        </View>

        {/* Info Rows */}
        <View style={styles.infoSection}>
          <View style={styles.companyInfo}>
            <Text style={styles.sectionTitle}>De</Text>
            <Text style={{ fontWeight: 'bold' }}>Corex Construction Tunisie</Text>
            <Text>Boulevard de l'Environnement</Text>
            <Text>La Marsa, Tunis 2046</Text>
            <Text>RNE: 1234567/A</Text>
          </View>
          <View style={styles.clientInfo}>
            <Text style={styles.sectionTitle}>À</Text>
            <Text style={{ fontWeight: 'bold' }}>{data.client_name}</Text>
            <Text>{data.client_address}</Text>
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text><Text style={{ color: '#64748b' }}>Date d'émission: </Text>{data.issue_date}</Text>
          <Text><Text style={{ color: '#64748b' }}>Date d'échéance: </Text>{data.due_date}</Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.dt}>Description</Text>
            <Text style={styles.qty}>Qté</Text>
            <Text style={styles.up}>P.U (TND)</Text>
            <Text style={styles.val}>Total (TND)</Text>
          </View>
          {data.line_items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.dt}>{item.description}</Text>
              <Text style={styles.qty}>{item.quantity}</Text>
              <Text style={styles.up}>{Number(item.unit_price).toFixed(3)}</Text>
              <Text style={styles.val}>{(item.quantity * item.unit_price).toFixed(3)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsTable}>
            <View style={styles.totalRow}>
              <Text>Sous-total</Text>
              <Text>{data.subtotal.toFixed(3)} TND</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>TVA (19%)</Text>
              <Text>{data.tax_amount.toFixed(3)} TND</Text>
            </View>
            <View style={styles.grandTotal}>
              <Text>TOTAL COMPLET</Text>
              <Text>{data.total.toFixed(3)} TND</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.notes}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Notes:</Text>
            <Text>{data.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Merci pour votre confiance. Facture générée par Corex CRM - Plateforme de gestion de chantiers.
        </Text>
      </Page>
    </Document>
  );
}
