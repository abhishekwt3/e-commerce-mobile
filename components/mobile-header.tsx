"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Menu, Search, ShoppingCart, User, Heart, Package, Settings, LogOut } from "lucide-react"

export function MobileHeader() {
  const [cartCount] = useState(3)
  const [wishlistCount] = useState(2)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <div className="flex flex-col space-y-4 mt-8">
                <Link href="/profile" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted">
                  <User className="h-5 w-5" />
                  <span>My Account</span>
                </Link>
                <Link href="/orders" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted">
                  <Package className="h-5 w-5" />
                  <span>My Orders</span>
                </Link>
                <Link href="/wishlist" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted">
                  <Heart className="h-5 w-5" />
                  <span>Wishlist</span>
                  {wishlistCount > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {wishlistCount}
                    </Badge>
                  )}
                </Link>
                <Link href="/settings" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted">
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </Link>
                <Button variant="ghost" className="justify-start p-3 text-red-600 hover:text-red-700 hover:bg-red-50">
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="font-bold text-xl hidden sm:block">EcomMobile</span>
          </Link>

          {/* Search Bar - Hidden on mobile, shown on larger screens */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search products..." className="pl-10 pr-4" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Search Button - Mobile only */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="h-5 w-5" />
            </Button>

            {/* Wishlist */}
            <Link href="/wishlist">
              <Button variant="ghost" size="icon" className="relative">
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {wishlistCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Profile - Desktop only */}
            <Link href="/profile" className="hidden md:block">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
