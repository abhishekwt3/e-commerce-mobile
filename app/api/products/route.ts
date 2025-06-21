import { NextResponse } from "next/server"

// Mock products data - in real app, this would come from your database
const products = [
  {
    id: "1",
    name: "Wireless Bluetooth Headphones",
    slug: "wireless-bluetooth-headphones",
    description: "Premium wireless headphones with noise cancellation and 30-hour battery life.",
    shortDescription: "Premium wireless headphones with noise cancellation",
    basePrice: 79.99,
    salePrice: 59.99,
    sku: "WBH-001",
    stock: 15,
    images: [{ url: "/placeholder.svg?height=400&width=400", altText: "Headphones", isMain: true }],
    category: { id: "electronics", name: "Electronics" },
    brand: { id: "techbrand", name: "TechBrand" },
    isActive: true,
    isFeatured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Premium Cotton T-Shirt",
    slug: "premium-cotton-t-shirt",
    description: "Soft, comfortable cotton t-shirt perfect for everyday wear.",
    shortDescription: "Soft, comfortable cotton t-shirt",
    basePrice: 29.99,
    salePrice: null,
    sku: "PCT-001",
    stock: 25,
    images: [{ url: "/placeholder.svg?height=400&width=400", altText: "T-Shirt", isMain: true }],
    category: { id: "clothing", name: "Clothing" },
    brand: { id: "fashionco", name: "FashionCo" },
    isActive: true,
    isFeatured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const featured = searchParams.get("featured")
  const limit = searchParams.get("limit")

  let filteredProducts = products

  if (category && category !== "all") {
    filteredProducts = filteredProducts.filter((p) => p.category.id === category)
  }

  if (featured === "true") {
    filteredProducts = filteredProducts.filter((p) => p.isFeatured)
  }

  if (limit) {
    filteredProducts = filteredProducts.slice(0, Number.parseInt(limit))
  }

  return NextResponse.json({
    products: filteredProducts,
    total: filteredProducts.length,
  })
}
