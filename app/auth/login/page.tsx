"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter()
  const {user} = useAuth()
  
    useEffect(() => {
      if(user?.role){
      if(user?.role === 'admin'){
        router.push("/admin/dashboard")
      }
      else{
        router.push("/user/dashboard")
      }
    }
    }, [user])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      setIsAdmin(data?.user?.role === 'admin' ? true : false)
      localStorage?.setItem("event_auth_token", data?.token)
      if (!response.ok) {
        const errorData = await response.json()
        setErrorMsg(errorData.message || "Login failed")
        return
      }
      
    } catch (error) {
      setErrorMsg("Login failed: " + (error instanceof Error ? error.message : "Unknown error"))
      console.error("Login failed:", error)
    } finally {
      setIsLoading(false)
      isAdmin ? router.push("/admin/dashboard") : router.push("/user/dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Sign in to your account</CardTitle>
          <CardDescription className="mt-2 text-slate-600">Welcome back! Please enter your details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="h-12 pr-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8 p-0 text-slate-500"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            {errorMsg && (
              <div className="text-red-600 text-sm text-center">{errorMsg}</div>
            )}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-slate-600">
            {"Don't have an account? "}
            <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
