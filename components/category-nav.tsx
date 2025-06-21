"use client"

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const categories = [
  { id: "all", name: "All", icon: "🛍️" },
  { id: "electronics", name: "Electronics", icon: "📱" },
  { id: "clothing", name: "Clothing", icon: "👕" },
  { id: "home", name: "Home & Garden", icon: "🏠" },
  { id: "sports", name: "Sports", icon: "⚽" },
  { id: "books", name: "Books", icon: "📚" },
  { id: "beauty", name: "Beauty", icon: "💄" },
]

export function CategoryNav() {
  const [activeCategory, setActiveCategory] = useState("all")

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-16 z-40">
      <div className="container mx-auto px-4 py-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex space-x-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "ghost"}
                size="sm"
                className="flex-shrink-0"
                onClick={() => setActiveCategory(category.id)}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  )
}
