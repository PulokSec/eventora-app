"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Edit, Trash2, Search, Plus, Eye, CheckCircle, XCircle, Clock } from "lucide-react"
import Link from "next/link"

interface UserEvent {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  category: string
  status: "active" | "cancelled" | "completed" | "pending"
  subscribers: number
  banner?: string
}

export function UserEventsList() {
  const [events, setEvents] = useState<UserEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<UserEvent[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUserEvents()
  }, [])

  useEffect(() => {
    filterEvents()
  }, [events, searchQuery])

  const fetchUserEvents = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/user/events")
      if (!res.ok) throw new Error("Failed to fetch user events")
      const data = await res.json()
      setEvents(data.events || [])
    } catch (error: any) {
      setError(error.message || "Failed to fetch user events")
      setEvents([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterEvents = () => {
    let filtered = events
    if (searchQuery) {
      filtered = filtered.filter((event) => event.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }
    setFilteredEvents(filtered)
  }

  const deleteEvent = async (eventId: string) => {
    try {
      const res = await fetch(`/api/user/events/${eventId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete event")
      setEvents(events.filter((event) => event.id !== eventId))
    } catch (error) {
      // Optionally show error to user
      console.error("Failed to delete event:", error)
    }
  }

  const getStatusBadge = (status: UserEvent["status"]) => {
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
          <CardTitle>My Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-slate-200 rounded-xl h-64 animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600 py-12">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>My Events</CardTitle>
            <CardDescription>Events you have created and manage</CardDescription>
          </div>
          <Button
            asChild
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Link href="/user/events/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search your events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <div className="relative">
                  <img
                    src={event.banner || "/placeholder.svg?height=200&width=400"}
                    alt={event.title}
                    className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">{getStatusBadge(event.status)}</div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{event.title}</h3>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">{event.description}</p>

                  <div className="space-y-2 text-sm text-slate-500 mb-4">
                    <div>📅 {new Date(event.date).toLocaleDateString()}</div>
                    <div>🕒 {event.time}</div>
                    <div>📍 {event.location}</div>
                    <div>👥 {event.subscribers} subscribers</div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => deleteEvent(event.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No events found</h3>
            <p className="text-slate-500 mb-6">
              {searchQuery
                ? "No events match your search."
                : "Create your first event to get started"}
            </p>
            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Link href="/user/events/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
