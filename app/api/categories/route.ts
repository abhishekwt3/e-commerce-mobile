import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError, successResponse } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeProducts = searchParams.get("includeProducts") === "true"
    const parentId = searchParams.get("parentId")

    const where: any = {
      isActive: true
    }

    // Filter by parent category if specified
    if (parentId === "null" || parentId === "") {
      where.parentId = null // Root categories only
    } else if (parentId) {
      where.parentId = parentId
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        children: {
          where: { isActive: true },
          orderBy: { name: 'asc' }
        },
        parent: true,
        ...(includeProducts && {
          products: {
            where: { isActive: true },
            take: 10, // Limit products for performance
            include: {
              images: true,
              brand: true
            }
          },
          _count: {
            select: {
              products: {
                where: { isActive: true }
              }
            }
          }
        })
      },
      orderBy: { name: 'asc' }
    })

    // Transform categories to match frontend expectations
    const transformedCategories = categories.map((category: { id: any; name: any; slug: any; description: any; image: any; isActive: any; parentId: any; parent: { id: any; name: any; slug: any }; children: any[]; products: any[]; _count: { products: any }; metaTitle: any; metaDescription: any; createdAt: { toISOString: () => any }; updatedAt: { toISOString: () => any } }) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      isActive: category.isActive,
      parentId: category.parentId,
      parent: category.parent ? {
        id: category.parent.id,
        name: category.parent.name,
        slug: category.parent.slug
      } : null,
      children: category.children.map((child: { id: any; name: any; slug: any; description: any; image: any }) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        description: child.description,
        image: child.image
      })),
      ...(includeProducts && {
        products: category.products?.map((product: { id: any; name: any; slug: any; basePrice: any; salePrice: any; images: any[]; brand: { id: any; name: any } }) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          basePrice: product.basePrice,
          salePrice: product.salePrice,
          images: product.images.map((img: { url: any; altText: any; isMain: any }) => ({
            url: img.url,
            altText: img.altText,
            isMain: img.isMain
          })),
          brand: product.brand ? {
            id: product.brand.id,
            name: product.brand.name
          } : null
        })),
        productCount: category._count?.products || 0
      }),
      metaTitle: category.metaTitle,
      metaDescription: category.metaDescription,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString()
    }))

    return successResponse({
      categories: transformedCategories,
      total: transformedCategories.length
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // This would typically require admin authentication
    const {
      name,
      slug,
      description,
      image,
      parentId,
      metaTitle,
      metaDescription
    } = body

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        image,
        parentId: parentId || null,
        metaTitle,
        metaDescription
      },
      include: {
        parent: true,
        children: true
      }
    })

    return successResponse(category, 201)

  } catch (error) {
    return handleApiError(error)
  }
}