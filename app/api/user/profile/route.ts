import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError, successResponse, errorResponse } from "@/lib/api-utils"
import { requireAuth } from "@/lib/auth-middleware"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) return error

    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        lastLogin: true,
        addresses: {
          orderBy: { isDefault: 'desc' }
        }
      }
    })

    return successResponse(userProfile)

  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) return error

    const body = await request.json()
    const { firstName, lastName, phone, currentPassword, newPassword } = body

    // Prepare update data
    const updateData: any = {}
    
    if (firstName !== undefined) updateData.firstName = firstName?.trim()
    if (lastName !== undefined) updateData.lastName = lastName?.trim()
    if (phone !== undefined) updateData.phone = phone?.trim()

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return errorResponse("Current password is required to change password")
      }

      // Verify current password
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { password: true }
      })

      if (!currentUser?.password) {
        return errorResponse("Invalid current password")
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password)
      
      if (!isCurrentPasswordValid) {
        return errorResponse("Invalid current password")
      }

      if (newPassword.length < 6) {
        return errorResponse("New password must be at least 6 characters long")
      }

      // Hash new password
      updateData.password = await bcrypt.hash(newPassword, 12)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        updatedAt: true
      }
    })

    return successResponse({
      message: "Profile updated successfully",
      user: updatedUser
    })

  } catch (error) {
    return handleApiError(error)
  }
}