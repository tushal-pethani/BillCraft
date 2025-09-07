import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/clients - Get all clients for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        business: {
          include: {
            clients: {
              include: {
                invoices: true
              }
            }
          }
        }
      }
    })

    if (!user || !user.business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    const res = NextResponse.json({ clients: user.business.clients })
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { business: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.business) {
      return NextResponse.json({ 
        error: "Please set up your business information first before adding clients" 
      }, { status: 400 })
    }

    const body = await request.json()
    const { gstNumber } = body

    if (!gstNumber) {
      return NextResponse.json({ error: "GST number is required" }, { status: 400 })
    }

    // Check if client already exists
    const existingClient = await prisma.client.findFirst({
      where: { 
        gstNumber: gstNumber,
        businessId: user.business.id
      }
    })

    if (existingClient) {
      return NextResponse.json({ error: "Client with this GST number already exists" }, { status: 400 })
    }

    // Validate GST number with external API
    const gstSecret = process.env.GST_SECRET
    if (!gstSecret) {
      return NextResponse.json({ error: "GST validation service not configured" }, { status: 500 })
    }

    console.log(`Validating GST number: ${gstNumber}`)
    console.log(`API URL: http://sheet.gstincheck.co.in/check/${gstSecret}/${gstNumber}`)

    let gstData
    try {
      // Make GET request to GST validation API
      const gstResponse = await fetch(`http://sheet.gstincheck.co.in/check/${gstSecret}/${gstNumber}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      })
      
      console.log(`GST API Response Status: ${gstResponse.status}`)
      
      if (!gstResponse.ok) {
        const errorText = await gstResponse.text()
        console.log(`GST API Error Response: ${errorText}`)
        return NextResponse.json({ 
          error: `Failed to validate GST number. Status: ${gstResponse.status}` 
        }, { status: 400 })
      }
      
      gstData = await gstResponse.json()
      console.log(`GST API Response Data:`, gstData)

      if (!gstData.flag) {
        console.log(`GST validation failed: ${gstData.message}`)
        return NextResponse.json({ 
          error: gstData.message || "Invalid GST number" 
        }, { status: 400 })
      }

      console.log(`GST validation successful for: ${gstData.data?.lgnm}`)
    } catch (fetchError) {
      console.error('Error calling GST API:', fetchError)
      return NextResponse.json({ 
        error: `Network error while validating GST number: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` 
      }, { status: 500 })
    }

    // Extract client data from GST response
    const clientData = gstData.data
    const address = clientData.pradr?.addr || {}
    
    // Create the client
    const client = await prisma.client.create({
      data: {
        gstNumber: gstNumber,
        name: clientData.lgnm || clientData.tradeNam || "Unknown Company",
        address: clientData.pradr?.adr || "",
        state: address.stcd || "",
        businessId: user.business.id,
        // Store additional GST data for reference
        gstData: {
          status: clientData.sts,
          registrationDate: clientData.rgdt,
          businessType: clientData.ctb,
          tradeName: clientData.tradeNam,
          jurisdiction: clientData.stj,
          natureOfBusiness: clientData.nba
        }
      } as any
    })

    return NextResponse.json({ client }, { status: 201 })
  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/clients - Delete a client
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { business: true }
    })

    if (!user || !user.business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
    }

    // Verify the client belongs to the user's business
    const existingClient = await prisma.client.findFirst({
      where: { 
        id, 
        businessId: user.business.id 
      }
    })

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Delete the client (invoices will remain as per requirement)
    await prisma.client.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
