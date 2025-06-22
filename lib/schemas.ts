import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  name: string
  email: string
  password: string
  role: "admin" | "user"
  status: "active" | "suspended"
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface Event {
  _id?: ObjectId
  title: string
  description: string
  date: string
  time: string
  location: string
  category: string
  status: "active" | "cancelled" | "completed" | "pending"
  banner?: string
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface Subscription {
  _id?: ObjectId
  userId: ObjectId
  eventId: ObjectId
  createdAt: Date
}

export interface Notification {
  _id?: ObjectId
  userId: ObjectId
  title: string
  message: string
  eventId?: ObjectId
  eventTitle?: string
  type: "status_change" | "event_update" | "new_subscriber" | "event_reminder"
  status?: "active" | "cancelled" | "completed" | "pending"
  read: boolean
  createdAt: Date
}
