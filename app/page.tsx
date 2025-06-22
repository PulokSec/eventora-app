'use client'
import { EventsGrid } from "@/components/events-grid"
import { SearchBar } from "@/components/search-bar"
import { NotificationButton } from "@/components/notification-button"
import { EnhancedNotificationButton } from "@/components/enhanced-notification-button"
import { useAuth } from "@/lib/auth-context"

export default function HomePage() {
  // In a real app, check authentication status
  // For demo purposes, we'll show the events page directly
  const {user} = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Discover Events</h1>
            <p className="text-slate-600 text-lg">Find and manage amazing events happening around you</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <SearchBar />
            {user?.role && <EnhancedNotificationButton userRole={user.role} />}
          </div>
        </div>
        <EventsGrid />
      </div>
    </div>
  )
}
