"use client"

import { Calendar } from "@/components/ui/calendar"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Edit, Trash2, Search, Filter, MoreHorizontal, CheckCircle, XCircle, Clock } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Event {
  id: string
  title: string
  creator: string
  creatorEmail: string
  date: string
  status: "active" | "cancelled" | "completed" | "pending"
  subscribers: number
  category: string
}

export function AdminEventsList() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    filterEvents()
  }, [events, searchQuery, statusFilter])

  const fetchEvents = async () => {
    try {
      // Dummy data for admin events list
      const dummyEvents: Event[] = [
        {
          id: "1",
          title: "Tech Conference 2024",
          creator: "John Doe",
          creatorEmail: "john@example.com",
          date: "2024-03-15",
          status: "active",
          subscribers: 45,
          category: "technology",
        },
        {
          id: "2",
          title: "Art Gallery Opening",
          creator: "Jane Smith",
          creatorEmail: "jane@example.com",
          date: "2024-03-20",
          status: "pending",
          subscribers: 23,
          category: "arts",
        },
        {
          id: "3",
          title: "Business Networking",
          creator: "Mike Johnson",
          creatorEmail: "mike@example.com",
          date: "2024-02-10",
          status: "completed",
          subscribers: 67,
          category: "business",
        },
        {
          id: "4",
          title: "Music Festival",
          creator: "Sarah Wilson",
          creatorEmail: "sarah@example.com",
          date: "2024-04-01",
          status: "cancelled",
          subscribers: 12,
          category: "music",
        },
      ]

      setEvents(dummyEvents)
    } catch (error) {
      console.error("Failed to fetch events:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterEvents = () => {
    let filtered = events

    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.creator.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((event) => event.status === statusFilter)
    }

    setFilteredEvents(filtered)
  }

  const updateEventStatus = async (eventId: string, newStatus: Event["status"]) => {
    try {
      await fetch(`/api/admin/events/${eventId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      setEvents(events.map((event) => (event.id === eventId ? { ...event, status: newStatus } : event)))
    } catch (error) {
      console.error("Failed to update event status:", error)
    }
  }

  const deleteEvent = async (eventId: string) => {
    try {
      await fetch(`/api/admin/events/${eventId}`, {
        method: "DELETE",
      })

      setEvents(events.filter((event) => event.id !== eventId))
    } catch (error) {
      console.error("Failed to delete event:", error)
    }
  }

  const getStatusBadge = (status: Event["status"]) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      completed: { color: "bg-blue-100 text-blue-800", icon: CheckCircle },
      cancelled: { color: "bg-red-100 text-red-800", icon: XCircle },
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Events Management</CardTitle>
        <CardDescription>Manage all events across the platform</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search events or creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
        </div>

        {/* Events Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subscribers</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-slate-500 capitalize">{event.category}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{event.creator}</div>
                      <div className="text-sm text-slate-500">{event.creatorEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(event.status)}</TableCell>
                  <TableCell>{event.subscribers}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Event
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateEventStatus(event.id, "active")}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark Active
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateEventStatus(event.id, "cancelled")}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel Event
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteEvent(event.id)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Event
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No events found matching your criteria</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
