import { NextRequest } from "next/server"
import { prisma } from "../../../../../lib/prisma"
import { handleApiError, successResponse, errorResponse, productIncludes } from "../../../../../lib/api-utils"
import { requireAdmin } from "../../../../../lib/auth-middleware"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error) return error

    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        ...productIncludes,
        _count: {
          select: {
            cartItems: true,
            orderItems: true,
            wishlistItems: true
          }
        }
      }
    })

    if (!product) {
      return errorResponse("Product not found", 404)
    }

    // Transform product with admin-specific data
    const transformedProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      basePrice: product.basePrice,
      salePrice: product.salePrice,
      costPrice: product.costPrice,
      sku: product.sku,
      stock: product.stock,
      minStock: product.minStock,
      maxStock: product.maxStock,
      trackStock: product.trackStock,
      weight: product.weight,
      dimensions: product.dimensions,
      isActive: product.isActive,
      isDigital: product.isDigital,
      isFeatured: product.isFeatured,
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
      images: product.images.map((img: { id: any; url: any; altText: any; sortOrder: any; isMain: any }) => ({
        id: img.id,
        url: img.url,
        altText: img.altText,
        sortOrder: img.sortOrder,
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
        slug: product.brand.slug
      } : null,
      variants: product.variants.map((variant: { id: any; name: any; sku: any; attributes: any; price: any; stock: any; isActive: any }) => ({
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
        attributes: variant.attributes,
        price: variant.price,
        stock: variant.stock,
        isActive: variant.isActive
      })),
      analytics: {
        inCarts: product._count.cartItems,
        sold: product._count.orderItems,
        wishlisted: product._count.wishlistItems,
        averageRating: product.reviews.length > 0 
          ? product.reviews.reduce((sum: any, review: { rating: any }) => sum + review.rating, 0) / product.reviews.length
          : 0,
        reviewCount: product.reviews.length
      },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error) return error

    const { id } = await params
    const body = await request.json()

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    })

    if (!existingProduct) {
      return errorResponse("Product not found", 404)
    }

    const {
      name,
      slug,
      description,
      shortDescription,
      basePrice,
      salePrice,
      costPrice,
      sku,
      stock,
      minStock,
      maxStock,
      trackStock,
      weight,
      dimensions,
      isActive,
      isDigital,
      isFeatured,
      metaTitle,
      metaDescription,
      categoryId,
      brandId
    } = body

    // Check if slug is unique (if changing)
    if (slug && slug !== existingProduct.slug) {
      const existingSlug = await prisma.product.findUnique({
        where: { slug }
      })

      if (existingSlug) {
        return errorResponse("Product with this slug already exists")
      }
    }

    // Check if SKU is unique (if changing)
    if (sku && sku !== existingProduct.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku }
      })

      if (existingSku) {
        return errorResponse("Product with this SKU already exists")
      }
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: name?.trim(),
        slug: slug?.trim(),
        description: description?.trim(),
        shortDescription: shortDescription?.trim(),
        basePrice: basePrice ? parseFloat(basePrice) : undefined,
        salePrice: salePrice !== undefined ? (salePrice ? parseFloat(salePrice) : null) : undefined,
        costPrice: costPrice !== undefined ? (costPrice ? parseFloat(costPrice) : null) : undefined,
        sku: sku?.trim(),
        stock: stock !== undefined ? parseInt(stock) : undefined,
        minStock: minStock !== undefined ? parseInt(minStock) : undefined,
        maxStock: maxStock !== undefined ? (maxStock ? parseInt(maxStock) : null) : undefined,
        trackStock: trackStock !== undefined ? trackStock : undefined,
        weight: weight !== undefined ? (weight ? parseFloat(weight) : null) : undefined,
        dimensions: dimensions?.trim(),
        isActive: isActive !== undefined ? isActive : undefined,
        isDigital: isDigital !== undefined ? isDigital : undefined,
        isFeatured: isFeatured !== undefined ? isFeatured : undefined,
        metaTitle: metaTitle?.trim(),
        metaDescription: metaDescription?.trim(),
        categoryId: categoryId || undefined,
        brandId: brandId !== undefined ? (brandId || null) : undefined
      },
      include: productIncludes
    })

    return successResponse({
      message: "Product updated successfully",
      product: updatedProduct
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
    const { user, error } = await requireAdmin(request)
    if (error) return error

    const { id } = await params

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    })

    if (!existingProduct) {
      return errorResponse("Product not found", 404)
    }

    // Check if product is used in any orders
    const orderItems = await prisma.orderItem.findFirst({
      where: { productId: id }
    })

    if (orderItems) {
      // Soft delete - just mark as inactive
      await prisma.product.update({
        where: { id },
        data: { isActive: false }
      })

      return successResponse({
        message: "Product deactivated (used in orders, cannot be permanently deleted)"
      })
    } else {
      // Hard delete if not used in orders
      await prisma.product.delete({
        where: { id }
      })

      return successResponse({
        message: "Product deleted successfully"
      })
    }

  } catch (error) {
    return handleApiError(error)
  }
}