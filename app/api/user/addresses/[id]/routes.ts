import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError, successResponse, errorResponse } from "@/lib/api-utils"
import { requireAuth } from "@/lib/auth-middleware"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) return error

    const { id } = await params

    const address = await prisma.address.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!address) {
      return errorResponse("Address not found", 404)
    }

    return successResponse(address)

  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) return error

    const { id } = await params
    const body = await request.json()

    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!existingAddress) {
      return errorResponse("Address not found", 404)
    }

    const {
      type,
      firstName,
      lastName,
      company,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault
    } = body

    // If this is being set as default, unset other default addresses of the same type
    if (isDefault && !existingAddress.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: user.id,
          type: type || existingAddress.type,
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      })
    }

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        type: type || existingAddress.type,
        firstName: firstName?.trim() || existingAddress.firstName,
        lastName: lastName?.trim() || existingAddress.lastName,
        company: company?.trim(),
        addressLine1: addressLine1?.trim() || existingAddress.addressLine1,
        addressLine2: addressLine2?.trim(),
        city: city?.trim() || existingAddress.city,
        state: state?.trim() || existingAddress.state,
        postalCode: postalCode?.trim() || existingAddress.postalCode,
        country: country || existingAddress.country,
        phone: phone?.trim(),
        isDefault: isDefault !== undefined ? isDefault : existingAddress.isDefault
      }
    })

    return successResponse({
      message: "Address updated successfully",
      address: updatedAddress
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) return error

    const { id } = await params

    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!existingAddress) {
      return errorResponse("Address not found", 404)
    }

    // Check if address is being used in any orders
    const ordersUsingAddress = await prisma.order.findFirst({
      where: {
        OR: [
          { shippingAddressId: id },
          { billingAddressId: id }
        ]
      }
    })

    if (ordersUsingAddress) {
      return errorResponse("Cannot delete address that is used in orders")
    }

    await prisma.address.delete({
      where: { id }
    })

    return successResponse({
      message: "Address deleted successfully"
    })

  } catch (error) {
    return handleApiError(error)
  }
}