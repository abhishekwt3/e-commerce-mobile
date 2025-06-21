import { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"
import { errorResponse } from "@/lib/api-utils"

interface JWTPayload {
  userId: string
  email: string
  role: string
  iat: number
  exp: number
}

export async function verifyAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("No valid authorization header")
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix

    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || "your-secret-key"
    ) as JWTPayload

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.userId,
        isActive: true 
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true
      }
    })

    if (!user) {
      throw new Error("User not found or inactive")
    }

    return user

  } catch (error) {
    return null
  }
}

export async function requireAuth(request: NextRequest) {
  const user = await verifyAuth(request)
  
  if (!user) {
    return {
      error: errorResponse("Authentication required", 401),
      user: null
    }
  }

  return { user, error: null }
}

export async function requireAdmin(request: NextRequest) {
  const user = await verifyAuth(request)
  
  if (!user) {
    return {
      error: errorResponse("Authentication required", 401),
      user: null
    }
  }

  if (user.role !== "ADMIN") {
    return {
      error: errorResponse("Admin access required", 403),
      user: null
    }
  }

  return { user, error: null }
}

// Helper function to get user from request (returns null if not authenticated)
export async function getOptionalUser(request: NextRequest) {
  return await verifyAuth(request)
}