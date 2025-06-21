import { 
  Product, 
  ProductsResponse, 
  CartResponse, 
  AuthResponse, 
  User, 
  Order,
  Address,
  Category,
  Review,
  WishlistItem,
  SearchResponse
} from '@/types/api'

// API Client Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
    
    // Get token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // Add auth header if token exists
    if (this.token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.token}`,
      }
    }

    // Add session ID for guest users
    if (!this.token && typeof window !== 'undefined') {
      const sessionId = this.getGuestSessionId()
      config.headers = {
        ...config.headers,
        'x-session-id': sessionId,
      }
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  private getGuestSessionId(): string {
    if (typeof window === 'undefined') return 'ssr-session'
    
    let sessionId = localStorage.getItem('guest_session_id')
    if (!sessionId) {
      sessionId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('guest_session_id', sessionId)
    }
    return sessionId
  }

  setToken(token: string | null) {
    this.token = token
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token)
      } else {
        localStorage.removeItem('auth_token')
      }
    }
  }

  // Auth Methods
  async register(data: {
    email: string
    password: string
    firstName?: string
    lastName?: string
    phone?: string
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/user/profile')
  }

  async updateProfile(data: Partial<User> & { 
    currentPassword?: string 
    newPassword?: string 
  }): Promise<{ message: string; user: User }> {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Product Methods
  async getProducts(params?: {
    category?: string
    featured?: boolean
    limit?: number
    search?: string
    sort?: string
    order?: string
    page?: number
    pageSize?: number
  }): Promise<ProductsResponse> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const query = searchParams.toString()
    return this.request<ProductsResponse>(`/products${query ? `?${query}` : ''}`)
  }

  async getProduct(slug: string): Promise<Product> {
    return this.request<Product>(`/products/${slug}`)
  }

  async searchProducts(params: {
    q: string
    category?: string
    brand?: string
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
    sort?: string
    page?: number
    limit?: number
  }): Promise<SearchResponse> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    return this.request<SearchResponse>(`/search?${searchParams.toString()}`)
  }

  // Cart Methods
  async getCart(): Promise<CartResponse> {
    const params = new URLSearchParams()
    if (!this.token) {
      params.append('guestSessionId', this.getGuestSessionId())
    }
    
    return this.request<CartResponse>(`/cart${params.toString() ? `?${params.toString()}` : ''}`)
  }

  async addToCart(data: {
    productId: string
    variantId?: string
    quantity?: number
  }): Promise<{ message: string }> {
    return this.request('/cart', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCartItem(itemId: string, quantity: number): Promise<{ message: string }> {
    return this.request('/cart', {
      method: 'PUT',
      body: JSON.stringify({ itemId, quantity }),
    })
  }

  async removeFromCart(itemId: string): Promise<{ message: string }> {
    return this.request(`/cart?itemId=${itemId}`, {
      method: 'DELETE',
    })
  }

  // Order Methods
  async getOrders(params?: {
    status?: string
    page?: number
    limit?: number
  }): Promise<{ orders: Order[]; pagination: any }> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    if (!this.token) {
      searchParams.append('guestSessionId', this.getGuestSessionId())
    }

    const query = searchParams.toString()
    return this.request(`/orders${query ? `?${query}` : ''}`)
  }

  async createOrder(data: {
    customerEmail: string
    customerPhone?: string
    shippingAddress?: any
    billingAddress?: any
    paymentMethod?: string
    customerNotes?: string
    cartItems: string[]
  }): Promise<{ message: string; order: Partial<Order> }> {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Address Methods
  async getAddresses(): Promise<{ addresses: Address[]; total: number }> {
    return this.request('/user/addresses')
  }

  async createAddress(data: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ message: string; address: Address }> {
    return this.request('/user/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateAddress(id: string, data: Partial<Address>): Promise<{ message: string; address: Address }> {
    return this.request(`/user/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteAddress(id: string): Promise<{ message: string }> {
    return this.request(`/user/addresses/${id}`, {
      method: 'DELETE',
    })
  }

  // Category Methods
  async getCategories(params?: {
    includeProducts?: boolean
    parentId?: string
  }): Promise<{ categories: Category[]; total: number }> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const query = searchParams.toString()
    return this.request(`/categories${query ? `?${query}` : ''}`)
  }

  // Wishlist Methods
  async getWishlist(): Promise<{ items: WishlistItem[]; total: number }> {
    return this.request('/wishlist')
  }

  async addToWishlist(productId: string): Promise<{ message: string }> {
    return this.request('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    })
  }

  async removeFromWishlist(productId: string): Promise<{ message: string }> {
    return this.request(`/wishlist?productId=${productId}`, {
      method: 'DELETE',
    })
  }

  // Review Methods
  async getProductReviews(slug: string, params?: {
    page?: number
    limit?: number
    rating?: number
  }): Promise<{
    reviews: Review[]
    pagination: any
    stats: {
      averageRating: number
      totalReviews: number
      ratingBreakdown: Array<{ rating: number; count: number }>
    }
  }> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const query = searchParams.toString()
    return this.request(`/products/${slug}/reviews${query ? `?${query}` : ''}`)
  }

  async addProductReview(slug: string, data: {
    rating: number
    title?: string
    comment?: string
  }): Promise<{ message: string; review: Review }> {
    return this.request(`/products/${slug}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

// Create singleton instance
export const apiClient = new ApiClient()

// Export for use in components
export default apiClient