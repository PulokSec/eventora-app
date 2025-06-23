"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, User, LogOut, Settings, Shield, Users, BarChart3 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface RoleBasedNavigationProps {
  userRole: "admin" | "user"
  userName: string
  userEmail: string
}

export function RoleBasedNavigation({ userRole, userName, userEmail }: RoleBasedNavigationProps) {
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      console.log("Logged out successfully")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const getDashboardLink = () => {
    return userRole === "admin" ? "/admin/dashboard" : "/user/dashboard"
  }

  const getCreateEventLink = () => {
    return userRole === "admin" ? "/admin/events/create" : "/user/events/create"
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href={getDashboardLink()} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">Eventora</span>
            {userRole === "admin" && (
              <Badge className="ml-2 bg-purple-100 text-purple-800">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </Badge>
            )}
          </Link>

          <div className="flex items-center gap-4">
            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href={getDashboardLink()}>Dashboard</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/">Browse Events</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href={getCreateEventLink()}>Create Event</Link>
              </Button>
              {userRole === "admin" && (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/admin/users">
                      <Users className="w-4 h-4 mr-2" />
                      Users
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/admin/analytics">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analytics
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      {userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{userName}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">{userEmail}</p>
                    {userRole === "admin" && (
                      <Badge className="w-fit bg-purple-100 text-purple-800 text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        Administrator
                      </Badge>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={getDashboardLink()} className="cursor-pointer">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={userRole === "admin" ? "/admin/profile" : "/user/profile"} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={userRole === "admin" ? "/admin/settings" : "/user/settings"} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}
