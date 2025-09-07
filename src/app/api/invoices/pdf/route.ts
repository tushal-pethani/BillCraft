import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/invoices/pdf?id=...
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return new NextResponse("User not found", { status: 404 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return new NextResponse("id is required", { status: 400 })

    const inv = await prisma.invoice.findFirst({ where: { id, userId: user.id }, select: { pdfData: true, invoiceNo: true } })
    if (!inv || !inv.pdfData) return new NextResponse("PDF not found", { status: 404 })

    return new NextResponse(inv.pdfData as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=invoice-${inv.invoiceNo}.pdf`,
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    })
  } catch (err) {
    console.error("Error fetching invoice PDF", err)
    return new NextResponse("Internal server error", { status: 500 })
  }
}


