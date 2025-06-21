import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError, successResponse, errorResponse } from "@/lib/api-utils"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return errorResponse("Email and password are required")
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { 
        email: email.toLowerCase(),
        isActive: true
      }
    })

    if (!user || !user.password) {
      return errorResponse("Invalid email or password")
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return errorResponse("Invalid email or password")
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    )

    // Return user data without password
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    }

    return successResponse({
      message: "Login successful",
      user: userData,
      token
    })

  } catch (error) {
    return handleApiError(error)
  }
}