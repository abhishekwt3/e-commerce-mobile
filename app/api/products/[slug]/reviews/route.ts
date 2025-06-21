import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError, successResponse, errorResponse } from "@/lib/api-utils"
import { requireAuth, getOptionalUser } from "@/lib/auth-middleware"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const rating = searchParams.get("rating")

    // Find product by slug
    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
      select: { id: true }
    })

    if (!product) {
      return errorResponse("Product not found", 404)
    }

    // Build where clause
    const where: any = {
      productId: product.id,
      isApproved: true
    }

    if (rating) {
      where.rating = parseInt(rating)
    }

    const skip = (page - 1) * limit

    // Fetch reviews with pagination
    const [reviews, totalCount, ratingCounts] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.review.count({ where }),
      prisma.review.groupBy({
        by: ['rating'],
        where: { productId: product.id, isApproved: true },
        _count: true
      })
    ])

    // Calculate rating statistics
    const ratingStats = Array.from({ length: 5 }, (_, i) => {
      const rating = 5 - i
      const count = ratingCounts.find((r: { rating: number }) => r.rating === rating)?._count || 0
      return { rating, count }
    })

    const totalReviews = ratingCounts.reduce((sum: any, r: { _count: any }) => sum + r._count, 0)
    const averageRating = totalReviews > 0 
      ? ratingCounts.reduce((sum: number, r: { rating: number; _count: number }) => sum + (r.rating * r._count), 0) / totalReviews
      : 0

    // Transform reviews
    const transformedReviews = reviews.map((review: { id: any; rating: any; title: any; comment: any; isVerifiedPurchase: any; user: { firstName: any; lastName: any }; createdAt: { toISOString: () => any } }) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      isVerifiedPurchase: review.isVerifiedPurchase,
      user: {
        name: `${review.user.firstName || ''} ${review.user.lastName || ''}`.trim() || 'Anonymous'
      },
      createdAt: review.createdAt.toISOString()
    }))

    return successResponse({
      reviews: transformedReviews,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: skip + limit < totalCount,
        hasPreviousPage: page > 1
      },
      stats: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        ratingBreakdown: ratingStats
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) return error

    const { slug } = await params
    const body = await request.json()
    const { rating, title, comment } = body

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return errorResponse("Rating must be between 1 and 5")
    }

    // Find product by slug
    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
      select: { id: true }
    })

    if (!product) {
      return errorResponse("Product not found", 404)
    }

    // Check if user has already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId: product.id,
          userId: user.id
        }
      }
    })

    if (existingReview) {
      return errorResponse("You have already reviewed this product")
    }

    // Check if user has purchased this product (optional verification)
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId: product.id,
        order: {
          userId: user.id,
          status: 'DELIVERED'
        }
      }
    })

    // Create review
    const review = await prisma.review.create({
      data: {
        productId: product.id,
        userId: user.id,
        rating: parseInt(rating),
        title: title?.trim(),
        comment: comment?.trim(),
        isVerifiedPurchase: !!hasPurchased,
        isApproved: true // Auto-approve for now, you might want to moderate
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return successResponse({
      message: "Review submitted successfully",
      review: {
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        isVerifiedPurchase: review.isVerifiedPurchase,
        user: {
          name: `${review.user.firstName || ''} ${review.user.lastName || ''}`.trim() || 'Anonymous'
        },
        createdAt: review.createdAt.toISOString()
      }
    }, 201)

  } catch (error) {
    return handleApiError(error)
  }
}