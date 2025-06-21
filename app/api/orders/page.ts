import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError, successResponse, errorResponse, getSessionId } from "@/lib/api-utils"

// Generate order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.random().toString(36).substr(2, 4).toUpperCase()
  return `ORD-${timestamp}-${random}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const guestSessionId = searchParams.get("guestSessionId") || getSessionId(request)
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    const where: any = {}
    
    if (userId) {
      where.userId = userId
    } else {
      where.guestSessionId = guestSessionId
    }

    if (status) {
      where.status = status
    }

    const skip = (page - 1) * limit

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true,
                  category: true,
                  brand: true
                }
              },
              variant: true
            }
          },
          shippingAddress: true,
          billingAddress: true,
          payments: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ])

    // Transform orders to match frontend expectations
    const transformedOrders = orders.map((order: { id: any; orderNumber: any; status: any; paymentStatus: any; customerEmail: any; customerPhone: any; subtotal: any; taxAmount: any; shippingCost: any; discountAmount: any; totalAmount: any; paymentMethod: any; trackingNumber: any; customerNotes: any; items: any[]; shippingAddress: any; guestShippingAddress: string; billingAddress: any; guestBillingAddress: string; payments: any; user: any; createdAt: { toISOString: () => any }; updatedAt: { toISOString: () => any }; shippedAt: { toISOString: () => any }; deliveredAt: { toISOString: () => any } }) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      shippingCost: order.shippingCost,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      trackingNumber: order.trackingNumber,
      customerNotes: order.customerNotes,
      items: order.items.map((item: { id: any; quantity: any; unitPrice: any; totalPrice: any; productName: any; productSku: any; variantName: any; product: { id: any; name: any; slug: any; images: any[]; category: { name: any }; brand: { name: any } }; variant: { id: any; name: any; attributes: string } }) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        productName: item.productName,
        productSku: item.productSku,
        variantName: item.variantName,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          images: item.product.images.map((img: { url: any; altText: any; isMain: any }) => ({
            url: img.url,
            altText: img.altText,
            isMain: img.isMain
          })),
          category: item.product.category.name,
          brand: item.product.brand?.name
        },
        variant: item.variant ? {
          id: item.variant.id,
          name: item.variant.name,
          attributes: item.variant.attributes ? JSON.parse(item.variant.attributes) : {}
        } : null
      })),
      shippingAddress: order.shippingAddress || (order.guestShippingAddress ? JSON.parse(order.guestShippingAddress) : null),
      billingAddress: order.billingAddress || (order.guestBillingAddress ? JSON.parse(order.guestBillingAddress) : null),
      payments: order.payments,
      user: order.user,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      shippedAt: order.shippedAt?.toISOString(),
      deliveredAt: order.deliveredAt?.toISOString()
    }))

    return successResponse({
      orders: transformedOrders,
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
    const body = await request.json()
    const {
      userId,
      customerEmail,
      customerPhone,
      shippingAddress,
      billingAddress,
      paymentMethod = "cod",
      customerNotes,
      cartItems // Array of cart item IDs or full cart data
    } = body

    const guestSessionId = getSessionId(request)

    // Validate required fields
    if (!customerEmail) {
      return errorResponse("Customer email is required")
    }

    if (!cartItems || cartItems.length === 0) {
      return errorResponse("Cart items are required")
    }

    // Get cart items from database if only IDs provided
    let orderItems = []
    let cartItemIds = []

    if (typeof cartItems[0] === 'string') {
      // Cart item IDs provided
      cartItemIds = cartItems
      const dbCartItems = await prisma.cartItem.findMany({
        where: {
          id: { in: cartItemIds },
          ...(userId ? { userId } : { guestSessionId })
        },
        include: {
          product: {
            include: {
              images: true,
              category: true,
              brand: true
            }
          },
          variant: true
        }
      })

      orderItems = dbCartItems.map((item: { product: any; variant: { price: any; name: any }; variantId: any; quantity: number }) => {
        const product = item.product
        const currentPrice = product.salePrice || product.basePrice
        const variantPrice = item.variant?.price
        const finalPrice = variantPrice || currentPrice

        return {
          productId: product.id,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: finalPrice,
          totalPrice: finalPrice * item.quantity,
          productName: product.name,
          productSku: product.sku,
          variantName: item.variant?.name
        }
      })
    } else {
      // Full cart data provided
      orderItems = cartItems.map((item: any) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
        productName: item.name,
        productSku: item.sku || null,
        variantName: item.variant?.name
      }))
    }

    // Calculate totals
    const subtotal = orderItems.reduce((sum: any, item: { totalPrice: any }) => sum + item.totalPrice, 0)
    const taxAmount = subtotal * 0.08 // 8% tax
    const shippingCost = subtotal > 50 ? 0 : 9.99
    const totalAmount = subtotal + taxAmount + shippingCost

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerEmail,
        customerPhone,
        subtotal,
        taxAmount,
        shippingCost,
        totalAmount,
        paymentMethod,
        customerNotes,
        userId: userId || null,
        guestSessionId: userId ? null : guestSessionId,
        guestShippingAddress: !userId && shippingAddress ? JSON.stringify(shippingAddress) : null,
        guestBillingAddress: !userId && billingAddress ? JSON.stringify(billingAddress) : null,
        shippingAddressId: userId && shippingAddress?.id ? shippingAddress.id : null,
        billingAddressId: userId && billingAddress?.id ? billingAddress.id : null,
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true
              }
            },
            variant: true
          }
        }
      }
    })

    // Clear cart items after successful order
    if (cartItemIds.length > 0) {
      await prisma.cartItem.deleteMany({
        where: {
          id: { in: cartItemIds }
        }
      })
    }

    // Create initial payment record
    await prisma.payment.create({
      data: {
        amount: totalAmount,
        method: paymentMethod,
        status: paymentMethod === "cod" ? "PENDING" : "PENDING",
        orderId: order.id
      }
    })

    return successResponse({
      message: "Order created successfully",
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentMethod: order.paymentMethod
      }
    }, 201)

  } catch (error) {
    return handleApiError(error)
  }
}