'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Download, CheckCircle, Send, Clock, Trash2, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { updateOutgoingInvoiceStatus, deleteOutgoingInvoice } from '@/app/dashboard/invoices-outgoing/actions'
import { toast } from 'sonner'
import { useDashboardCache } from '@/context/dashboard-cache'

interface Props {
  invoice: {
    id: string
    invoice_number: string
    status: string
  }
}

export function OutgoingInvoiceActions({ invoice }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { refreshData } = useDashboardCache()

  const handleStatus = (status: string) => {
    startTransition(async () => {
      try {
        await updateOutgoingInvoiceStatus(invoice.id, status)
        toast.success(`Statut mis à jour : ${status}`)
        await refreshData()
        router.refresh()
      } catch {
        toast.error('Impossible de mettre à jour le statut')
      }
    })
  }

  const handleDelete = () => {
    if (!confirm(`Supprimer la facture ${invoice.invoice_number} ? Cette action est irréversible.`)) return
    startTransition(async () => {
      try {
        await deleteOutgoingInvoice(invoice.id)
        toast.success('Facture supprimée')
        await refreshData()
        router.refresh()
      } catch {
        toast.error('Impossible de supprimer la facture')
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
        disabled={isPending}
        aria-label="Actions"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MoreVertical className="h-4 w-4" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52 bg-slate-950 border-slate-800 text-slate-200">

        {/* Invoice identifier — must be inside a Group */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-slate-500 text-xs uppercase tracking-widest font-bold">
            {invoice.invoice_number}
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-slate-800" />

        {/* Download */}
        <DropdownMenuItem className="p-0 focus:bg-transparent">
          <a
            href={`/api/invoice-pdf/${invoice.id}`}
            download
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Download className="h-4 w-4 text-blue-400" />
            Télécharger PDF
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-slate-800" />

        {/* Status group — label + items must all be inside Group */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-slate-600 text-[10px] uppercase tracking-widest">
            Changer le statut
          </DropdownMenuLabel>

          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer text-slate-300 hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white disabled:opacity-40"
            onClick={() => handleStatus('Envoyée')}
            disabled={invoice.status === 'Envoyée' || isPending}
          >
            <Send className="h-4 w-4 text-blue-400" />
            Marquer Envoyée
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer text-slate-300 hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white disabled:opacity-40"
            onClick={() => handleStatus('Payée')}
            disabled={invoice.status === 'Payée' || isPending}
          >
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            Marquer Payée
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer text-slate-300 hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white disabled:opacity-40"
            onClick={() => handleStatus('Brouillon')}
            disabled={invoice.status === 'Brouillon' || isPending}
          >
            <Clock className="h-4 w-4 text-slate-400" />
            Remettre en Brouillon
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-slate-800" />

        {/* Delete */}
        <DropdownMenuItem
          className="flex items-center gap-2 cursor-pointer text-red-400 hover:bg-red-400/10 hover:text-red-300 focus:bg-red-400/10 focus:text-red-300"
          onClick={handleDelete}
          disabled={isPending}
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
  )
}
