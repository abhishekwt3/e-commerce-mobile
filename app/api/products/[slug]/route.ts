import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError, successResponse, errorResponse, productIncludes } from "../../../../lib/api-utils"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const product = await prisma.product.findUnique({
      where: {
        slug,
        isActive: true
      },
      include: {
        ...productIncludes,
        reviews: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          where: {
            isApproved: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!product) {
      return errorResponse("Product not found", 404)
    }

    // Transform product to match frontend expectations
    const transformedProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      basePrice: product.basePrice,
      salePrice: product.salePrice,
      sku: product.sku,
      stock: product.stock,
      weight: product.weight,
      dimensions: product.dimensions,
      isDigital: product.isDigital,
      isFeatured: product.isFeatured,
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
      images: product.images
        .sort((a: { sortOrder: number }, b: { sortOrder: number }) => a.sortOrder - b.sortOrder)
        .map((img: { url: any; altText: any; isMain: any }) => ({
          url: img.url,
          altText: img.altText,
          isMain: img.isMain
        })),
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug
      },
      brand: product.brand ? {
        id: product.brand.id,
        name: product.brand.name,
        slug: product.brand.slug,
        logo: product.brand.logo
      } : null,
      variants: product.variants
        .filter((variant: { isActive: any }) => variant.isActive)
        .map((variant: { id: any; name: any; attributes: string; price: any; stock: any; sku: any }) => ({
          id: variant.id,
          name: variant.name,
          attributes: variant.attributes ? JSON.parse(variant.attributes) : {},
          price: variant.price,
          stock: variant.stock,
          sku: variant.sku
        })),
      reviews: product.reviews.map((review: { id: any; rating: any; title: any; comment: any; isVerifiedPurchase: any; user: { firstName: any; lastName: any }; createdAt: { toISOString: () => any } }) => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        isVerifiedPurchase: review.isVerifiedPurchase,
        user: {
          name: `${review.user.firstName || ''} ${review.user.lastName || ''}`.trim() || 'Anonymous'
        },
        createdAt: review.createdAt.toISOString()
      })),
      averageRating: product.reviews.length > 0 
        ? product.reviews.reduce((sum: any, review: { rating: any }) => sum + review.rating, 0) / product.reviews.length
        : 0,
      reviewCount: product.reviews.length,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString()
    }

    return successResponse(transformedProduct)

  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()

    // This would typically require admin authentication
    const {
      name,
      description,
      shortDescription,
      basePrice,
      salePrice,
      stock,
      isFeatured,
      isActive
    } = body

    const product = await prisma.product.update({
      where: { slug },
      data: {
        name,
        description,
        shortDescription,
        basePrice: basePrice ? parseFloat(basePrice) : undefined,
        salePrice: salePrice ? parseFloat(salePrice) : null,
        stock: stock ? parseInt(stock) : undefined,
        isFeatured,
        isActive
      },
      include: productIncludes
    })

    return successResponse(product)

  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Soft delete by setting isActive to false
    const product = await prisma.product.update({
      where: { slug },
      data: { isActive: false }
    })

    return successResponse({ message: "Product deleted successfully" })

  } catch (error) {
    return handleApiError(error)
  }
}