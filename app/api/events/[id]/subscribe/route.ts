import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { Subscription, Notification } from "@/lib/schemas"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Authentication required" }, { status: 401 })
    }

    const eventId = params.id
    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ success: false, message: "Invalid event ID" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if event exists
    const event = await db.collection("events").findOne({ _id: new ObjectId(eventId) })
    if (!event) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    }

    // Check if already subscribed
    const existingSubscription = await db
      .collection("subscriptions")
      .findOne({ userId: new ObjectId(user._id!), eventId: new ObjectId(eventId) })

    if (existingSubscription) {
      return NextResponse.json({ success: false, message: "Already subscribed to this event" }, { status: 400 })
    }

    // Create subscription
    const subscription: Omit<Subscription, "_id"> = {
      userId: new ObjectId(user._id!),
      eventId: new ObjectId(eventId),
      createdAt: new Date(),
    }

    await db.collection("subscriptions").insertOne(subscription)

    // Create notification for event creator
    const notification: Omit<Notification, "_id"> = {
      userId: event.createdBy,
      title: "New Subscriber",
      message: `${user.name} subscribed to your event "${event.title}"`,
      eventId: new ObjectId(eventId),
      eventTitle: event.title,
      type: "new_subscriber",
      read: false,
      createdAt: new Date(),
    }

    await db.collection("notifications").insertOne(notification)

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed to event",
    })
  } catch (error) {
    console.error("Subscribe error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Authentication required" }, { status: 401 })
    }

    const eventId = params.id
    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ success: false, message: "Invalid event ID" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Remove subscription
    const result = await db
      .collection("subscriptions")
      .deleteOne({ userId: new ObjectId(user._id!), eventId: new ObjectId(eventId) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: "Subscription not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Successfully unsubscribed from event",
    })
  } catch (error) {
    console.error("Unsubscribe error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
