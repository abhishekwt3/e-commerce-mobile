import { Button } from "@/components/ui/button"
import { ShoppingBag, Truck, Shield, Headphones } from "lucide-react"

export function HeroSection() {
  return (
    <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Shop Smart, Shop Mobile</h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">Discover amazing products at unbeatable prices</p>
          <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
            <ShoppingBag className="mr-2 h-5 w-5" />
            Start Shopping
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
          <div className="text-center">
            <Truck className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Free Shipping</p>
          </div>
          <div className="text-center">
            <Shield className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Secure Payment</p>
          </div>
          <div className="text-center">
            <Headphones className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">24/7 Support</p>
          </div>
          <div className="text-center">
            <ShoppingBag className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Easy Returns</p>
          </div>
        </div>
      </div>
    </div>
  )
}
