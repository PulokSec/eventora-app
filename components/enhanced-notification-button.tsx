"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, X, AlertCircle, CheckCircle, XCircle, Clock, Shield } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Notification {
  id: string
  _id: string
  title: string
  message: string
  eventId: string
  eventTitle: string
  type: "status_change" | "event_update" | "new_subscriber" | "event_reminder"
  timestamp: string
  read: boolean
}

interface EnhancedNotificationButtonProps {
  userRole: "admin" | "user"
}

export function EnhancedNotificationButton({ userRole }: EnhancedNotificationButtonProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const checkForUpdates = async () => {
    setIsChecking(true)
    try {
      const response = await fetch("/api/notifications?unreadOnly=false")
      if (response.ok) {
        const data = await response.json()
        console.log(data);
        if (data.success) {
          const newNotifications = data.notifications.filter(
            (newNotif: Notification) => !notifications.some((existingNotif) => existingNotif.id === newNotif.id),
          )

          if (newNotifications.length > 0) {
            setNotifications((prev) => [...newNotifications, ...prev])
            setUnreadCount(data.unreadCount)
          }
        }
      }
    } catch (error) {
      console.error("Failed to check updates:", error)
    } finally {
      setIsChecking(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === notificationId ? { ...notif, read: true } : notif)),
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Failed to mark as read:", error)
    }
  }

  const clearNotification = (notificationId: string) => {
    const notification = notifications.find((n) => n.id === notificationId)
    if (notification && !notification.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
    setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId))
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "new_subscriber":
        return <Bell className="w-4 h-4 text-blue-600" />
      case "event_update":
        return <AlertCircle className="w-4 h-4 text-purple-600" />
      case "event_reminder":
        return <Clock className="w-4 h-4 text-orange-600" />
      default:
        return <Bell className="w-4 h-4 text-slate-600" />
    }
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
        <DropdownMenuContent align="end" className="w-96 p-0">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Notifications
                {userRole === "admin" && (
                  <Badge className="bg-purple-100 text-purple-800 flex items-center">
                    <Shield className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </CardTitle>
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
                      key={notification._id}
                      className={`p-4 border-b border-slate-100 hover:bg-slate-50 ${
                        !notification.read ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex gap-3 flex-1">
                          <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-slate-900 text-sm">{notification.title}</h4>
                            </div>
                            <p className="text-slate-600 text-sm mb-1">{notification.message}</p>
                            <p className="text-slate-400 text-xs">
                              Event: {notification.eventTitle} • {new Date(notification.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification._id)}
                              className="h-6 w-6 p-0 hover:bg-green-100"
                            >
                              <Check className="w-3 h-3 text-green-600" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => clearNotification(notification._id)}
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
