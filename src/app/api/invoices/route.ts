import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import fs from "fs/promises"
import path from "path"
import puppeteer from "puppeteer"

async function renderTemplateToHtml(templateKey: string, data: any): Promise<string> {
  const templateFile = path.join(process.cwd(), "public", "templates", `${templateKey}.html`)
  const html = await fs.readFile(templateFile, "utf8")
  // Very basic token replacement; in production use a proper templating engine
  let rendered = html
  // Render itemsRows if provided as array
  if (Array.isArray(data.itemsRows)) {
    const rows = data.itemsRows.map((row: any) => `
                <tr>
                    <td>${String(row.description)}</td>
                    <td>${Number(row.quantity)}</td>
                    <td>₹${Number(row.rate).toFixed(2)}</td>
                    <td>₹${Number(row.amount).toFixed(2)}</td>
                </tr>`).join("\n")
    rendered = rendered.replace(/{{\s*itemsRows\s*}}/g, rows)
  }
  // Minimal template uses a different row structure
  if (Array.isArray(data.itemsRows)) {
    const rowsMinimal = data.itemsRows.map((row: any) => `
            <div class="item-row">
                <div class="item-description">${String(row.description)}</div>
                <div class="item-quantity">${Number(row.quantity)}</div>
                <div class="item-rate">₹${Number(row.rate).toFixed(2)}</div>
                <div class="item-amount">₹${Number(row.amount).toFixed(2)}</div>
            </div>`).join("\n")
    rendered = rendered.replace(/{{\s*itemsRowsMinimal\s*}}/g, rowsMinimal)
  }
  const flatEntries: [string, any][] = Object.entries(data)
  for (const [key, value] of flatEntries) {
    if (key === 'itemsRows') continue
    const token = new RegExp(`{{\\s*${key}\\s*}}`, "g")
    rendered = rendered.replace(token, String(value ?? ""))
  }
  return rendered
}

async function generatePdfFromHtml(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: "new",
  } as any)
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })
    const pdf = await page.pdf({ format: "A4", printBackground: true })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}

// GET /api/invoices - list invoices for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const invoices = await prisma.invoice.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      include: {
        client: true,
        template: true,
        items: true,
      },
    })

    const res = NextResponse.json({ invoices })
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    console.error("Error listing invoices", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/invoices - create invoice and store PDF
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const body = await request.json()
    const {
      date,
      clientId,
      items,
      note,
      templateId,
      useManualGst,
      manualCgst,
      manualSgst,
      manualIgst,
    } = body

    if (!clientId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "clientId and at least one item are required" }, { status: 400 })
    }

    // Determine running invoice number (global per user)
    const last = await prisma.invoice.findFirst({
      where: { userId: user.id },
      orderBy: { invoiceNo: "desc" },
      select: { invoiceNo: true },
    })
    const nextInvoiceNo = (last?.invoiceNo ?? 0) + 1

    // Compute amounts
    const subtotal: number = items.reduce((sum: number, it: any) => sum + Number(it.quantity) * Number(it.rate), 0)

    // Get template GST defaults if manual is off
    let cgst = 0, sgst = 0, igst = 0
    let templateKey = "classic"
    if (templateId) {
      const tpl = await prisma.invoiceTemplate.findUnique({ where: { id: templateId } })
      if (tpl) {
        templateKey = tpl.pdfTemplate || "classic"
        if (!useManualGst && tpl.isTaxable) {
          cgst = Number(tpl.cgstRate || 0)
          sgst = Number(tpl.sgstRate || 0)
          igst = Number(tpl.igstRate || 0)
        }
      }
    }
    if (useManualGst) {
      cgst = Number(manualCgst || 0)
      sgst = Number(manualSgst || 0)
      igst = Number(manualIgst || 0)
    }

    const taxAmount = subtotal * (cgst + sgst + igst) / 100
    const totalAmount = subtotal + taxAmount

    // Create DB rows first (without pdfData)
    const created = await prisma.invoice.create({
      data: {
        invoiceNo: nextInvoiceNo,
        date: date ? new Date(date) : new Date(),
        amount: subtotal,
        taxAmount,
        totalAmount,
        note: note || null,
        useManualGst: Boolean(useManualGst),
        manualCgst: useManualGst ? cgst : null,
        manualSgst: useManualGst ? sgst : null,
        manualIgst: useManualGst ? igst : null,
        userId: user.id,
        clientId,
        templateId: templateId || null,
        items: {
          create: items.map((it: any, index: number) => ({
            description: String(it.name || it.description || "Item " + (index + 1)),
            quantity: Number(it.quantity),
            price: Number(it.rate),
            gstRate: Number(cgst + sgst + igst),
            amount: Number(it.quantity) * Number(it.rate),
          })),
        },
      },
      include: { client: true, items: true },
    })

    // Prepare HTML data
    const htmlData = {
      invoiceNo: `${created.invoiceNo}`,
      date: created.date.toISOString().slice(0, 10),
      clientName: created.client.name,
      clientAddress: created.client.address || "",
      companyName: "BillCraft",
      companyAddress: "",
      companyCityState: "",
      companyPhone: "",
      companyEmail: "",
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: totalAmount.toFixed(2),
      note: created.note || "",
      itemsRows: created.items.map((it) => ({ description: it.description, quantity: it.quantity, rate: it.price, amount: it.amount }))
    }
    const html = await renderTemplateToHtml(templateKey, htmlData)
    const pdfBuffer = await generatePdfFromHtml(html)

    const updated = await prisma.invoice.update({
      where: { id: created.id },
      data: { pdfData: pdfBuffer },
    })

    return NextResponse.json({ invoice: { ...created, pdfStored: Boolean(updated) } }, { status: 201 })
  } catch (err) {
    console.error("Error creating invoice", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/invoices?id=...
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    // Verify ownership
    const inv = await prisma.invoice.findFirst({ where: { id, userId: user.id } })
    if (!inv) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })

    await prisma.invoice.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error deleting invoice", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/invoices - mark as paid or regenerate pdf
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const body = await request.json()
    const { id, action } = body
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const invoice = await prisma.invoice.findFirst({ where: { id, userId: user.id }, include: { client: true, items: true, template: true } })
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })

    if (action === "markPaid") {
      const updated = await prisma.invoice.update({ where: { id }, data: { status: "PAID", paidAt: new Date() } })
      return NextResponse.json({ invoice: updated })
    }

    if (action === "regeneratePdf") {
      let templateKey = invoice.template?.pdfTemplate || "classic"
      const htmlData = {
        invoiceNo: `${invoice.invoiceNo}`,
        date: invoice.date.toISOString().slice(0, 10),
        clientName: invoice.client.name,
        clientAddress: invoice.client.address || "",
        subtotal: invoice.amount.toFixed(2),
        taxAmount: invoice.taxAmount.toFixed(2),
        total: invoice.totalAmount.toFixed(2),
        note: invoice.note || "",
        itemsRows: invoice.items.map((it) => ({ description: it.description, quantity: it.quantity, rate: it.price, amount: it.amount }))
      }
      const html = await renderTemplateToHtml(templateKey, htmlData)
      const pdfBuffer = await generatePdfFromHtml(html)
      await prisma.invoice.update({ where: { id }, data: { pdfData: pdfBuffer } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (err) {
    console.error("Error updating invoice", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


