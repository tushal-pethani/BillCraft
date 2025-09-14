"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import DarkModeToggle from "@/app/components/DarkModeToggle"
import { useEffect, useState } from "react"
import useSWR from 'swr'
import NewInvoiceForm from "@/app/components/NewInvoiceForm"

export default function InvoicesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [filterText, setFilterText] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [clients, setClients] = useState<any[]>([])
  const [clientFilter, setClientFilter] = useState<string>("All")
  const [showNewInvoice, setShowNewInvoice] = useState(false)
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null)

  if (!session) {
    router.push("/") // redirect to signup/login if not logged in
    return null
  }

  const { data: invoicesData, isLoading: invoicesLoading, error: invoicesError } = useSWR('/api/invoices')
  const { data: clientsData, isLoading: clientsLoading } = useSWR('/api/clients')

  useEffect(() => {
    if (invoicesData) setInvoices(invoicesData.invoices || [])
    if (clientsData) setClients(clientsData.clients || [])
    setLoading(invoicesLoading || clientsLoading)
    setError(invoicesError ? (invoicesError as any).message : null)
  }, [invoicesData, clientsData, invoicesLoading, clientsLoading, invoicesError])

  const filtered = invoices.filter((inv) => {
    const text = filterText.toLowerCase()
    const matchesText = !text ||
      `${inv.invoiceNo}`.includes(text) ||
      inv.client?.name?.toLowerCase()?.includes(text) ||
      inv.client?.gstNumber?.toLowerCase()?.includes(text)
    const matchesClient = clientFilter === "All" || inv.clientId === clientFilter
    
    // Status filtering logic
    let matchesStatus = true
    if (statusFilter !== "All") {
      const invoiceStatus = inv.status || "UNPAID"
      
      if (statusFilter === "Paid") {
        matchesStatus = invoiceStatus === "PAID"
      } else if (statusFilter === "Unpaid") {
        matchesStatus = invoiceStatus === "UNPAID"
      }
    }
    
    const result = matchesText && matchesClient && matchesStatus
    
    // Debug logging
    if (statusFilter !== "All") {
      console.log(`Invoice ${inv.invoiceNo}: status=${inv.status}, matchesStatus=${matchesStatus}, result=${result}`)
    }
    
    return result
  })

  async function handleDelete(id: string) {
    const ok = confirm("Delete this invoice?")
    if (!ok) return
    const res = await fetch(`/api/invoices?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      setInvoices((prev) => prev.filter((i) => i.id !== id))
    } else {
      alert("Failed to delete")
    }
  }

  return (
    <div className="space-y-6">
        {/* Top actions */}
        <div className="flex justify-end">
          <button onClick={() => setShowNewInvoice(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Create New Invoice
          </button>
        </div>

        {/* Filter and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <input 
                type="text" 
                placeholder="Search invoices..." 
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none px-4 py-2 pr-12 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="relative">
              <select value={clientFilter} onChange={(e)=>setClientFilter(e.target.value)} className="appearance-none px-4 py-2 pr-12 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="All">All Clients</option>
                {clients.map((c:any)=> (
                  <option key={c.id} value={c.id}>{c.name}{c.gstNumber ? ` (${c.gstNumber})` : ''}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">All Invoices</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Print</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading && (
                  <tr>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300" colSpan={7}>Loading...</td>
                  </tr>
                )}
                {error && !loading && (
                  <tr>
                    <td className="px-6 py-4 text-red-600" colSpan={7}>{error}</td>
                  </tr>
                )}
                {!loading && !error && filtered.length === 0 && (
                  <tr>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300" colSpan={7}>No invoices found</td>
                  </tr>
                )}
                {!loading && !error && filtered.map((inv: any) => (
                  <tr key={inv.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">#{inv.invoiceNo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">{inv.client?.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{inv.client?.gstNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{new Date(inv.date).toISOString().slice(0,10)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <a href={`/api/invoices/pdf?id=${inv.id}`} target="_blank" className="text-blue-600 hover:text-blue-900">Print</a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">₹{Number(inv.totalAmount).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${inv.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {inv.status || 'UNPAID'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={() => setPreviewInvoiceId(inv.id)} className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                      <button onClick={() => router.push(`/invoices/${inv.id}?edit=1`)} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mr-3">Edit</button>
                      {inv.status !== 'PAID' && (
                        <button onClick={async () => {
                          const res = await fetch('/api/invoices', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: inv.id, action: 'markPaid' }) })
                          if (res.ok) {
                            setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'PAID' } : i))
                          }
                        }} className="text-green-600 hover:text-green-900 mr-3">Mark Paid</button>
                      )}
                      <button onClick={() => handleDelete(inv.id)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Invoice Modal */}
        {showNewInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">New Invoice</h3>
                <button onClick={() => setShowNewInvoice(false)} className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Close</button>
              </div>
              <NewInvoiceForm onCreated={(id)=>{ setShowNewInvoice(false); setPreviewInvoiceId(id); }} onCancel={()=> setShowNewInvoice(false)} />
            </div>
          </div>
        )}

        {/* PDF Preview Modal */}
        {previewInvoiceId && (
          <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Invoice Preview</h3>
              <div className="space-x-2">
                <a href={`/api/invoices/pdf?id=${previewInvoiceId}`} target="_blank" className="px-3 py-2 border rounded text-gray-700 dark:text-gray-300">Open PDF</a>
                <button onClick={() => window.print()} className="px-3 py-2 bg-blue-600 text-white rounded">Print</button>
                <button onClick={() => setPreviewInvoiceId(null)} className="px-3 py-2 border rounded text-gray-700 dark:text-gray-300">Close</button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe title="Invoice PDF" src={`/api/invoices/pdf?id=${previewInvoiceId}`} className="w-full h-full border-0" />
            </div>
          </div>
        )}
    </div>
  )
}