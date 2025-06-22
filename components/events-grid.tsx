"use client"

import { useState, useEffect } from "react"
import { EventCard } from "./event-card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  category: string
  banner?: string
  isSubscribed?: boolean
}

export function EventsGrid() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events")
        if (!res.ok) throw new Error("Failed to fetch events")
      const data = await res.json()
      setEvents(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Failed to fetch events:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const handleSubscribe = async (eventId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) throw new Error("Failed to toggle subscription")

      // Optionally, get updated event from response
      // const updatedEvent = await res.json()
      // setEvents(events.map((event) => (event.id === eventId ? updatedEvent : event)))

      // Or just toggle locally
      setEvents(events.map((event) => (event.id === eventId ? { ...event, isSubscribed: !event.isSubscribed } : event)))
    } catch (error) {
      console.error("Failed to toggle subscription:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
            <div className="bg-slate-200 h-48 rounded-lg mb-4"></div>
            <div className="bg-slate-200 h-4 rounded mb-2"></div>
            <div className="bg-slate-200 h-4 rounded w-3/4 mb-4"></div>
            <div className="bg-slate-200 h-8 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Upcoming Events</h2>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(events) && events?.map((event) => (
          <EventCard key={event.id} event={event} onSubscribe={() => handleSubscribe(event.id)} />
        ))}
      </div>
    </div>
  )
}
