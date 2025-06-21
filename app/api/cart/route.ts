import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError, successResponse, errorResponse, getSessionId } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const guestSessionId = searchParams.get("guestSessionId") || getSessionId(request)
    const userId = searchParams.get("userId")

    // Build where clause for cart items
    const where: any = {}
    if (userId) {
      where.userId = userId
    } else {
      where.guestSessionId = guestSessionId
    }

    const cartItems = await prisma.cartItem.findMany({
      where,
      include: {
        product: {
          include: {
            images: true,
            category: true,
            brand: true
          }
        },
        variant: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform cart items to match frontend expectations
    const transformedItems = cartItems.map((item: { product: any; variant: { price: any; id: any; name: any; attributes: string; stock: any }; id: any; variantId: any; quantity: any; createdAt: { toISOString: () => any }; updatedAt: { toISOString: () => any } }) => {
      const product = item.product
      const currentPrice = product.salePrice || product.basePrice
      const variantPrice = item.variant?.price
      const finalPrice = variantPrice || currentPrice

      return {
        id: item.id,
        productId: product.id,
        variantId: item.variantId,
        quantity: item.quantity,
        name: product.name,
        slug: product.slug,
        price: finalPrice,
        originalPrice: product.basePrice,
        image: product.images.find((img: { isMain: any }) => img.isMain)?.url || product.images[0]?.url,
        variant: item.variant ? {
          id: item.variant.id,
          name: item.variant.name,
          attributes: item.variant.attributes ? JSON.parse(item.variant.attributes) : {}
        } : null,
        stock: item.variant?.stock || product.stock,
        category: product.category.name,
        brand: product.brand?.name,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString()
      }
    })

    // Calculate totals
    const subtotal = transformedItems.reduce((sum: number, item: { price: number; quantity: number }) => sum + (item.price * item.quantity), 0)
    const totalItems = transformedItems.reduce((sum: any, item: { quantity: any }) => sum + item.quantity, 0)

    return successResponse({
      items: transformedItems,
      summary: {
        totalItems,
        subtotal,
        itemCount: transformedItems.length
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, variantId, quantity = 1, userId } = body
    const guestSessionId = getSessionId(request)

    // Validate product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
      include: { variants: true }
    })

    if (!product) {
      return errorResponse("Product not found")
    }

    // If variant specified, validate it exists
    if (variantId) {
      const variant = product.variants.find((v: { id: any; isActive: any }) => v.id === variantId && v.isActive)
      if (!variant) {
        return errorResponse("Product variant not found")
      }
    }

    // Check stock availability
    const availableStock = variantId 
      ? product.variants.find((v: { id: any }) => v.id === variantId)?.stock || 0
      : product.stock

    if (availableStock < quantity) {
      return errorResponse("Insufficient stock available")
    }

    // Create or ensure guest session exists if not a user
    if (!userId) {
      await prisma.guestSession.upsert({
        where: { sessionId: guestSessionId },
        update: { updatedAt: new Date() },
        create: {
          sessionId: guestSessionId,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      })
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        productId,
        variantId: variantId || null,
        ...(userId ? { userId } : { guestSessionId })
      }
    })

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity
      
      if (newQuantity > availableStock) {
        return errorResponse("Cannot add more items than available stock")
      }

      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { 
          quantity: newQuantity,
          updatedAt: new Date()
        }
      })

      return successResponse({ message: "Cart updated successfully", item: updatedItem })
    } else {
      // Create new cart item
      const newItem = await prisma.cartItem.create({
        data: {
          productId,
          variantId: variantId || null,
          quantity,
          userId: userId || null,
          guestSessionId: userId ? null : guestSessionId
        }
      })

      return successResponse({ message: "Item added to cart successfully", item: newItem }, 201)
    }

  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemId, quantity } = body

    if (quantity < 0) {
      return errorResponse("Quantity cannot be negative")
    }

    if (quantity === 0) {
      // Remove item from cart
      await prisma.cartItem.delete({
        where: { id: itemId }
      })
      return successResponse({ message: "Item removed from cart" })
    }

    // Validate stock availability
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        product: true,
        variant: true
      }
    })

    if (!cartItem) {
      return errorResponse("Cart item not found", 404)
    }

    const availableStock = cartItem.variant?.stock || cartItem.product.stock

    if (quantity > availableStock) {
      return errorResponse("Insufficient stock available")
    }

    // Update quantity
    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { 
        quantity,
        updatedAt: new Date()
      }
    })

    return successResponse({ message: "Cart updated successfully", item: updatedItem })

  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get("itemId")

    if (!itemId) {
      return errorResponse("Item ID is required")
    }

    await prisma.cartItem.delete({
      where: { id: itemId }
    })

    return successResponse({ message: "Item removed from cart successfully" })

  } catch (error) {
    return handleApiError(error)
  }
}