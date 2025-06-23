"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Bell, Check, Trash2, ExternalLink } from "lucide-react"
import Link from "next/link"

interface Notification {
  id: string
  title: string
  message: string
  eventId: string
  eventTitle: string
  type: "status_change" | "event_update" | "new_subscriber" | "event_reminder"
  status?: "active" | "cancelled" | "completed" | "pending"
  timestamp: string
  read: boolean
}

interface NotificationsListProps {
  notifications: Notification[]
  isLoading: boolean
  selectedNotifications: string[]
  setSelectedNotifications: (ids: string[]) => void
  markAsRead: (id: string) => void
  deleteNotification: (id: string) => void
  getNotificationIcon: (type: Notification["type"], status?: Notification["status"]) => JSX.Element
  getStatusBadge: (status: Notification["status"]) => JSX.Element | null
}

export default function NotificationsList({
  notifications,
  isLoading,
  selectedNotifications,
  setSelectedNotifications,
  markAsRead,
  deleteNotification,
  getNotificationIcon,
  getStatusBadge,
}: NotificationsListProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotifications(notifications.map((n) => n.id))
    } else {
      setSelectedNotifications([])
    }
  }

  const handleSelectNotification = (notificationId: string, checked: boolean) => {
    if (checked) {
      setSelectedNotifications([...selectedNotifications, notificationId])
    } else {
      setSelectedNotifications(selectedNotifications.filter((id) => id !== notificationId))
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const notificationTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-5 h-5 bg-slate-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-full"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Bell className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No notifications found</h3>
          <p className="text-slate-600">You're all caught up! Check back later for updates.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Select All Header */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedNotifications.length === notifications.length && notifications.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">
              Select all ({notifications.length} notification{notifications.length !== 1 ? "s" : ""})
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`transition-all hover:shadow-md ${
            !notification.read ? "border-l-4 border-l-blue-500 bg-blue-50/50" : ""
          } ${selectedNotifications.includes(notification.id) ? "ring-2 ring-blue-500" : ""}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Checkbox
                checked={selectedNotifications.includes(notification.id)}
                onCheckedChange={(checked) => handleSelectNotification(notification.id, !!checked)}
              />

              <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type, notification.status)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-slate-900 truncate">{notification.title}</h3>
                  {notification.type === "status_change" && getStatusBadge(notification.status)}
                  {!notification.read && <Badge className="bg-blue-100 text-blue-800 text-xs">New</Badge>}
                </div>

                <p className="text-slate-600 text-sm mb-3 leading-relaxed">{notification.message}</p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-slate-500">
                    <span className="font-medium">{notification.eventTitle}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(notification.timestamp)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/events/${notification.eventId}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View Event
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                {!notification.read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markAsRead(notification.id)}
                    className="h-8 w-8 p-0 hover:bg-green-100"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4 text-green-600" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteNotification(notification.id)}
                  className="h-8 w-8 p-0 hover:bg-red-100"
                  title="Delete notification"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
