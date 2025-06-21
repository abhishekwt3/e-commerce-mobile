"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ShoppingCart, Heart, Star, Truck, Shield, RotateCcw, Plus, Minus } from "lucide-react"

interface ProductDetailsProps {
  product: {
    id: string
    name: string
    description: string
    shortDescription: string
    basePrice: number
    salePrice: number | null
    images: { url: string; altText: string }[]
    category: { name: string }
    brand: { name: string }
    stock: number
    variants?: { id: string; name: string; attributes: string; price: number | null; stock: number }[]
  }
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]?.id || "")
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const currentPrice = product.salePrice || product.basePrice
  const discountPercentage = product.salePrice
    ? Math.round(((product.basePrice - product.salePrice) / product.basePrice) * 100)
    : 0

  const handleAddToCart = async () => {
    setIsAddingToCart(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsAddingToCart(false)
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square relative overflow-hidden rounded-lg border">
            <Image
              src={product.images[selectedImage]?.url || "/placeholder.svg"}
              alt={product.images[selectedImage]?.altText || product.name}
              fill
              className="object-cover"
            />
            {product.salePrice && (
              <Badge className="absolute top-4 left-4 bg-red-500 hover:bg-red-600">-{discountPercentage}% OFF</Badge>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden ${
                    selectedImage === index ? "border-primary" : "border-muted"
                  }`}
                >
                  <Image
                    src={image.url || "/placeholder.svg"}
                    alt={image.altText}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{product.category.name}</Badge>
              <span className="text-sm text-muted-foreground">by {product.brand.name}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-muted-foreground mb-4">{product.shortDescription}</p>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">(4.5) • 127 reviews</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-primary">${currentPrice.toFixed(2)}</span>
            {product.salePrice && (
              <span className="text-xl text-muted-foreground line-through">${product.basePrice.toFixed(2)}</span>
            )}
          </div>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Color</Label>
              <RadioGroup value={selectedVariant} onValueChange={setSelectedVariant}>
                <div className="flex gap-2">
                  {product.variants.map((variant) => (
                    <div key={variant.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={variant.id} id={variant.id} />
                      <Label htmlFor={variant.id} className="cursor-pointer">
                        {variant.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Quantity</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-semibold">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{product.stock} items available</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              className="w-full"
              size="lg"
              onClick={handleAddToCart}
              disabled={product.stock === 0 || isAddingToCart}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {product.stock === 0 ? "Out of Stock" : isAddingToCart ? "Adding to Cart..." : "Add to Cart"}
            </Button>

            <Button variant="outline" className="w-full" size="lg" onClick={() => setIsWishlisted(!isWishlisted)}>
              <Heart className={`mr-2 h-5 w-5 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
              {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            </Button>
          </div>

          {/* Features */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold">Free Shipping</p>
                    <p className="text-sm text-muted-foreground">On orders over $50</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-semibold">Secure Payment</p>
                    <p className="text-sm text-muted-foreground">100% secure transactions</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <RotateCcw className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-semibold">Easy Returns</p>
                    <p className="text-sm text-muted-foreground">30-day return policy</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Description */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Product Description</h2>
        <div className="prose max-w-none">
          <p className="text-muted-foreground leading-relaxed">{product.description}</p>
        </div>
      </div>
    </div>
  )
}
