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
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock, ArrowLeft, Save, UserIcon, Shield } from "lucide-react"
import Link from "next/link"
import { ImageUpload } from "@/components/image-upload"
import { useToast } from "@/hooks/use-toast"
import { Eye, BarChart3 } from "lucide-react" // Import Eye and BarChart3

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
  createdAt: string
  creator: {
    _id: string
    name: string
    email: string
    role: string
  }
  subscribers?: Array<{
    user: {
      name: string
      email: string
    }
    createdAt: string
  }>
}

export default function AdminEditEventPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [event, setEvent] = useState<EventData | null>(null)
  const [users, setUsers] = useState<Array<{ _id: string; name: string; email: string; role: string }>>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    category: "",
    banner: "",
    status: "",
    createdBy: "",
  })

  useEffect(() => {
    if (params.id) {
      fetchEvent()
      fetchUsers()
    }
  }, [params.id])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/admin/events/${params.id}`)
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
          status: data.event.status,
          createdBy: data.event.creator._id,
        })
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
        router.push("/admin/dashboard")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive",
      })
      router.push("/admin/dashboard")
    } finally {
      setIsFetching(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/events/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Event updated successfully!",
        })
        router.push("/admin/dashboard")
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

  const getStatusColor = (status: string) => {
    const colors = {
      active: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200",
    }
    return colors[status as keyof typeof colors] || colors.pending
  }

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="h-96 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-slate-500">Event not found</p>
              <Button asChild className="mt-4">
                <Link href="/admin/dashboard">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <Link href="/admin/dashboard" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-slate-900">Admin: Edit Event</h1>
          </div>
          <p className="text-slate-600">Full administrative control over event details</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Event Details</CardTitle>
                <CardDescription>Update event information with administrative privileges</CardDescription>
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
                      placeholder="Describe the event..."
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

                  {/* Category and Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => handleInputChange("category", value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-12 border-slate-200 focus:border-purple-500 focus:ring-purple-500">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="arts">Arts & Culture</SelectItem>
                          <SelectItem value="sports">Sports</SelectItem>
                          <SelectItem value="music">Music</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="food">Food & Drink</SelectItem>
                          <SelectItem value="health">Health & Wellness</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => handleInputChange("status", value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-12 border-slate-200 focus:border-purple-500 focus:ring-purple-500">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Event Creator Assignment */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Assign to User</Label>
                    <Select
                      value={formData.createdBy}
                      onValueChange={(value) => handleInputChange("createdBy", value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-12 border-slate-200 focus:border-purple-500 focus:ring-purple-500">
                        <UserIcon className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Select event creator" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user._id} value={user._id}>
                            <div className="flex items-center gap-2">
                              <span>{user.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {user.role}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
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
                      <Link href="/admin/dashboard">Cancel</Link>
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

          {/* Event Info Sidebar */}
          <div className="space-y-6">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Status</span>
                  <Badge className={getStatusColor(event.status)}>
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Subscribers</span>
                  <span className="font-medium">{event.subscriberCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Created</span>
                  <span className="text-sm">{new Date(event.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Current Creator */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Creator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {event.creator.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{event.creator.name}</div>
                    <div className="text-sm text-slate-500">{event.creator.email}</div>
                  </div>
                </div>
                <Badge variant="outline" className="w-fit">
                  {event.creator.role}
                </Badge>
              </CardContent>
            </Card>

            {/* Subscribers Preview */}
            {event.subscribers && event.subscribers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Subscribers</CardTitle>
                  <CardDescription>Latest {Math.min(5, event.subscribers.length)} subscribers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {event.subscribers.slice(0, 5).map((sub, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div>
                        <div className="font-medium">{sub.user.name}</div>
                        <div className="text-slate-500 text-xs">{sub.user.email}</div>
                      </div>
                      <div className="text-xs text-slate-400">{new Date(sub.createdAt).toLocaleDateString()}</div>
                    </div>
                  ))}
                  {event.subscribers.length > 5 && (
                    <div className="text-center text-sm text-slate-500 pt-2 border-t">
                      +{event.subscribers.length - 5} more subscribers
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Admin Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/events/${event._id}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Public Page
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/admin/events/${event._id}/analytics`}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
