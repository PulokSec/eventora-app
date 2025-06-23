"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Heart, Search, Calendar, MapPin, Clock, User } from "lucide-react"

interface SubscribedEvent {
  _id: string
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  category: string
  creator: string
  creatorEmail: string
  banner?: string
}

export function SubscribedEvents() {
  const [events, setEvents] = useState<SubscribedEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<SubscribedEvent[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSubscribedEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    filterEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, searchQuery])

  const fetchSubscribedEvents = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/user/subscriptions")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setEvents(data?.events || [])
    } catch (error) {
      setEvents([])
      console.error("Failed to fetch subscribed events:", error)
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
    setFilteredEvents(filtered)
  }

  const unsubscribeFromEvent = async (eventId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/subscribe`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to unsubscribe")
      setEvents(events.filter((event) => event.id !== eventId))
    filterEvents()
    } catch (error) {
      console.error("Failed to unsubscribe:", error)
    }
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscribed Events</CardTitle>
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
        <CardTitle>Subscribed Events</CardTitle>
        <CardDescription>Events you are subscribed to and will receive updates for</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search subscribed events..."
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
                  <div className="absolute top-4 left-4">
                    <Badge className={getCategoryColor(event.category)}>
                      {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">{event.description}</p>

                  <div className="space-y-2 text-sm text-slate-500 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>by {event.creator}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => unsubscribeFromEvent(event._id)}
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Heart className="w-4 h-4 mr-2 fill-current" />
                    Unsubscribe
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No subscribed events</h3>
            <p className="text-slate-500 mb-6">Subscribe to events to see them here</p>
            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <a href="/">Browse Events</a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
