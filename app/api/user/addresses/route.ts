import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError, successResponse, errorResponse } from "@/lib/api-utils"
import { requireAuth } from "@/lib/auth-middleware"

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) return error

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return successResponse({
      addresses,
      total: addresses.length
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) return error

    const body = await request.json()
    const {
      type = 'SHIPPING',
      firstName,
      lastName,
      company,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country = 'IN',
      phone,
      isDefault = false
    } = body

    // Validate required fields
    if (!firstName || !lastName || !addressLine1 || !city || !state || !postalCode) {
      return errorResponse("Missing required address fields")
    }

    // If this is being set as default, unset other default addresses of the same type
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: user.id,
          type,
          isDefault: true
        },
        data: { isDefault: false }
      })
    }

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        type,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        company: company?.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2?.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country,
        phone: phone?.trim(),
        isDefault
      }
    })

    return successResponse({
      message: "Address created successfully",
      address
    }, 201)

  } catch (error) {
    return handleApiError(error)
  }
}