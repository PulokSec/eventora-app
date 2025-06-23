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
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current user
        const userResponse = await fetch("/api/auth/me")
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setCurrentUser(userData.user)
        }

        // Fetch events with creator information
        const eventsResponse = await fetch("/api/events")
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json()
          setEvents(eventsData.events || [])
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSubscribe = async (eventId: string) => {
    if (!currentUser) return

    try {
      const event = events.find((e) => e.id === eventId)
      const isCurrentlySubscribed = event?.isSubscribed

      const response = await fetch(`/api/events/${eventId}/subscribe`, {
        method: isCurrentlySubscribed ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        setEvents(
          events.map((event) => (event.id === eventId ? { ...event, isSubscribed: !event.isSubscribed } : event)),
        )
      }
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
        {currentUser && (
          <Button
            asChild
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Link href="/events/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            currentUser={currentUser}
            onSubscribe={() => handleSubscribe(event.id)}
          />
        ))}
      </div>
    </div>
  )
}
