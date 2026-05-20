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
    borderBottomColor: '#10b981', // Emerald for supplier invoices
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
  vendorInfo: {
    width: '45%',
    backgroundColor: '#f0fdf4', // Emerald-50 background
    padding: 10,
    borderRadius: 4,
  },
  companyInfo: {
    width: '45%',
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
    backgroundColor: '#064e3b', // Deep emerald
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
    backgroundColor: '#064e3b',
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
    backgroundColor: '#f8fafc',
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  }
});

interface IncomingInvoicePDFProps {
  data: {
    invoice_number: string;
    invoice_date: string;
    vendor_name: string;
    line_items: any[];
    tax: number;
    total_amount: number;
    notes?: string;
    company_name?: string;
    company_address?: string;
    vendor_tax_number?: string;
  };
}

export function IncomingInvoicePDF({ data }: IncomingInvoicePDFProps) {
  const subtotal = data.line_items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>{data.company_name?.split(' ')[0] || 'COREX'}</Text>
            <Text>{data.company_name || 'Corex Construction Tunisie'}</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>FACTURE FOURNISSEUR</Text>
            <Text style={{ textAlign: 'right', marginTop: 5 }}>N° {data.invoice_number}</Text>
          </View>
        </View>

        {/* Info Rows */}
        <View style={styles.infoSection}>
          <View style={styles.vendorInfo}>
            <Text style={styles.sectionTitle}>De (Fournisseur)</Text>
            <Text style={{ fontWeight: 'bold' }}>{data.vendor_name}</Text>
            {data.vendor_tax_number && (
              <Text style={{ marginTop: 4, color: '#475569', fontSize: 9 }}>
                M.F: {data.vendor_tax_number}
              </Text>
            )}
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.sectionTitle}>À</Text>
            <Text style={{ fontWeight: 'bold' }}>{data.company_name || 'Corex Construction Tunisie'}</Text>
            {data.company_address ? (
              <Text style={{ marginTop: 2 }}>{data.company_address}</Text>
            ) : (
              <>
                <Text>Boulevard de l'Environnement</Text>
                <Text>La Marsa, Tunis 2046</Text>
              </>
            )}
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text><Text style={{ color: '#64748b' }}>Date de réception: </Text>{data.invoice_date}</Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.dt}>Description</Text>
            <Text style={styles.qty}>Qté</Text>
            <Text style={styles.up}>P.U (TND)</Text>
            <Text style={styles.val}>Total (TND)</Text>
          </View>
          {data.line_items?.map((item, i) => (
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
              <Text>{subtotal.toFixed(3)} TND</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>TVA</Text>
              <Text>{Number(data.tax).toFixed(3)} TND</Text>
            </View>
            <View style={styles.grandTotal}>
              <Text>TOTAL TTC</Text>
              <Text>{Number(data.total_amount).toFixed(3)} TND</Text>
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
          Document de gestion interne {data.company_name || 'Corex'} CRM - Plateforme de gestion de chantiers.
        </Text>
      </Page>
    </Document>
  );
}
