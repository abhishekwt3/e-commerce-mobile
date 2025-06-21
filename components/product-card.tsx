"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { ShoppingCart, Heart, Star } from "lucide-react"
import { useState } from "react"

interface Product {
  id: string
  name: string
  slug: string
  basePrice: number
  salePrice: number | null
  images: { url: string; altText: string }[]
  category: { name: string }
  brand: { name: string }
  stock: number
  isActive: boolean
  isFeatured: boolean
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const handleAddToCart = async () => {
    setIsAddingToCart(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsAddingToCart(false)
  }

  const discountPercentage = product.salePrice
    ? Math.round(((product.basePrice - product.salePrice) / product.basePrice) * 100)
    : 0

  return (
    <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="relative aspect-square overflow-hidden">
        <Link href={`/products/${product.slug}`}>
          <Image
            src={product.images[0]?.url || "/placeholder.svg"}
            alt={product.images[0]?.altText || product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {product.salePrice && (
          <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">-{discountPercentage}%</Badge>
        )}

        {product.isFeatured && (
          <Badge className="absolute top-2 right-2 bg-yellow-500 hover:bg-yellow-600">⭐ Featured</Badge>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-white/80 hover:bg-white"
          onClick={() => setIsWishlisted(!isWishlisted)}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
        </Button>

        {product.stock <= 5 && product.stock > 0 && (
          <Badge variant="destructive" className="absolute bottom-2 left-2">
            Only {product.stock} left!
          </Badge>
        )}
      </div>

      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-xs text-muted-foreground ml-1">(4.5)</span>
          </div>

          <Link href={`/products/${product.slug}`}>
            <h3 className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors">{product.name}</h3>
          </Link>

          <p className="text-xs text-muted-foreground">{product.brand.name}</p>

          <div className="flex items-center gap-2">
            {product.salePrice ? (
              <>
                <span className="font-bold text-lg text-primary">${product.salePrice.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground line-through">${product.basePrice.toFixed(2)}</span>
              </>
            ) : (
              <span className="font-bold text-lg">${product.basePrice.toFixed(2)}</span>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0">
        <Button className="w-full" size="sm" onClick={handleAddToCart} disabled={product.stock === 0 || isAddingToCart}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          {product.stock === 0 ? "Out of Stock" : isAddingToCart ? "Adding..." : "Add to Cart"}
        </Button>
      </CardFooter>
    </Card>
  )
}
