'use client'

import { createContext, useState, useEffect, useContext, type ReactNode } from 'react'
import storage from '../utils/storage'
import authAPI from '../services/auth'
import userAPI from '../services/user'
import type { User, AuthResponse, ApiError } from '../types/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  isLoggedIn: boolean
  login: (identifier: string, password: string) => Promise<AuthResponse>
  register: (userData: FormData) => Promise<AuthResponse>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      setLoading(true)
      const token = await storage.getItem('auth_token')
      const userData = await storage.getItem('user_data')

      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }

      if (userData) {
        setUser(JSON.parse(userData))
      }

      try {
        const freshUserData = await userAPI.getProfile()
        setUser(freshUserData)
        await storage.setItem('user_data', JSON.stringify(freshUserData))
      } catch (error) {
        const apiError = error as ApiError
        console.error('Failed server verification:', apiError?.response?.status)
      }
    } catch (error) {
      console.error('Failed to load user', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (identifier: string, password: string) => {
    const response = await authAPI.login({ email: identifier, password })

    if (response && response.user && response.access_token) {
      await storage.setItem('auth_token', response.access_token)
      await storage.setItem('user_data', JSON.stringify(response.user))
      setUser(response.user)
      return response
    } else {
      throw new Error('Invalid response from server')
    }
  }

  const register = async (userData: FormData) => {
    try {
      const response = await authAPI.register(userData)

      if (response && response.user && response.access_token) {
        await storage.setItem('auth_token', response.access_token)
        await storage.setItem('user_data', JSON.stringify(response.user))
        setUser(response.user)
        return response
      } else {
        throw new Error('Invalid registration response')
      }
    } catch (error) {
      console.error('Registration failed', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('API logout failed', error)
    } finally {
      await storage.removeItem('auth_token')
      await storage.removeItem('user_data')
      setUser(null)
    }
  }

  const refreshUser = async () => {
    try {
      const userData = await userAPI.getProfile()
      setUser(userData)
      await storage.setItem('user_data', JSON.stringify(userData))
    } catch (error) {
      console.error('Error refreshing user data:', error)
    }
  }


  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        isLoggedIn: !!user,
        loading,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}