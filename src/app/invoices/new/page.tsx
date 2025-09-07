"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

type Client = { id: string; name: string; gstNumber?: string | null }
type Template = { id: string; name: string; pdfTemplate: string; isTaxable: boolean; cgstRate?: number | null; sgstRate?: number | null; igstRate?: number | null }

type ItemRow = { name: string; quantity: number; rate: number }

export default function NewInvoicePage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0,10))
  const [clientId, setClientId] = useState<string>("")
  const [templateId, setTemplateId] = useState<string>("")
  const [note, setNote] = useState<string>("")
  const [items, setItems] = useState<ItemRow[]>([{ name: "", quantity: 1, rate: 0 }])
  const [useManualGst, setUseManualGst] = useState<boolean>(false)
  const [manualCgst, setManualCgst] = useState<number>(0)
  const [manualSgst, setManualSgst] = useState<number>(0)
  const [manualIgst, setManualIgst] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const [clientsRes, templatesRes] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/templates"),
      ])
      if (clientsRes.ok) {
        const data = await clientsRes.json()
        setClients(data.clients || [])
      }
      if (templatesRes.ok) {
        const data = await templatesRes.json()
        setTemplates(data.templates || [])
      }
    })()
  }, [])

  const subtotal = useMemo(() => items.reduce((s, it) => s + Number(it.quantity || 0) * Number(it.rate || 0), 0), [items])
  const gstRates = useMemo(() => {
    if (useManualGst) return { cgst: manualCgst, sgst: manualSgst, igst: manualIgst }
    const tpl = templates.find(t => t.id === templateId)
    if (tpl && tpl.isTaxable) return { cgst: tpl.cgstRate || 0, sgst: tpl.sgstRate || 0, igst: tpl.igstRate || 0 }
    return { cgst: 0, sgst: 0, igst: 0 }
  }, [useManualGst, manualCgst, manualSgst, manualIgst, templates, templateId])
  const taxAmount = useMemo(() => subtotal * (Number(gstRates.cgst)+Number(gstRates.sgst)+Number(gstRates.igst))/100, [subtotal, gstRates])
  const totalAmount = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount])

  function updateItem(idx: number, patch: Partial<ItemRow>) {
    setItems(prev => prev.map((row, i) => i === idx ? { ...row, ...patch } : row))
  }
  function addItem() {
    setItems(prev => [...prev, { name: "", quantity: 1, rate: 0 }])
  }
  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  async function submitForm() {
    if (!clientId || items.length === 0) {
      setError("Please select a client and add at least one item")
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          clientId,
          items: items.map(it => ({ name: it.name, quantity: Number(it.quantity), rate: Number(it.rate) })),
          note,
          templateId: templateId || null,
          useManualGst,
          manualCgst,
          manualSgst,
          manualIgst,
        })
      })
      if (!res.ok) throw new Error("Failed to create invoice")
      const data = await res.json()
      router.push(`/invoices/${data.invoice.id}`)
    } catch (e: any) {
      setError(e.message || "Error creating invoice")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create New Invoice</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}

      <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bill Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full px-3 py-2 border rounded">
              <option value="">Select client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.gstNumber ? `(${c.gstNumber})` : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="w-full px-3 py-2 border rounded">
              <option value="">Default (classic)</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Items</label>
            <button onClick={addItem} className="text-sm text-blue-600">+ Add item</button>
          </div>
          <div className="space-y-2">
            {items.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <input value={row.name} onChange={(e) => updateItem(idx, { name: e.target.value })} placeholder="Item name" className="col-span-6 px-3 py-2 border rounded" />
                <input type="number" value={row.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} placeholder="Qty" className="col-span-2 px-3 py-2 border rounded" />
                <input type="number" value={row.rate} onChange={(e) => updateItem(idx, { rate: Number(e.target.value) })} placeholder="Rate" className="col-span-2 px-3 py-2 border rounded" />
                <div className="col-span-1 text-sm">₹{(Number(row.quantity)*Number(row.rate)).toFixed(2)}</div>
                <button onClick={() => removeItem(idx)} className="col-span-1 text-red-600 text-sm">Remove</button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 border rounded" rows={3} placeholder="Optional notes" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={useManualGst} onChange={(e) => setUseManualGst(e.target.checked)} />
              Enter GST manually
            </label>
            {useManualGst && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                <input type="number" value={manualCgst} onChange={(e) => setManualCgst(Number(e.target.value))} placeholder="CGST %" className="px-3 py-2 border rounded" />
                <input type="number" value={manualSgst} onChange={(e) => setManualSgst(Number(e.target.value))} placeholder="SGST %" className="px-3 py-2 border rounded" />
                <input type="number" value={manualIgst} onChange={(e) => setManualIgst(Number(e.target.value))} placeholder="IGST %" className="px-3 py-2 border rounded" />
              </div>
            )}
          </div>
          <div className="bg-gray-50 p-3 rounded border">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span>GST ({(Number(gstRates.cgst)+Number(gstRates.sgst)+Number(gstRates.igst)).toFixed(2)}%)</span><span>₹{taxAmount.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold"><span>Grand Total</span><span>₹{totalAmount.toFixed(2)}</span></div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={() => router.push("/invoices")} className="px-4 py-2 border rounded">Cancel</button>
          <button disabled={submitting} onClick={submitForm} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60">{submitting ? "Creating..." : "Create Invoice"}</button>
        </div>
      </div>
    </div>
  )
}