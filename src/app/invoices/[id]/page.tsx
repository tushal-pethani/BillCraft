"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"

export default function InvoiceDetailPage() {
  const router = useRouter()
  const search = useSearchParams()
  const params = useParams()  // <-- get id from the URL dynamically
  const id = params?.id

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invoice, setInvoice] = useState<any | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/invoices`)
        if (!res.ok) throw new Error("Failed to load invoice")
        const data = await res.json()
        const inv = (data.invoices || []).find((i: any) => i.id === id)
        if (!inv) throw new Error("Invoice not found")
        setInvoice(inv)
      } catch (e: any) {
        setError(e.message || "Error loading invoice")
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  function onPrint() {
    const iframe = iframeRef.current
    if (!iframe) return
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
  }

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