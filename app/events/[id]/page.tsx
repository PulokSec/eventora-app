"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock, User, Heart, ArrowLeft, Users } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

interface EventDetails {
  _id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  category: string
  status: string
  banner?: string
  subscriberCount: number
  creator: {
    name: string
    email: string
  }
  createdAt: string
}

export default function EventDetailsPage() {
  const params = useParams()
  const { toast } = useToast()
  const [event, setEvent] = useState<EventDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const router = useRouter()

  const {user} = useAuth()
  
    useEffect(() => {
      if(!user){
        router.push("/auth/login")
        return
      }
    }, [user])

  useEffect(() => {
    if (params.id) {
      fetchEvent()
    }
  }, [params.id])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setEvent(data.event)
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
        description: "Failed to load event details",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubscribe = async () => {
    setIsSubscribing(true)
    try {
      const method = isSubscribed ? "DELETE" : "POST"
      const response = await fetch(`/api/events/${params.id}/subscribe`, {
        method,
      })

      const data = await response.json()

      if (data.success) {
        setIsSubscribed(!isSubscribed)
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                subscriberCount: isSubscribed ? prev.subscriberCount - 1 : prev.subscriberCount + 1,
              }
            : null,
        )
        toast({
          title: "Success",
          description: isSubscribed ? "Unsubscribed from event" : "Subscribed to event",
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
        description: "Failed to update subscription",
        variant: "destructive",
      })
    } finally {
      setIsSubscribing(false)
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

  const getStatusColor = (status: string) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="h-96 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-slate-500">Event not found</p>
              <Button asChild className="mt-4">
                <Link href="/">Back to Events</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              {/* Event Banner */}
              <div className="relative">
                <img
                  src={event.banner || "/placeholder.svg?height=400&width=800"}
                  alt={event.title}
                  className="w-full h-64 object-cover rounded-t-lg"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className={getCategoryColor(event.category)}>
                    {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                  </Badge>
                  <Badge className={getStatusColor(event.status)}>
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-4">{event.title}</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Calendar className="w-5 h-5" />
                    <span>
                      {new Date(event.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <Clock className="w-5 h-5" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <MapPin className="w-5 h-5" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <Users className="w-5 h-5" />
                    <span>{event.subscriberCount} subscribers</span>
                  </div>
                </div>

                <div className="prose max-w-none">
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">About this event</h3>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{event.description}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm sticky top-8">
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Organizer Info */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Organized by</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{event.creator.name}</p>
                      <p className="text-sm text-slate-500">{event.creator.email}</p>
                    </div>
                  </div>
                </div>

                {/* Event Stats */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Event Statistics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Subscribers</span>
                      <span className="font-medium">{event.subscriberCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Created</span>
                      <span className="font-medium">{new Date(event.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Subscribe Button */}
                {event.status === "active" && (
                  <Button
                    onClick={handleSubscribe}
                    disabled={isSubscribing}
                    className={`w-full h-12 ${
                      isSubscribed
                        ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    }`}
                    variant={isSubscribed ? "outline" : "default"}
                  >
                    {isSubscribing ? (
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    ) : (
                      <Heart className={`w-4 h-4 mr-2 ${isSubscribed ? "fill-current" : ""}`} />
                    )}
                    {isSubscribing ? "Processing..." : isSubscribed ? "Unsubscribe" : "Subscribe"}
                  </Button>
                )}

                {event.status !== "active" && (
                  <div className="p-4 bg-slate-50 rounded-lg text-center">
                    <p className="text-sm text-slate-600">
                      {event.status === "pending" && "This event is pending approval"}
                      {event.status === "cancelled" && "This event has been cancelled"}
                      {event.status === "completed" && "This event has ended"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
