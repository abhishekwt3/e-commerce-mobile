import { Suspense } from "react"
import { ProductGrid } from "@/components/product-grid"
import { HeroSection } from "@/components/hero-section"
import { CategoryNav } from "@/components/category-nav"
import { FeaturedProducts } from "@/components/featured-products"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <CategoryNav />
      <div className="container mx-auto px-4 py-8">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
          <Suspense fallback={<div className="text-center py-8">Loading products...</div>}>
            <FeaturedProducts />
          </Suspense>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6">All Products</h2>
          <Suspense fallback={<div className="text-center py-8">Loading products...</div>}>
            <ProductGrid />
          </Suspense>
        </section>
      </div>
    </div>
  )
}
