"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, MapPin, Clock, ArrowLeft, Save, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { ImageUpload } from "@/components/image-upload"
import { useToast } from "@/hooks/use-toast"

interface EventData {
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
  createdBy: string
  creator: {
    _id: string
    name: string
    email: string
  }
}

interface CurrentUser {
  _id: string
  role: string
  name: string
  email: string
}

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [event, setEvent] = useState<EventData | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    category: "",
    banner: "",
  })

  useEffect(() => {
    if (params.id) {
      fetchCurrentUser()
      fetchEvent()
    }
  }, [params.id])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/auth/me")
      const data = await response.json()
      if (data.success) {
        setCurrentUser(data.user)
      }
    } catch (error) {
      console.error("Failed to fetch current user:", error)
    }
  }

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setEvent(data.event)
        setFormData({
          title: data.event.title,
          description: data.event.description,
          date: data.event.date,
          time: data.event.time,
          location: data.event.location,
          category: data.event.category,
          banner: data.event.banner || "",
        })
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
        router.push("/")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive",
      })
      router.push("/")
    } finally {
      setIsFetching(false)
    }
  }

  // Check if user can edit this event
  const canEdit =
    currentUser &&
    event &&
    (currentUser.role === "admin" || currentUser._id === event.createdBy || currentUser._id === event.creator._id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canEdit) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit this event",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const apiUrl = currentUser?.role === "admin" ? `/api/admin/events/${params.id}` : `/api/user/events/${params.id}`

      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: `Event updated successfully! ${data.data?.notificationsCreated ? `${data.data.notificationsCreated} subscribers were notified.` : ""}`,
        })

        // Redirect based on user role
        if (currentUser?.role === "admin") {
          router.push("/admin/dashboard")
        } else {
          router.push("/user/dashboard")
        }
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
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="h-96 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!event || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-slate-500">Event not found or access denied</p>
              <Button asChild className="mt-4">
                <Link href="/">Back to Home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
              <p className="text-red-700 mb-4">You can only edit events that you created.</p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" asChild>
                  <Link href="/">Back to Home</Link>
                </Button>
                <Button asChild>
                  <Link href={`/events/${event._id}`}>View Event</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const backUrl = currentUser.role === "admin" ? "/admin/dashboard" : "/user/dashboard"

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8">
          <Link href={backUrl} className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Edit Event</h1>
          <p className="text-slate-600 mt-2">Update your event details</p>
        </div>

        {/* Status Information */}
        {event.status === "cancelled" && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                <span className="font-medium">Event Status: Cancelled</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                This event was cancelled. Updating it will resubmit for review.
              </p>
            </CardContent>
          </Card>
        )}

        {event.status === "pending" && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                <span className="font-medium">Event Status: Pending Review</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">Your event is currently under review by administrators.</p>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">Event Details</CardTitle>
            <CardDescription>
              Update your event information.
              {event.subscriberCount > 0 && (
                <span className="block mt-1 text-blue-600 font-medium">
                  {event.subscriberCount} subscriber(s) will be notified of changes
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Banner Upload */}
              <ImageUpload
                type="event-banner"
                currentImage={formData.banner}
                onImageChange={(url) => handleInputChange("banner", url)}
                onImageRemove={() => handleInputChange("banner", "")}
                disabled={isLoading}
              />

              {/* Event Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                  Event Title
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter event title"
                  className="h-12 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe your event..."
                  className="min-h-[120px] border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-medium text-slate-700">
                    Date
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      className="h-12 pl-10 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-sm font-medium text-slate-700">
                    Time
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange("time", e.target.value)}
                      className="h-12 pl-10 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium text-slate-700">
                  Location
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Event location"
                    className="h-12 pl-10 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange("category", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-12 border-slate-200 focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue placeholder="Select event category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="arts">Arts & Culture</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="music">Music</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="food">Food & Drink</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12 border-slate-200 hover:bg-slate-50"
                  asChild
                  disabled={isLoading}
                >
                  <Link href={backUrl}>Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Event
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
