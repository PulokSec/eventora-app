"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { User } from "./auth"


type AuthContextType = {
  user: User | null
  loading: boolean
  signout: () => Promise<void>
  checkAuth: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check if user is authenticated on initial load
  useEffect(() => {
    checkAuth()
  }, [])

  // Function to check authentication status
  const checkAuth = async (): Promise<boolean> => {
    try {
      // First check localStorage for token
      const token = localStorage.getItem("event_auth_token")
      // Fetch current user data
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      })
      if (!response.ok) {
        setUser(null)
        setLoading(false)
        return false
      }
      
      const data = await response.json()
      console.log(data)
      setUser(data.user)
      setLoading(false)
      return true
    } catch (error) {
      console.error("Error checking authentication:", error)
      setUser(null)
      setLoading(false)
      return false
    }
  }


  // Sign out function
  const signout = async (): Promise<void> => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      })

      // Clear localStorage
      localStorage.removeItem("event_auth_token")

      setUser(null)
    } catch (error) {
      console.error("Error during signout:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
