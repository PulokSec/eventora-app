"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock, Heart, Edit, Trash2 } from "lucide-react"
import { useState } from "react"

interface Event {
  _id: string
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

interface EventCardProps {
  event: Event
  onSubscribe: () => void
  onDelete?: (id: string) => void
  onEdit?: (id: string) => void
}

export function EventCard({ event, onSubscribe, onDelete, onEdit }: EventCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

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
      const res = await fetch(`/api/events/${event._id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete event")
      onDelete?.(event.id)
    } catch (error) {
      console.error("Failed to delete event:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = () => {
    onEdit?.(event.id)
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
        <div className="absolute top-4 right-4 flex gap-2">
          <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white" onClick={handleEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="bg-white/90 hover:bg-white text-red-600"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
          {event.title}
        </h3>
        <p className="text-slate-600 text-sm mb-4 line-clamp-2">{event.description}</p>

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
        <Button
          onClick={onSubscribe}
          variant={event.isSubscribed ? "secondary" : "default"}
          className={`w-full h-10 ${
            event.isSubscribed
              ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
              : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          }`}
        >
          <Heart className={`w-4 h-4 mr-2 ${event.isSubscribed ? "fill-current" : ""}`} />
          {event.isSubscribed ? "Unsubscribe" : "Subscribe"}
        </Button>
      </CardFooter>
    </Card>
  )
}
