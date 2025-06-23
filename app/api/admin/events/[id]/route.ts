import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { Notification } from "@/lib/schemas"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    const { db } = await connectToDatabase()
    const eventId = params.id

    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ success: false, message: "Invalid event ID" }, { status: 400 })
    }

    const event = await db
      .collection("events")
      .aggregate([
        { $match: { _id: new ObjectId(eventId) } },
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "creator",
          },
        },
        {
          $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "eventId",
            as: "subscriptions",
          },
        },
        {
          $lookup: {
            from: "subscriptions",
            let: { eventId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$eventId", "$$eventId"] } } },
              {
                $lookup: {
                  from: "users",
                  localField: "userId",
                  foreignField: "_id",
                  as: "user",
                },
              },
              {
                $addFields: {
                  user: { $arrayElemAt: ["$user", 0] },
                },
              },
              {
                $project: {
                  "user.name": 1,
                  "user.email": 1,
                  createdAt: 1,
                },
              },
            ],
            as: "subscribers",
          },
        },
        {
          $addFields: {
            creator: { $arrayElemAt: ["$creator", 0] },
            subscriberCount: { $size: "$subscriptions" },
          },
        },
        {
          $project: {
            title: 1,
            description: 1,
            date: 1,
            time: 1,
            location: 1,
            category: 1,
            status: 1,
            banner: 1,
            createdAt: 1,
            updatedAt: 1,
            subscriberCount: 1,
            subscribers: 1,
            "creator._id": 1,
            "creator.name": 1,
            "creator.email": 1,
            "creator.role": 1,
          },
        },
      ])
      .toArray()

    if (!event.length) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      event: event[0],
    })
  } catch (error) {
    console.error("Admin get event error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    const eventId = params.id
    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ success: false, message: "Invalid event ID" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if event exists
    const existingEvent = await db.collection("events").findOne({ _id: new ObjectId(eventId) })
    if (!existingEvent) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    }

    const { title, description, date, time, location, category, banner, status, createdBy } = await request.json()

    const updateData: any = {
      updatedAt: new Date(),
    }

    // Build update data
    if (title) updateData.title = title
    if (description) updateData.description = description
    if (date) updateData.date = date
    if (time) updateData.time = time
    if (location) updateData.location = location
    if (category) updateData.category = category
    if (banner !== undefined) updateData.banner = banner
    if (status) updateData.status = status
    if (createdBy && ObjectId.isValid(createdBy)) {
      updateData.createdBy = new ObjectId(createdBy)
    }

    // Validate date if provided
    if (date && time) {
      const eventDate = new Date(`${date}T${time}`)
      if (eventDate <= new Date() && status === "active") {
        return NextResponse.json({ success: false, message: "Cannot set past events as active" }, { status: 400 })
      }
    }

    await db.collection("events").updateOne({ _id: new ObjectId(eventId) }, { $set: updateData })

    // Notify subscribers if event was updated significantly
    if (title || description || date || time || location || status) {
      const subscribers = await db
        .collection("subscriptions")
        .find({ eventId: new ObjectId(eventId) })
        .toArray()

      if (subscribers.length > 0) {
        const notifications = subscribers.map((sub) => ({
          userId: sub.userId,
          title: "Event Updated",
          message: `The event "${updateData.title || existingEvent.title}" has been updated by an admin.`,
          eventId: new ObjectId(eventId),
          eventTitle: updateData.title || existingEvent.title,
          type: "event_update" as const,
          read: false,
          createdAt: new Date(),
        }))

        await db.collection("notifications").insertMany(notifications)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Event updated successfully",
    })
  } catch (error) {
    console.error("Admin update event error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    const eventId = params.id
    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ success: false, message: "Invalid event ID" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Get event details before deletion
    const existingEvent = await db.collection("events").findOne({ _id: new ObjectId(eventId) })
    if (!existingEvent) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    }

    // Get subscribers for notifications
    const subscribers = await db
      .collection("subscriptions")
      .find({ eventId: new ObjectId(eventId) })
      .toArray()

    // Delete image from Cloudinary if exists
    if (existingEvent.banner) {
      try {
        const { extractPublicIdFromUrl, deleteFromCloudinary } = await import("@/lib/cloudinary")
        const publicId = extractPublicIdFromUrl(existingEvent.banner)
        if (publicId) {
          await deleteFromCloudinary(publicId)
        }
      } catch (cloudinaryError) {
        console.error("Failed to delete image from Cloudinary:", cloudinaryError)
        // Continue with event deletion even if image deletion fails
      }
    }

    // Create cancellation notifications for subscribers
    if (subscribers.length > 0) {
      const notifications: Omit<Notification, "_id">[] = subscribers.map((sub) => ({
        userId: sub.userId,
        title: "Event Cancelled",
        message: `The event "${existingEvent.title}" has been cancelled and removed by an admin.`,
        eventId: new ObjectId(eventId),
        eventTitle: existingEvent.title,
        type: "status_change",
        status: "cancelled",
        read: false,
        createdAt: new Date(),
      }))

      await db.collection("notifications").insertMany(notifications)
    }

    // Delete event and related data
    await Promise.all([
      db.collection("events").deleteOne({ _id: new ObjectId(eventId) }),
      db.collection("subscriptions").deleteMany({ eventId: new ObjectId(eventId) }),
      db.collection("notifications").deleteMany({ eventId: new ObjectId(eventId) }),
    ])

    return NextResponse.json({
      success: true,
      message: `Event deleted successfully. ${subscribers.length} subscribers were notified.`,
    })
  } catch (error) {
    console.error("Admin delete event error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
