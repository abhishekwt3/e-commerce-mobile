"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@/types/api'
// Update the import path if '@/lib/api-client' does not exist
import apiClient from '../lib/api-client'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    email: string
    password: string
    firstName?: string
    lastName?: string
    phone?: string
  }) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user && !!token

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      setIsLoading(true)
      
      // Check for stored token
      const storedToken = localStorage.getItem('auth_token')
      
      if (storedToken) {
        apiClient.setToken(storedToken)
        setToken(storedToken)
        
        // Verify token by fetching user profile
        try {
          const userData = await apiClient.getProfile()
          setUser(userData)
        } catch (error) {
          console.error('Token verification failed:', error)
          // Token is invalid, clear it
          localStorage.removeItem('auth_token')
          apiClient.setToken(null)
          setToken(null)
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password)
      
      setUser(response.user)
      setToken(response.token)
      apiClient.setToken(response.token)
      
      // Store token in localStorage
      localStorage.setItem('auth_token', response.token)
      
      // Clear guest session since user is now authenticated
      localStorage.removeItem('guest_session_id')
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const register = async (data: {
    email: string
    password: string
    firstName?: string
    lastName?: string
    phone?: string
  }) => {
    try {
      const response = await apiClient.register(data)
      
      setUser(response.user)
      setToken(response.token)
      apiClient.setToken(response.token)
      
      // Store token in localStorage
      localStorage.setItem('auth_token', response.token)
      
      // Clear guest session since user is now authenticated
      localStorage.removeItem('guest_session_id')
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    apiClient.setToken(null)
    
    // Clear stored data
    localStorage.removeItem('auth_token')
    
    // Optionally redirect to home page
    window.location.href = '/'
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData })
    }
  }

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for protecting routes
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/auth/login'
    }
  }, [isAuthenticated, isLoading])
  
  return { isAuthenticated, isLoading }
}