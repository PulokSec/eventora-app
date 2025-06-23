"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock, Heart, Edit, Trash2 } from "lucide-react"
import { useState } from "react"

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
  status?: string
}

interface EventCardProps {
  event: Event & {
    createdBy?: string
    creator?: {
      _id: string
      name: string
      email: string
    }
  }
  onSubscribe: () => void
  currentUser?: {
    _id: string
    role: string
    name: string
  }
}

export function EventCard({ event, onSubscribe, currentUser }: EventCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSubscribing, setIsSubscribing] = useState(false)

  // Check if current user is the creator of this event
  const isCreator = currentUser && (event.createdBy === currentUser._id || event.creator?._id === currentUser._id)

  // Check if current user is admin
  const isAdmin = currentUser?.role === "admin"

  // User can edit if they are the creator or admin
  const canEdit = isCreator || isAdmin

  // User can delete if they are the creator or admin
  const canDelete = isCreator || isAdmin

  // User can subscribe if they are NOT the creator and event is active
  const canSubscribe = currentUser && !isCreator && event.status === "active"

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      // Dummy API call
      await fetch(`/api/events/${event.id}`, {
        method: "DELETE",
      })
      console.log("Event deleted")
    } catch (error) {
      console.error("Failed to delete event:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSubscribe = async () => {
    if (!canSubscribe || isSubscribing) return

    setIsSubscribing(true)
    try {
      await onSubscribe()
    } finally {
      setIsSubscribing(false)
    }
  }

  const handleEdit = () => {
    if (canEdit) {
      window.location.href = `/events/${event.id}/edit`
    }
  }

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white overflow-hidden">
      <div className="relative">
        <img
          src={event.banner || "/placeholder.svg?height=200&width=400"}
          alt={event.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4">
          <Badge className={getCategoryColor(event.category)}>
            {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
          </Badge>
        </div>

        {/* Show edit/delete buttons only if user has permissions */}
        {currentUser && (canEdit || canDelete) && (
          <div className="absolute top-4 right-4 flex gap-2">
            {canEdit && (
              <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white" onClick={handleEdit}>
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/90 hover:bg-white text-red-600"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
          {event.title}
        </h3>
        <p className="text-slate-600 text-sm mb-4 line-clamp-2">{event.description}</p>

        {/* Show creator info if not the current user's event */}
        {!isCreator && event.creator && (
          <div className="mb-3 p-2 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500">Organized by</p>
            <p className="text-sm font-medium text-slate-700">{event.creator.name}</p>
          </div>
        )}

        <div className="space-y-2 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0">
        {/* Show different buttons based on user permissions */}
        {!currentUser ? (
          <Button disabled className="w-full h-10 bg-gray-300 text-gray-500">
            Login to Subscribe
          </Button>
        ) : isCreator ? (
          <div className="w-full flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-10 border-blue-200 text-blue-600 hover:bg-blue-50"
              onClick={() => (window.location.href = `/events/${event.id}`)}
            >
              View Details
            </Button>
            {canEdit && (
              <Button
                className="flex-1 h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                onClick={handleEdit}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Event
              </Button>
            )}
          </div>
        ) : canSubscribe ? (
          <Button
            onClick={handleSubscribe}
            disabled={isSubscribing}
            variant={event.isSubscribed ? "secondary" : "default"}
            className={`w-full h-10 ${
              event.isSubscribed
                ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            }`}
          >
            <Heart className={`w-4 h-4 mr-2 ${event.isSubscribed ? "fill-current" : ""}`} />
            {isSubscribing ? "Processing..." : event.isSubscribed ? "Unsubscribe" : "Subscribe"}
          </Button>
        ) : (
          <Button disabled className="w-full h-10 bg-gray-300 text-gray-500">
            {event.status !== "active" ? `Event ${event.status}` : "Cannot Subscribe"}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
