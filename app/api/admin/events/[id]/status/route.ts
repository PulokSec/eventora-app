import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { Notification } from "@/lib/schemas"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request, "admin")
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Admin access required" }, { status: 401 })
    }

    const eventId = params.id
    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ success: false, message: "Invalid event ID" }, { status: 400 })
    }

    const body = await request.json()
    const { status } = body

    // Validate status
    const validStatuses = ["active", "cancelled", "completed", "pending"]
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status. Must be one of: active, cancelled, completed, pending" },
        { status: 400 },
      )
    }

    const { db } = await connectToDatabase()

    // Check if event exists
    const existingEvent = await db.collection("events").findOne({ _id: new ObjectId(eventId) })
    if (!existingEvent) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    }

    // Update event status
    const result = await db.collection("events").updateOne(
      { _id: new ObjectId(eventId) },
      {
        $set: {
          status: status,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "Failed to update event status" }, { status: 500 })
    }

    // Create notifications for all subscribers (not the creator unless they're subscribed)
    const subscribers = await db
      .collection("subscriptions")
      .find({ eventId: new ObjectId(eventId) })
      .toArray()

    if (subscribers.length > 0) {
      const notifications = subscribers.map((subscription) => ({
        userId: subscription.userId,
        title: "Event Status Updated",
        message: `The event "${existingEvent.title}" status has been changed to ${status}`,
        eventId: new ObjectId(eventId),
        eventTitle: existingEvent.title,
        type: "status_change" as const,
        status: status as "active" | "cancelled" | "completed" | "pending",
        read: false,
        createdAt: new Date(),
      }))

      await db.collection("notifications").insertMany(notifications)
    }

    // Notify the event creator separately (only if they're not already in subscribers)
    const creatorIsSubscriber = subscribers.some((sub) => sub.userId.toString() === existingEvent.createdBy.toString())
    if (!creatorIsSubscriber) {
      const creatorNotification: Omit<Notification, "_id"> = {
        userId: existingEvent.createdBy,
        title: "Your Event Status Updated",
        message: `Your event "${existingEvent.title}" status has been changed to ${status} by an administrator`,
        eventId: new ObjectId(eventId),
        eventTitle: existingEvent.title,
        type: "status_change",
        status: status as "active" | "cancelled" | "completed" | "pending",
        read: false,
        createdAt: new Date(),
      }

      await db.collection("notifications").insertOne(creatorNotification)
    }

    return NextResponse.json({
      success: true,
      message: "Event status updated successfully",
      data: {
        eventId,
        status,
        subscribersNotified: subscribers.length,
        creatorNotified: !creatorIsSubscriber,
      },
    })
  } catch (error) {
    console.error("Update event status error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
