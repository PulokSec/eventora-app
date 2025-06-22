"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Notification {
  id: string
  title: string
  message: string
  eventId: string
  timestamp: string
  read: boolean
}

export function NotificationButton() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const checkForUpdates = async () => {
    setIsChecking(true)
    try {
      // Dummy API call to check for updates
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const newNotifications: Notification[] = [
        {
          id: "1",
          title: "Event Updated",
          message: "Tech Conference 2024 venue has been changed",
          eventId: "1",
          timestamp: new Date().toISOString(),
          read: false,
        },
        {
          id: "2",
          title: "New Event",
          message: "A new event matching your interests has been added",
          eventId: "2",
          timestamp: new Date().toISOString(),
          read: false,
        },
      ]

      setNotifications((prev) => [...newNotifications, ...prev])
      setUnreadCount((prev) => prev + newNotifications.length)
    } catch (error) {
      console.error("Failed to check updates:", error)
    } finally {
      setIsChecking(false)
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === notificationId ? { ...notif, read: true } : notif)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const clearNotification = (notificationId: string) => {
    const notification = notifications.find((n) => n.id === notificationId)
    if (notification && !notification.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
    setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId))
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={checkForUpdates}
        disabled={isChecking}
        className="h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
      >
        {isChecking ? "Checking..." : "Check Updates"}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-12 px-4 bg-white border-slate-200 hover:bg-slate-50 relative">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Notifications</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>No notifications yet</p>
                  <p className="text-sm">Click "Check Updates" to see new notifications</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-slate-100 hover:bg-slate-50 ${
                        !notification.read ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 text-sm">{notification.title}</h4>
                          <p className="text-slate-600 text-sm mt-1">{notification.message}</p>
                          <p className="text-slate-400 text-xs mt-2">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                              className="h-6 w-6 p-0 hover:bg-green-100"
                            >
                              <Check className="w-3 h-3 text-green-600" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => clearNotification(notification.id)}
                            className="h-6 w-6 p-0 hover:bg-red-100"
                          >
                            <X className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
