import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError, successResponse, productIncludes } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const featured = searchParams.get("featured")
    const limit = searchParams.get("limit")
    const search = searchParams.get("search")
    const sort = searchParams.get("sort") || "createdAt"
    const order = searchParams.get("order") || "desc"
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "12")

    // Build where clause
    const where: any = {
      isActive: true
    }

    if (category && category !== "all") {
      where.category = {
        slug: category
      }
    }

    if (featured === "true") {
      where.isFeatured = true
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Build orderBy clause
    let orderBy: any = {}
    switch (sort) {
      case "price":
        orderBy = { basePrice: order }
        break
      case "name":
        orderBy = { name: order }
        break
      case "rating":
        // We'll need to calculate average rating in a more complex query
        orderBy = { createdAt: order }
        break
      default:
        orderBy = { createdAt: order }
    }

    // Calculate offset for pagination
    const skip = (page - 1) * pageSize
    const take = limit ? parseInt(limit) : pageSize

    // Fetch products with pagination
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productIncludes,
        orderBy,
        skip,
        take
      }),
      prisma.product.count({ where })
    ])

    // Transform products to match frontend expectations
    const transformedProducts = products.map((product: { id: any; name: any; slug: any; description: any; shortDescription: any; basePrice: any; salePrice: any; sku: any; stock: any; images: any[]; category: { id: any; name: any; slug: any }; brand: { id: any; name: any; slug: any }; isActive: any; isFeatured: any; variants: any[]; reviews: any[]; createdAt: { toISOString: () => any }; updatedAt: { toISOString: () => any } }) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      basePrice: product.basePrice,
      salePrice: product.salePrice,
      sku: product.sku,
      stock: product.stock,
      images: product.images.map((img: { url: any; altText: any; isMain: any }) => ({
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
        slug: product.brand.slug
      } : null,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      variants: product.variants.map((variant: { id: any; name: any; attributes: any; price: any; stock: any }) => ({
        id: variant.id,
        name: variant.name,
        attributes: variant.attributes,
        price: variant.price,
        stock: variant.stock
      })),
      averageRating: product.reviews.length > 0 
        ? product.reviews.reduce((sum: any, review: { rating: any }) => sum + review.rating, 0) / product.reviews.length
        : 0,
      reviewCount: product.reviews.length,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString()
    }))

    return successResponse({
      products: transformedProducts,
      pagination: {
        page,
        pageSize: take,
        totalCount,
        totalPages: Math.ceil(totalCount / take),
        hasNextPage: skip + take < totalCount,
        hasPreviousPage: page > 1
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // This would typically require admin authentication
    // For now, we'll create a basic product
    const {
      name,
      slug,
      description,
      shortDescription,
      basePrice,
      salePrice,
      sku,
      stock,
      categoryId,
      brandId,
      images = [],
      variants = [],
      isFeatured = false
    } = body

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        shortDescription,
        basePrice: parseFloat(basePrice),
        salePrice: salePrice ? parseFloat(salePrice) : null,
        sku,
        stock: parseInt(stock),
        categoryId,
        brandId,
        isFeatured,
        images: {
          create: images.map((img: any, index: number) => ({
            url: img.url,
            altText: img.altText || name,
            sortOrder: index,
            isMain: index === 0
          }))
        },
        variants: variants.length > 0 ? {
          create: variants.map((variant: any) => ({
            name: variant.name,
            attributes: variant.attributes,
            price: variant.price ? parseFloat(variant.price) : null,
            stock: variant.stock ? parseInt(variant.stock) : 0,
            sku: variant.sku
          }))
        } : undefined
      },
      include: productIncludes
    })

    return successResponse(product, 201)

  } catch (error) {
    return handleApiError(error)
  }
}