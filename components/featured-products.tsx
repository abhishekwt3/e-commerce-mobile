import { ProductCard } from "@/components/product-card"

// Mock featured products
const featuredProducts = [
  {
    id: "1",
    name: "Wireless Bluetooth Headphones",
    slug: "wireless-bluetooth-headphones",
    basePrice: 79.99,
    salePrice: 59.99,
    images: [{ url: "/placeholder.svg?height=300&width=300", altText: "Headphones" }],
    category: { name: "Electronics" },
    brand: { name: "TechBrand" },
    stock: 15,
    isActive: true,
    isFeatured: true,
  },
  {
    id: "3",
    name: "Smart Fitness Watch",
    slug: "smart-fitness-watch",
    basePrice: 199.99,
    salePrice: 149.99,
    images: [{ url: "/placeholder.svg?height=300&width=300", altText: "Smart Watch" }],
    category: { name: "Electronics" },
    brand: { name: "FitTech" },
    stock: 8,
    isActive: true,
    isFeatured: true,
  },
]

export function FeaturedProducts() {
  return (
    <div className="grid grid-cols-2 gap-4 md:gap-6">
      {featuredProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
