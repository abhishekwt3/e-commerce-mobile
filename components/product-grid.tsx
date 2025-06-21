import { ProductCard } from "@/components/product-card"

// Mock data - in real app, this would come from your database
const products = [
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
    id: "2",
    name: "Premium Cotton T-Shirt",
    slug: "premium-cotton-t-shirt",
    basePrice: 29.99,
    salePrice: null,
    images: [{ url: "/placeholder.svg?height=300&width=300", altText: "T-Shirt" }],
    category: { name: "Clothing" },
    brand: { name: "FashionCo" },
    stock: 25,
    isActive: true,
    isFeatured: false,
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
  {
    id: "4",
    name: "Organic Coffee Beans",
    slug: "organic-coffee-beans",
    basePrice: 24.99,
    salePrice: null,
    images: [{ url: "/placeholder.svg?height=300&width=300", altText: "Coffee Beans" }],
    category: { name: "Food & Beverage" },
    brand: { name: "BrewMaster" },
    stock: 50,
    isActive: true,
    isFeatured: false,
  },
]

export function ProductGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
