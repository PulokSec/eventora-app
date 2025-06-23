"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Users,
  Plus,
  ArrowUpDown,
  RefreshCw,
  Download,
  FileText,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface Event {
  _id: string
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  category: string
  status: "active" | "cancelled" | "completed" | "pending"
  banner?: string
  subscriberCount: number
  isUpcoming: boolean
  createdAt: string
  updatedAt: string
  creator: {
    _id: string
    name: string
    email: string
    role: string
  }
}


export function AdminEventsList() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })
  const { toast } = useToast()

  useEffect(() => {
    fetchEvents()
  }, [statusFilter, categoryFilter, sortBy, sortOrder, pagination.page])

  useEffect(() => {
    filterEvents()
  }, [events, searchQuery])

  const fetchEvents = async () => {
    try {
      setIsRefreshing(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: statusFilter,
        category: categoryFilter,
        sortBy,
        sortOrder,
        ...(searchQuery && { search: searchQuery }),
      })

      const response = await fetch(`/api/events?${params}`)
      const data = await response.json()

      if (data.success) {
        setEvents(data.events)
        setPagination(data.pagination)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch events",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const filterEvents = () => {
    let filtered = events

    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredEvents(filtered)
  }

  const updateEventStatus = async (eventId: string, newStatus: Event["status"]) => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (data.success) {
        setEvents(events.map((event) => (event._id === eventId ? { ...event, status: newStatus } : event)))
        filterEvents()
        toast({
          title: "Success",
          description: `Event status updated to ${newStatus}. ${data.data?.notificationsCreated || 0} subscribers notified.`,
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update event status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to update event status:", error)
      toast({
        title: "Error",
        description: "Failed to update event status",
        variant: "destructive",
      })
    }
  }

  const bulkUpdateStatus = async (newStatus: Event["status"]) => {
    if (selectedEvents.length === 0) return

    try {
      const response = await fetch(`/api/admin/events/bulk-update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventIds: selectedEvents, status: newStatus }),
      })

      const data = await response.json()

      if (data.success) {
        setEvents(events.map((event) => (selectedEvents.includes(event._id) ? { ...event, status: newStatus } : event)))
        filterEvents()
        setSelectedEvents([])
        toast({
          title: "Success",
          description: `${selectedEvents.length} events updated to ${newStatus}`,
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update events",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to bulk update events:", error)
      toast({
        title: "Error",
        description: "Failed to update events",
        variant: "destructive",
      })
    }
  }

  const deleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setEvents(events.filter((event) => event._id !== eventId))
        filterEvents()
        toast({
          title: "Success",
          description: data.message || "Event deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete event",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to delete event:", error)
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      })
    }
  }

  const exportEvents = async () => {
    try {
      const response = await fetch(
        `/api/admin/events/export?${new URLSearchParams({
          status: statusFilter,
          category: categoryFilter,
        })}`,
      )

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `events-export-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Success",
          description: "Events exported successfully",
        })
      } else {
        throw new Error("Export failed")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export events",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: Event["status"]) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
      pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
      completed: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: CheckCircle },
      cancelled: { color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <Badge className={`${config.color} flex items-center gap-1 border`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      technology: "bg-blue-50 text-blue-700",
      business: "bg-green-50 text-green-700",
      arts: "bg-purple-50 text-purple-700",
      sports: "bg-orange-50 text-orange-700",
      music: "bg-pink-50 text-pink-700",
      education: "bg-indigo-50 text-indigo-700",
      food: "bg-yellow-50 text-yellow-700",
      health: "bg-teal-50 text-teal-700",
      other: "bg-gray-50 text-gray-700",
    }
    return colors[category as keyof typeof colors] || colors.other
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  const toggleEventSelection = (eventId: string) => {
    setSelectedEvents((prev) => (prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]))
  }

  const toggleSelectAll = () => {
    setSelectedEvents(selectedEvents.length === filteredEvents.length ? [] : filteredEvents.map((event) => event._id))
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Events Management</CardTitle>
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

  console.log(filteredEvents);

  return (
    <div className="space-y-6">

      {/* Main Events Management Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Events Management
              </CardTitle>
              <CardDescription>Manage all events across the platform</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportEvents}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={fetchEvents} disabled={isRefreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Link href="/admin/events/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters and Bulk Actions */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search events, creators, or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="arts">Arts & Culture</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="food">Food & Drink</SelectItem>
                  <SelectItem value="health">Health & Wellness</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            {selectedEvents.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-blue-800">{selectedEvents.length} event(s) selected</span>
                <div className="flex gap-2 ml-auto">
                  <Button
                    size="sm"
                    onClick={() => bulkUpdateStatus("active")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve All
                  </Button>
                  <Button size="sm" onClick={() => bulkUpdateStatus("cancelled")} variant="destructive">
                    Cancel All
                  </Button>
                  <Button size="sm" onClick={() => setSelectedEvents([])} variant="outline">
                    Clear Selection
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Events Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedEvents.length === filteredEvents.length && filteredEvents.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("title")}
                      className="h-auto p-0 font-semibold"
                    >
                      Event
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("date")}
                      className="h-auto p-0 font-semibold"
                    >
                      Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("subscriberCount")}
                      className="h-auto p-0 font-semibold"
                    >
                      Subscribers
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("createdAt")}
                      className="h-auto p-0 font-semibold"
                    >
                      Created
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id} className="hover:bg-slate-50">
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(event._id)}
                        onChange={() => toggleEventSelection(event._id)}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-slate-900">{event.title}</div>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${getCategoryColor(event.category)}`}>{event.category}</Badge>
                          {event.isUpcoming && (
                            <Badge variant="outline" className="text-xs">
                              Upcoming
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{event.location}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{event.creator.name}</div>
                        <div className="text-xs text-slate-500">{event.creator.email}</div>
                        <Badge variant="outline" className="text-xs">
                          {event.creator.role}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{new Date(event.date).toLocaleDateString()}</div>
                        <div className="text-sm text-slate-500">{event.time}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(event.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">{event.subscriberCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-500">{new Date(event.createdAt).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link href={`/events/${event.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/events/${event.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Event
                            </Link>
                          </DropdownMenuItem>
                          {event.status !== "active" && (
                            <DropdownMenuItem onClick={() => updateEventStatus(event.id, "active")}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              Approve Event
                            </DropdownMenuItem>
                          )}
                          {event.status !== "cancelled" && (
                            <DropdownMenuItem onClick={() => updateEventStatus(event.id, "cancelled")}>
                              <XCircle className="mr-2 h-4 w-4 text-red-600" />
                              Cancel Event
                            </DropdownMenuItem>
                          )}
                          {event.status !== "completed" && new Date(event.date) < new Date() && (
                            <DropdownMenuItem onClick={() => updateEventStatus(event.id, "completed")}>
                              <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                              Mark Completed
                            </DropdownMenuItem>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Event
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Event</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{event.title}"? This action cannot be undone.
                                  {event.subscriberCount > 0 && (
                                    <span className="block mt-2 text-red-600 font-medium">
                                      Warning: This event has {event.subscriberCount} subscribers who will be notified.
                                    </span>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteEvent(event._id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete Event
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium mb-2">No events found</p>
              <p>Try adjusting your search criteria or create a new event</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-slate-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} events
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
