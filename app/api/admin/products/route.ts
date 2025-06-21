import { NextRequest } from "next/server"
import { prisma } from "../../../../lib/prisma"
import { handleApiError, successResponse, errorResponse, productIncludes } from "../../../../lib/api-utils"
import { requireAdmin } from "../../../../lib/auth-middleware"

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error) return error

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const status = searchParams.get("status") // active, inactive, all
    const sort = searchParams.get("sort") || "updatedAt"
    const order = searchParams.get("order") || "desc"

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (category && category !== "all") {
      where.categoryId = category
    }

    if (status === "active") {
      where.isActive = true
    } else if (status === "inactive") {
      where.isActive = false
    }
    // For "all" status, don't filter by isActive

    // Build orderBy
    let orderBy: any = {}
    switch (sort) {
      case "name":
        orderBy = { name: order }
        break
      case "price":
        orderBy = { basePrice: order }
        break
      case "stock":
        orderBy = { stock: order }
        break
      case "createdAt":
        orderBy = { createdAt: order }
        break
      default:
        orderBy = { updatedAt: order }
    }

    const skip = (page - 1) * limit

    // Fetch products with full details for admin
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          ...productIncludes,
          _count: {
            select: {
              cartItems: true,
              orderItems: true,
              wishlistItems: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ])

    // Transform products with admin-specific data
    const transformedProducts = products.map((product: { id: any; name: any; slug: any; description: any; shortDescription: any; basePrice: any; salePrice: any; costPrice: any; sku: any; stock: any; minStock: any; maxStock: any; trackStock: any; weight: any; dimensions: any; isActive: any; isDigital: any; isFeatured: any; metaTitle: any; metaDescription: any; images: any[]; category: { id: any; name: any; slug: any }; brand: { id: any; name: any; slug: any }; variants: any[]; _count: { cartItems: any; orderItems: any; wishlistItems: any }; reviews: any[]; createdAt: { toISOString: () => any }; updatedAt: { toISOString: () => any } }) => ({
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
      images: product.images.map(img => ({
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
      variants: product.variants.map(variant => ({
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
          ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
          : 0,
        reviewCount: product.reviews.length
      },
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString()
    }))

    return successResponse({
      products: transformedProducts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: skip + limit < totalCount,
        hasPreviousPage: page > 1
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error) return error

    const body = await request.json()
    const {
      name,
      slug,
      description,
      shortDescription,
      basePrice,
      salePrice,
      costPrice,
      sku,
      stock = 0,
      minStock = 0,
      maxStock,
      trackStock = true,
      weight,
      dimensions,
      isActive = true,
      isDigital = false,
      isFeatured = false,
      metaTitle,
      metaDescription,
      categoryId,
      brandId,
      images = [],
      variants = []
    } = body

    // Validate required fields
    if (!name || !slug || !basePrice || !categoryId) {
      return errorResponse("Missing required fields: name, slug, basePrice, categoryId")
    }

    // Check if slug is unique
    const existingProduct = await prisma.product.findUnique({
      where: { slug }
    })

    if (existingProduct) {
      return errorResponse("Product with this slug already exists")
    }

    // Check if SKU is unique (if provided)
    if (sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku }
      })

      if (existingSku) {
        return errorResponse("Product with this SKU already exists")
      }
    }

    // Create product with relations
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        description: description?.trim(),
        shortDescription: shortDescription?.trim(),
        basePrice: parseFloat(basePrice),
        salePrice: salePrice ? parseFloat(salePrice) : null,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        sku: sku?.trim(),
        stock: parseInt(stock),
        minStock: parseInt(minStock),
        maxStock: maxStock ? parseInt(maxStock) : null,
        trackStock,
        weight: weight ? parseFloat(weight) : null,
        dimensions: dimensions?.trim(),
        isActive,
        isDigital,
        isFeatured,
        metaTitle: metaTitle?.trim(),
        metaDescription: metaDescription?.trim(),
        categoryId,
        brandId: brandId || null,
        images: images.length > 0 ? {
          create: images.map((img: any, index: number) => ({
            url: img.url,
            altText: img.altText || name,
            sortOrder: img.sortOrder || index,
            isMain: img.isMain || index === 0
          }))
        } : undefined,
        variants: variants.length > 0 ? {
          create: variants.map((variant: any) => ({
            name: variant.name,
            sku: variant.sku,
            attributes: variant.attributes,
            price: variant.price ? parseFloat(variant.price) : null,
            stock: variant.stock ? parseInt(variant.stock) : 0,
            isActive: variant.isActive !== false
          }))
        } : undefined
      },
      include: productIncludes
    })

    return successResponse({
      message: "Product created successfully",
      product
    }, 201)

  } catch (error) {
    return handleApiError(error)
  }
}