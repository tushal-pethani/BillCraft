import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/templates - Get all templates for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        templates: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const res = NextResponse.json({ templates: user.templates })
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/templates - Create a new template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const formData = await request.formData()
    
    // Extract form data with proper typing
    const name = formData.get('name') as string
    const description = formData.get('description') as string | null
    const isTaxable = formData.get('isTaxable') as string
    const cgstRate = formData.get('cgstRate') as string
    const sgstRate = formData.get('sgstRate') as string
    const igstRate = formData.get('igstRate') as string
    const invoiceNumberStart = formData.get('invoiceNumberStart') as string
    const invoiceNumberPrefix = formData.get('invoiceNumberPrefix') as string
    const pdfTemplate = formData.get('pdfTemplate') as string
    const primaryColor = formData.get('primaryColor') as string
    const secondaryColor = formData.get('secondaryColor') as string
    const fontFamily = formData.get('fontFamily') as string

    // Handle file upload for company logo
    const companyLogoFile = formData.get('companyLogo') as File | null
    let companyLogoUrl = null
    
    if (companyLogoFile && companyLogoFile.size > 0) {
      // For now, we'll store the file name. In production, you'd upload to cloud storage
      companyLogoUrl = companyLogoFile.name
    }

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Template name is required" }, { status: 400 })
    }

    // Create the template
    const template = await prisma.invoiceTemplate.create({
      data: {
        name,
        description: description || null,
        companyLogo: companyLogoUrl,
        isTaxable: isTaxable === 'true',
        cgstRate: isTaxable === 'true' ? parseFloat(cgstRate) || 0 : null,
        sgstRate: isTaxable === 'true' ? parseFloat(sgstRate) || 0 : null,
        igstRate: isTaxable === 'true' ? parseFloat(igstRate) || 0 : null,
        invoiceNumberStart: parseInt(invoiceNumberStart) || 1,
        invoiceNumberPrefix: invoiceNumberPrefix || "INV",
        pdfTemplate: pdfTemplate || "classic",
        primaryColor: primaryColor || "#667eea",
        secondaryColor: secondaryColor || "#f7fafc",
        fontFamily: fontFamily || "Inter",
        userId: user.id,
        isDefault: false, // First template will be set as default
        isActive: true
      }
    })

    // If this is the first template, set it as default
    const templateCount = await prisma.invoiceTemplate.count({
      where: { userId: user.id }
    })

    if (templateCount === 1) {
      await prisma.invoiceTemplate.update({
        where: { id: template.id },
        data: { isDefault: true }
      })
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error("Error creating template:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/templates - Update a template
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 })
    }

    // Verify the template belongs to the user
    const existingTemplate = await prisma.invoiceTemplate.findFirst({
      where: { id, userId: user.id }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    const template = await prisma.invoiceTemplate.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error("Error updating template:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/templates - Delete a template
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 })
    }

    // Verify the template belongs to the user
    const existingTemplate = await prisma.invoiceTemplate.findFirst({
      where: { id, userId: user.id }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Don't allow deleting the default template if it's the only one
    if (existingTemplate.isDefault) {
      const templateCount = await prisma.invoiceTemplate.count({
        where: { userId: user.id }
      })
      
      if (templateCount === 1) {
        return NextResponse.json({ error: "Cannot delete the only template" }, { status: 400 })
      }
    }

    await prisma.invoiceTemplate.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting template:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
