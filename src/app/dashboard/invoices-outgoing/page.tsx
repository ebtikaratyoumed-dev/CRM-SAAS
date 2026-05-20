import { redirect } from 'next/navigation'

// The outgoing invoices are shown in the unified invoices page under the "Factures Clients" tab
export default function InvoicesOutgoingPage() {
  redirect('/dashboard/invoices')
}
