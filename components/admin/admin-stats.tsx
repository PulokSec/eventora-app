"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Users, Calendar, Heart, Activity } from "lucide-react"

interface AnalyticsData {
  eventsByCategory: { category: string; count: number; percentage: number }[]
  userGrowth: { month: string; users: number; growth: number }[]
  eventStatus: { status: string; count: number; percentage: number }[]
  topEvents: { title: string; subscribers: number; creator: string }[]
}

export function AdminStats() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      // Dummy analytics data
      const dummyAnalytics: AnalyticsData = {
        eventsByCategory: [
          { category: "Technology", count: 15, percentage: 35 },
          { category: "Business", count: 12, percentage: 28 },
          { category: "Arts", count: 8, percentage: 19 },
          { category: "Sports", count: 5, percentage: 12 },
          { category: "Music", count: 3, percentage: 7 },
        ],
        userGrowth: [
          { month: "Jan", users: 120, growth: 15 },
          { month: "Feb", users: 145, growth: 21 },
          { month: "Mar", users: 156, growth: 8 },
        ],
        eventStatus: [
          { status: "Active", count: 28, percentage: 67 },
          { status: "Pending", count: 8, percentage: 19 },
          { status: "Completed", count: 4, percentage: 10 },
          { status: "Cancelled", count: 2, percentage: 5 },
        ],
        topEvents: [
          { title: "Tech Conference 2024", subscribers: 67, creator: "John Doe" },
          { title: "Business Networking", subscribers: 45, creator: "Jane Smith" },
          { title: "Art Gallery Opening", subscribers: 34, creator: "Mike Johnson" },
          { title: "Music Festival", subscribers: 28, creator: "Sarah Wilson" },
        ],
      }

      setAnalytics(dummyAnalytics)
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="h-20 bg-slate-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!analytics) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Events by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Events by Category
          </CardTitle>
          <CardDescription>Distribution of events across different categories</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {analytics.eventsByCategory.map((item) => (
            <div key={item.category} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{item.category}</span>
                <span className="text-sm text-slate-500">{item.count} events</span>
              </div>
              <Progress value={item.percentage} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* User Growth */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Growth
          </CardTitle>
          <CardDescription>Monthly user registration trends</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {analytics.userGrowth.map((item) => (
            <div key={item.month} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <div>
                <div className="font-medium">{item.month} 2024</div>
                <div className="text-sm text-slate-500">{item.users} total users</div>
              </div>
              <Badge className={`${item.growth > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {item.growth > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {item.growth > 0 ? "+" : ""}
                {item.growth}%
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Event Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Event Status
          </CardTitle>
          <CardDescription>Current status distribution of all events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {analytics.eventStatus.map((item) => (
            <div key={item.status} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{item.status}</span>
                <span className="text-sm text-slate-500">{item.count} events</span>
              </div>
              <Progress value={item.percentage} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Top Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Top Events
          </CardTitle>
          <CardDescription>Most subscribed events on the platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {analytics.topEvents.map((event, index) => (
            <div key={event.title} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm text-slate-500">by {event.creator}</div>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800">{event.subscribers} subscribers</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
