"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"

export default function InvoiceDetailPage() {
  const router = useRouter()
  const search = useSearchParams()
  const params = useParams()   // <-- dynamically get the [id]
  const id = params?.id

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  interface Invoice {
    id: string
    [key: string]: string | number | boolean // Adjust fields as per your invoice structure
  }

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/invoices`)
        if (!res.ok) throw new Error("Failed to load invoice")
        const data = await res.json()
        const invoice = (data.invoices || []).find((i: Invoice) => i.id === id)
        if (!invoice) throw new Error("Invoice not found")
        setInvoice(invoice)
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message)
        } else {
          setError("Error loading invoice")
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [id])
  
  const onPrint = () => {
    const iframe = iframeRef.current
    if (!iframe) return
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
  }

  if (!id) return <div>Invoice ID not found</div>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Invoice</h1>
        <div className="space-x-2">
          <button onClick={() => router.push(`/invoices/${id}?edit=1`)} className="px-3 py-2 border rounded">Edit</button>
          <a href={`/api/invoices/pdf?id=${id}`} target="_blank" rel="noreferrer" className="px-3 py-2 border rounded">Open PDF</a>
          <button onClick={onPrint} className="px-3 py-2 bg-blue-600 text-white rounded">Print</button>
          <button onClick={() => router.push('/invoices')} className="px-3 py-2 border rounded">Close</button>
        </div>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="bg-white border rounded overflow-hidden" style={{height: "80vh"}}>
          <iframe ref={iframeRef} title="Invoice PDF" src={`/api/invoices/pdf?id=${id}`} className="w-full h-full" />
        </div>
      )}
    </div>
  )
}