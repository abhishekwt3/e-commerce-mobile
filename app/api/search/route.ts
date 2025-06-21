import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError, successResponse, productIncludes } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const category = searchParams.get("category")
    const brand = searchParams.get("brand")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const inStock = searchParams.get("inStock")
    const sort = searchParams.get("sort") || "relevance"
    const order = searchParams.get("order") || "desc"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "12")

    if (!query || query.trim().length < 2) {
      return successResponse({
        products: [],
        suggestions: [],
        pagination: {
          page: 1,
          limit,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        }
      })
    }

    const searchTerm = query.trim()

    // Build where clause for search
    const where: any = {
      isActive: true,
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { shortDescription: { contains: searchTerm, mode: 'insensitive' } },
        { sku: { contains: searchTerm, mode: 'insensitive' } },
        { 
          category: { 
            name: { contains: searchTerm, mode: 'insensitive' } 
          } 
        },
        { 
          brand: { 
            name: { contains: searchTerm, mode: 'insensitive' } 
          } 
        }
      ]
    }

    // Add filters
    const andConditions: any[] = []

    if (category && category !== "all") {
      andConditions.push({
        category: { slug: category }
      })
    }

    if (brand) {
      andConditions.push({
        brand: { slug: brand }
      })
    }

    if (minPrice) {
      andConditions.push({
        OR: [
          { salePrice: { gte: parseFloat(minPrice) } },
          { 
            AND: [
              { salePrice: null },
              { basePrice: { gte: parseFloat(minPrice) } }
            ]
          }
        ]
      })
    }

    if (maxPrice) {
      andConditions.push({
        OR: [
          { salePrice: { lte: parseFloat(maxPrice) } },
          { 
            AND: [
              { salePrice: null },
              { basePrice: { lte: parseFloat(maxPrice) } }
            ]
          }
        ]
      })
    }

    if (inStock === "true") {
      andConditions.push({
        stock: { gt: 0 }
      })
    }

    if (andConditions.length > 0) {
      where.AND = andConditions
    }

    // Build orderBy clause
    let orderBy: any = {}
    switch (sort) {
      case "price_asc":
        orderBy = [
          { salePrice: { sort: 'asc', nulls: 'last' } },
          { basePrice: 'asc' }
        ]
        break
      case "price_desc":
        orderBy = [
          { salePrice: { sort: 'desc', nulls: 'last' } },
          { basePrice: 'desc' }
        ]
        break
      case "name":
        orderBy = { name: order }
        break
      case "newest":
        orderBy = { createdAt: 'desc' }
        break
      case "oldest":
        orderBy = { createdAt: 'asc' }
        break
      default: // relevance
        orderBy = { name: 'asc' } // Simple relevance - could be improved with scoring
    }

    const skip = (page - 1) * limit

    // Execute search
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productIncludes,
        orderBy,
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ])

    // Get search suggestions (categories and brands that match)
    const suggestions = await Promise.all([
      // Matching categories
      prisma.category.findMany({
        where: {
          isActive: true,
          name: { contains: searchTerm, mode: 'insensitive' }
        },
        select: { name: true, slug: true },
        take: 3
      }),
      // Matching brands  
      prisma.brand.findMany({
        where: {
          isActive: true,
          name: { contains: searchTerm, mode: 'insensitive' }
        },
        select: { name: true, slug: true },
        take: 3
      })
    ])

    const [matchingCategories, matchingBrands] = suggestions

    // Transform products
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
      images: product.images.map(img => ({
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
      variants: product.variants.map(variant => ({
        id: variant.id,
        name: variant.name,
        attributes: variant.attributes,
        price: variant.price,
        stock: variant.stock
      })),
      averageRating: product.reviews.length > 0 
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0,
      reviewCount: product.reviews.length,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString()
    }))

    return successResponse({
      products: transformedProducts,
      suggestions: {
        categories: matchingCategories.map((cat: { name: any; slug: any }) => ({
          label: cat.name,
          value: cat.slug,
          type: 'category'
        })),
        brands: matchingBrands.map((brand: { name: any; slug: any }) => ({
          label: brand.name,
          value: brand.slug,
          type: 'brand'
        }))
      },
      filters: {
        query: searchTerm,
        category,
        brand,
        minPrice,
        maxPrice,
        inStock,
        sort
      },
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