import { notFound } from "next/navigation"
import { ProductDetails } from "@/components/product-details"

// Mock function to get product by slug
async function getProduct(slug: string) {
  // In a real app, this would fetch from your database
  const products = [
    {
      id: "1",
      name: "Wireless Bluetooth Headphones",
      slug: "wireless-bluetooth-headphones",
      description:
        "Premium wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.",
      shortDescription: "Premium wireless headphones with noise cancellation",
      basePrice: 79.99,
      salePrice: 59.99,
      images: [
        { url: "/placeholder.svg?height=400&width=400", altText: "Headphones front view" },
        { url: "/placeholder.svg?height=400&width=400", altText: "Headphones side view" },
      ],
      category: { name: "Electronics" },
      brand: { name: "TechBrand" },
      stock: 15,
      isActive: true,
      isFeatured: true,
      variants: [
        { id: "1", name: "Black", attributes: '{"color": "black"}', price: null, stock: 10 },
        { id: "2", name: "White", attributes: '{"color": "white"}', price: null, stock: 5 },
      ],
    },
  ]

  return products.find((p) => p.slug === slug)
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    notFound()
  }

  return <ProductDetails product={product} />
}
