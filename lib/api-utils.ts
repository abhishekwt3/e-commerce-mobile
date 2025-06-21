import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export function handleApiError(error: unknown) {
  console.error('API Error:', error)

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', details: error.errors },
      { status: 400 }
    )
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}

export function successResponse(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

// Session helper for guest users
export function getSessionId(request: Request): string {
  const sessionId = request.headers.get('x-session-id') || 
                   request.headers.get('x-guest-session-id') ||
                   `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  return sessionId
}

// Common product includes for consistent data fetching
export const productIncludes = {
  images: true,
  category: true,
  brand: true,
  variants: true,
  reviews: {
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    }
  }
} as const