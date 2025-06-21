// API Response Types
export interface ApiResponse<T> {
  success?: boolean
  message?: string
  error?: string
  data?: T
}

// Product Types
export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  shortDescription?: string
  basePrice: number
  salePrice?: number | null
  sku?: string
  stock: number
  images: ProductImage[]
  category: {
    id: string
    name: string
    slug: string
  }
  brand?: {
    id: string
    name: string
    slug: string
  } | null
  isActive: boolean
  isFeatured: boolean
  variants?: ProductVariant[]
  averageRating: number
  reviewCount: number
  createdAt: string
  updatedAt: string
}

export interface ProductImage {
  url: string
  altText?: string
  isMain: boolean
}

export interface ProductVariant {
  id: string
  name: string
  attributes?: string | object
  price?: number | null
  stock: number
}

export interface ProductsResponse {
  products: Product[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

// Cart Types
export interface CartItem {
  id: string
  productId: string
  variantId?: string | null
  quantity: number
  name: string
  slug: string
  price: number
  originalPrice: number
  image?: string
  variant?: {
    id: string
    name: string
    attributes: object
  } | null
  stock: number
  category?: string
  brand?: string
  createdAt: string
  updatedAt: string
}

export interface CartResponse {
  items: CartItem[]
  summary: {
    totalItems: number
    subtotal: number
    itemCount: number
  }
}

// User Types
export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  role: 'CUSTOMER' | 'ADMIN' | 'VENDOR'
  createdAt: string
  lastLogin?: string
}

export interface AuthResponse {
  message: string
  user: User
  token: string
}

// Order Types
export interface Order {
  id: string
  orderNumber: string
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'
  customerEmail: string
  customerPhone?: string
  subtotal: number
  taxAmount: number
  shippingCost: number
  discountAmount: number
  totalAmount: number
  paymentMethod?: string
  trackingNumber?: string
  customerNotes?: string
  items: OrderItem[]
  shippingAddress?: Address | object
  billingAddress?: Address | object
  createdAt: string
  updatedAt: string
  shippedAt?: string
  deliveredAt?: string
}

export interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  totalPrice: number
  productName: string
  productSku?: string
  variantName?: string
  product: {
    id: string
    name: string
    slug: string
    images: ProductImage[]
    category: string
    brand?: string
  }
  variant?: {
    id: string
    name: string
    attributes: object
  } | null
}

// Address Types
export interface Address {
  id: string
  type: 'SHIPPING' | 'BILLING' | 'BOTH'
  firstName: string
  lastName: string
  company?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// Category Types
export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  isActive: boolean
  parentId?: string
  parent?: Category | null
  children?: Category[]
  productCount?: number
  createdAt: string
  updatedAt: string
}

// Review Types
export interface Review {
  id: string
  rating: number
  title?: string
  comment?: string
  isVerifiedPurchase: boolean
  user: {
    name: string
  }
  createdAt: string
}

// Wishlist Types
export interface WishlistItem {
  id: string
  product: Product
  createdAt: string
}

// Search Types
export interface SearchResponse {
  products: Product[]
  suggestions: {
    categories: Array<{
      label: string
      value: string
      type: 'category'
    }>
    brands: Array<{
      label: string
      value: string
      type: 'brand'
    }>
  }
  filters: {
    query: string
    category?: string
    brand?: string
    minPrice?: string
    maxPrice?: string
    inStock?: string
    sort: string
  }
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}