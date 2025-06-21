import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError, successResponse, errorResponse } from "@/lib/api-utils"
import { requireAuth } from "@/lib/auth-middleware"

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) return error

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            images: true,
            category: true,
            brand: true,
            reviews: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform wishlist items to match frontend expectations
    const transformedItems = wishlistItems.map((item: { id: any; product: { id: any; name: any; slug: any; description: any; shortDescription: any; basePrice: any; salePrice: any; stock: any; isFeatured: any; images: any[]; category: { id: any; name: any; slug: any }; brand: { id: any; name: any; slug: any }; reviews: any[] }; createdAt: { toISOString: () => any } }) => ({
      id: item.id,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        description: item.product.description,
        shortDescription: item.product.shortDescription,
        basePrice: item.product.basePrice,
        salePrice: item.product.salePrice,
        stock: item.product.stock,
        isFeatured: item.product.isFeatured,
        images: item.product.images.map(img => ({
          url: img.url,
          altText: img.altText,
          isMain: img.isMain
        })),
        category: {
          id: item.product.category.id,
          name: item.product.category.name,
          slug: item.product.category.slug
        },
        brand: item.product.brand ? {
          id: item.product.brand.id,
          name: item.product.brand.name,
          slug: item.product.brand.slug
        } : null,
        averageRating: item.product.reviews.length > 0 
          ? item.product.reviews.reduce((sum, review) => sum + review.rating, 0) / item.product.reviews.length
          : 0,
        reviewCount: item.product.reviews.length
      },
      createdAt: item.createdAt.toISOString()
    }))

    return successResponse({
      items: transformedItems,
      total: transformedItems.length
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
    const { productId } = body

    if (!productId) {
      return errorResponse("Product ID is required")
    }

    // Check if product exists and is active
    const product = await prisma.product.findUnique({
      where: { 
        id: productId,
        isActive: true 
      }
    })

    if (!product) {
      return errorResponse("Product not found")
    }

    // Check if item already exists in wishlist
    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        productId_userId: {
          productId,
          userId: user.id
        }
      }
    })

    if (existingItem) {
      return errorResponse("Product already in wishlist")
    }

    // Add to wishlist
    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        productId,
        userId: user.id
      },
      include: {
        product: {
          include: {
            images: true,
            category: true,
            brand: true
          }
        }
      }
    })

    return successResponse({
      message: "Product added to wishlist successfully",
      item: wishlistItem
    }, 201)

  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) return error

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")
    const itemId = searchParams.get("itemId")

    if (!productId && !itemId) {
      return errorResponse("Product ID or item ID is required")
    }

    let whereClause: any = { userId: user.id }
    
    if (itemId) {
      whereClause.id = itemId
    } else if (productId) {
      whereClause.productId = productId
    }

    // Check if item exists
    const existingItem = await prisma.wishlistItem.findFirst({
      where: whereClause
    })

    if (!existingItem) {
      return errorResponse("Wishlist item not found")
    }

    // Remove from wishlist
    await prisma.wishlistItem.delete({
      where: { id: existingItem.id }
    })

    return successResponse({
      message: "Product removed from wishlist successfully"
    })

  } catch (error) {
    return handleApiError(error)
  }
}