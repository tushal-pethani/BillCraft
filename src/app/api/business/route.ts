import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/business - Get business information for the current user
export async function GET() {
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

    return NextResponse.json({ business: user.business })
  } catch (error) {
    console.error("Error fetching business:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/business - Create business information
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

    // Check if business already exists
    const existingBusiness = await prisma.business.findUnique({
      where: { userId: user.id }
    })

    if (existingBusiness) {
      return NextResponse.json({ error: "Business already exists. Use PUT to update." }, { status: 400 })
    }

    const body = await request.json()
    const { gstNumber, name, address, state } = body

    // Validate required fields
    if (!gstNumber || !name || !address || !state) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Create the business
    const business = await prisma.business.create({
      data: {
        gstNumber,
        name,
        address,
        state,
        userId: user.id
      }
    })

    return NextResponse.json({ business }, { status: 201 })
  } catch (error) {
    console.error("Error creating business:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/business - Update business information
export async function PUT(request: NextRequest) {
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
      return NextResponse.json({ error: "Business not found. Use POST to create." }, { status: 404 })
    }

    const body = await request.json()
    const { gstNumber, name, address, state } = body

    // Validate required fields
    if (!gstNumber || !name || !address || !state) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Update the business
    const business = await prisma.business.update({
      where: { id: user.business.id },
      data: {
        gstNumber,
        name,
        address,
        state
      }
    })

    return NextResponse.json({ business })
  } catch (error) {
    console.error("Error updating business:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
