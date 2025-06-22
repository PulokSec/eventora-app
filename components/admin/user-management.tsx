"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MoreHorizontal, UserCheck, UserX, Shield } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface AdminUser {
  id: string
  name: string
  email: string
  role: "admin" | "user"
  status: "active" | "suspended"
  eventsCreated: number
  eventsSubscribed: number
  joinedDate: string
  avatar?: string
}

export function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchQuery])

  const fetchUsers = async () => {
    try {
      // Dummy data for users
      const dummyUsers: AdminUser[] = [
        {
          id: "1",
          name: "John Doe",
          email: "john@example.com",
          role: "admin",
          status: "active",
          eventsCreated: 5,
          eventsSubscribed: 12,
          joinedDate: "2023-01-15",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        {
          id: "2",
          name: "Jane Smith",
          email: "jane@example.com",
          role: "user",
          status: "active",
          eventsCreated: 3,
          eventsSubscribed: 8,
          joinedDate: "2023-02-20",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        {
          id: "3",
          name: "Mike Johnson",
          email: "mike@example.com",
          role: "user",
          status: "active",
          eventsCreated: 7,
          eventsSubscribed: 15,
          joinedDate: "2023-03-10",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        {
          id: "4",
          name: "Sarah Wilson",
          email: "sarah@example.com",
          role: "user",
          status: "suspended",
          eventsCreated: 1,
          eventsSubscribed: 3,
          joinedDate: "2023-04-05",
          avatar: "/placeholder.svg?height=40&width=40",
        },
      ]

      setUsers(dummyUsers)
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredUsers(filtered)
  }

  const updateUserStatus = async (userId: string, newStatus: AdminUser["status"]) => {
    try {
      await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      setUsers(users.map((user) => (user.id === userId ? { ...user, status: newStatus } : user)))
    } catch (error) {
      console.error("Failed to update user status:", error)
    }
  }

  const updateUserRole = async (userId: string, newRole: AdminUser["role"]) => {
    try {
      await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })

      setUsers(users.map((user) => (user.id === userId ? { ...user, role: newRole } : user)))
    } catch (error) {
      console.error("Failed to update user role:", error)
    }
  }

  const getRoleBadge = (role: AdminUser["role"]) => {
    return role === "admin" ? (
      <Badge className="bg-purple-100 text-purple-800">
        <Shield className="w-3 h-3 mr-1" />
        Admin
      </Badge>
    ) : (
      <Badge className="bg-blue-100 text-blue-800">
        {/* User Icon Placeholder */}
        <div className="w-3 h-3 mr-1 bg-blue-300 rounded-full"></div>
        User
      </Badge>
    )
  }

  const getStatusBadge = (status: AdminUser["status"]) => {
    return status === "active" ? (
      <Badge className="bg-green-100 text-green-800">
        <UserCheck className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <UserX className="w-3 h-3 mr-1" />
        Suspended
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Manage all users and their permissions</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Events Created</TableHead>
                <TableHead>Subscriptions</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>{user.eventsCreated}</TableCell>
                  <TableCell>{user.eventsSubscribed}</TableCell>
                  <TableCell>{new Date(user.joinedDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>View Events</DropdownMenuItem>
                        {user.role === "user" && (
                          <DropdownMenuItem onClick={() => updateUserRole(user.id, "admin")}>
                            <Shield className="mr-2 h-4 w-4" />
                            Make Admin
                          </DropdownMenuItem>
                        )}
                        {user.role === "admin" && (
                          <DropdownMenuItem onClick={() => updateUserRole(user.id, "user")}>
                            {/* User Icon Placeholder */}
                            <div className="mr-2 h-4 w-4 bg-blue-300 rounded-full"></div>
                            Remove Admin
                          </DropdownMenuItem>
                        )}
                        {user.status === "active" ? (
                          <DropdownMenuItem
                            onClick={() => updateUserStatus(user.id, "suspended")}
                            className="text-red-600"
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Suspend User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => updateUserStatus(user.id, "active")}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Activate User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            {/* User Icon Placeholder */}
            <div className="w-12 h-12 mx-auto mb-4 bg-blue-300 rounded-full"></div>
            <p>No users found matching your criteria</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
