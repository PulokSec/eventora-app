"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Edit, Trash2, Search, Plus, Eye, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
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

interface UserEvent {
  _id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  category: string
  status: "active" | "cancelled" | "completed" | "pending"
  subscriberCount: number
  banner?: string
  createdAt: string
}

export function UserEventsList() {
  const [events, setEvents] = useState<UserEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<UserEvent[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchUserEvents()
  }, [])

  useEffect(() => {
    filterEvents()
  }, [events, searchQuery])

  const fetchUserEvents = async () => {
    try {
      const response = await fetch("/api/user/events")
      const data = await response.json()

      if (data.success) {
        setEvents(data.events)
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load your events",
        variant: "destructive",
      })
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
          event.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredEvents(filtered)
  }

  const deleteEvent = async (eventId: string) => {
    setDeletingEventId(eventId)
    try {
      const response = await fetch(`/api/user/events/${eventId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setEvents(events.filter((event) => event._id !== eventId))
        toast({
          title: "Success",
          description: `Event deleted successfully. ${data.data.subscribersNotified} subscribers were notified.`,
        })
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      })
    } finally {
      setDeletingEventId(null)
    }
  }

  const getStatusBadge = (status: UserEvent["status"]) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Active" },
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Pending Review" },
      completed: { color: "bg-blue-100 text-blue-800", icon: CheckCircle, label: "Completed" },
      cancelled: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Cancelled" },
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      technology: "bg-blue-100 text-blue-800",
      business: "bg-green-100 text-green-800",
      arts: "bg-purple-100 text-purple-800",
      sports: "bg-orange-100 text-orange-800",
      music: "bg-pink-100 text-pink-800",
      education: "bg-indigo-100 text-indigo-800",
      food: "bg-yellow-100 text-yellow-800",
      other: "bg-gray-100 text-gray-800",
    }
    return colors[category as keyof typeof colors] || colors.other
  }

  const canEditEvent = (event: UserEvent) => {
    // Can edit if event is pending, active, or cancelled (to resubmit)
    return ["pending", "active", "cancelled"].includes(event.status)
  }

  const canDeleteEvent = (event: UserEvent) => {
    // Can delete any event that's not completed
    return event.status !== "completed"
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
            <Link href="/events/create">
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
              <Card key={event._id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <div className="relative">
                  <img
                    src={event.banner || "/placeholder.svg?height=200&width=400"}
                    alt={event.title}
                    className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    {getStatusBadge(event.status)}
                    <Badge className={getCategoryColor(event.category)}>
                      {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{event.title}</h3>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">{event.description}</p>

                  <div className="space-y-2 text-sm text-slate-500 mb-4">
                    <div className="flex items-center gap-2">
                      📅 <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      🕒 <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      📍 <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      👥 <span>{event.subscriberCount} subscribers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      📅 <span>Created {new Date(event.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Status-specific messages */}
                  {event.status === "pending" && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">Pending Review</span>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">Your event is being reviewed by administrators</p>
                    </div>
                  )}

                  {event.status === "cancelled" && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-800">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Event Cancelled</span>
                      </div>
                      <p className="text-xs text-red-700 mt-1">You can edit and resubmit this event</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" asChild>
                      <Link href={`/events/${event._id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Link>
                    </Button>

                    {canEditEvent(event) && (
                      <Button size="sm" variant="outline" className="flex-1" asChild>
                        <Link href={`/events/${event._id}/edit`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Link>
                      </Button>
                    )}

                    {canDeleteEvent(event) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 border-red-200"
                            disabled={deletingEventId === event._id}
                          >
                            {deletingEventId === event._id ? (
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                              Delete Event
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{event.title}"? This action cannot be undone.
                              {event.subscriberCount > 0 && (
                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                  <strong>Warning:</strong> {event.subscriberCount} subscriber(s) will be notified about
                                  the cancellation.
                                </div>
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
                    )}
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
            <h3 className="text-lg font-medium text-slate-900 mb-2">No events yet</h3>
            <p className="text-slate-500 mb-6">Create your first event to get started</p>
            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Link href="/events/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Event
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
