import { NextResponse } from "next/server"

// Mock cart data - in real app, this would be stored in database
let cartItems = [
  {
    id: "1",
    productId: "1",
    variantId: null,
    quantity: 2,
    userId: null, // For guest users
    guestSessionId: "guest-123",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const guestSessionId = searchParams.get("guestSessionId")
  const userId = searchParams.get("userId")

  const userCartItems = cartItems.filter((item) =>
    userId ? item.userId === userId : item.guestSessionId === guestSessionId,
  )

  return NextResponse.json({
    items: userCartItems,
    total: userCartItems.length,
  })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { productId, variantId, quantity, userId, guestSessionId } = body

  // Check if item already exists in cart
  const existingItemIndex = cartItems.findIndex(
    (item) =>
      item.productId === productId &&
      item.variantId === variantId &&
      (userId ? item.userId === userId : item.guestSessionId === guestSessionId),
  )

  if (existingItemIndex >= 0) {
    // Update quantity
    cartItems[existingItemIndex].quantity += quantity
    cartItems[existingItemIndex].updatedAt = new Date().toISOString()
  } else {
    // Add new item
    const newItem = {
      id: Date.now().toString(),
      productId,
      variantId,
      quantity,
      userId,
      guestSessionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    cartItems.push(newItem)
  }

  return NextResponse.json({ success: true })
}

export async function PUT(request: Request) {
  const body = await request.json()
  const { itemId, quantity } = body

  const itemIndex = cartItems.findIndex((item) => item.id === itemId)

  if (itemIndex >= 0) {
    if (quantity <= 0) {
      cartItems.splice(itemIndex, 1)
    } else {
      cartItems[itemIndex].quantity = quantity
      cartItems[itemIndex].updatedAt = new Date().toISOString()
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const itemId = searchParams.get("itemId")

  cartItems = cartItems.filter((item) => item.id !== itemId)

  return NextResponse.json({ success: true })
}
