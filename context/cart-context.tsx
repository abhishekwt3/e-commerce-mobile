"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { CartItem, CartResponse } from '@/types/api'
import apiClient from '@/lib/api-client'
import { useAuth } from './auth-context'
import { toast } from 'sonner'

interface CartContextType {
  items: CartItem[]
  isLoading: boolean
  totalItems: number
  subtotal: number
  itemCount: number
  addToCart: (productId: string, variantId?: string, quantity?: number) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  clearCart: () => void
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [subtotal, setSubtotal] = useState(0)
  const [itemCount, setItemCount] = useState(0)
  
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    refreshCart()
  }, [isAuthenticated])

  const refreshCart = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getCart()
      
      setItems(response.items)
      setTotalItems(response.summary.totalItems)
      setSubtotal(response.summary.subtotal)
      setItemCount(response.summary.itemCount)
    } catch (error) {
      console.error('Failed to fetch cart:', error)
      // Don't show error toast for cart fetch failures, as it might be expected for new users
    } finally {
      setIsLoading(false)
    }
  }

  const addToCart = async (productId: string, variantId?: string, quantity: number = 1) => {
    try {
      await apiClient.addToCart({
        productId,
        variantId,
        quantity
      })
      
      // Refresh cart to get updated data
      await refreshCart()
      
      toast.success('Item added to cart')
    } catch (error: any) {
      console.error('Failed to add to cart:', error)
      toast.error(error.message || 'Failed to add item to cart')
      throw error
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      await apiClient.updateCartItem(itemId, quantity)
      
      // Refresh cart to get updated data
      await refreshCart()
      
      if (quantity === 0) {
        toast.success('Item removed from cart')
      } else {
        toast.success('Cart updated')
      }
    } catch (error: any) {
      console.error('Failed to update cart:', error)
      toast.error(error.message || 'Failed to update cart')
      throw error
    }
  }

  const removeFromCart = async (itemId: string) => {
    try {
      await apiClient.removeFromCart(itemId)
      
      // Refresh cart to get updated data
      await refreshCart()
      
      toast.success('Item removed from cart')
    } catch (error: any) {
      console.error('Failed to remove from cart:', error)
      toast.error(error.message || 'Failed to remove item from cart')
      throw error
    }
  }

  const clearCart = () => {
    setItems([])
    setTotalItems(0)
    setSubtotal(0)
    setItemCount(0)
  }

  const value: CartContextType = {
    items,
    isLoading,
    totalItems,
    subtotal,
    itemCount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}