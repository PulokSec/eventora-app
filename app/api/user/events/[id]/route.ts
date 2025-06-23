import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const event = await db
      .collection("events")
      .aggregate([
        {
          $match: {
            _id: new ObjectId(eventId),
            createdBy: new ObjectId(user._id!),
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
          $addFields: {
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
            subscriberCount: 1,
          },
        },
      ])
      .toArray()

    if (!event.length) {
      return NextResponse.json({ success: false, message: "Event not found or access denied" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      event: event[0],
    })
  } catch (error) {
    console.error("Get user event error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Check if event exists and user owns it
    const existingEvent = await db.collection("events").findOne({
      _id: new ObjectId(eventId),
      createdBy: new ObjectId(user._id!),
    })

    if (!existingEvent) {
      return NextResponse.json({ success: false, message: "Event not found or access denied" }, { status: 404 })
    }

    const { title, description, date, time, location, category, banner } = await request.json()

    // Validation
    if (!title || !description || !date || !time || !location || !category) {
      return NextResponse.json({ success: false, message: "All fields are required" }, { status: 400 })
    }

    // Validate category
    const validCategories = ["technology", "business", "arts", "sports", "music", "education", "food", "other"]
    if (!validCategories.includes(category)) {
      return NextResponse.json({ success: false, message: "Invalid category" }, { status: 400 })
    }

    // Validate date (should be in the future)
    const eventDate = new Date(`${date}T${time}`)
    if (eventDate <= new Date()) {
      return NextResponse.json({ success: false, message: "Event date must be in the future" }, { status: 400 })
    }

    const updateData: any = {
      title,
      description,
      date,
      time,
      location,
      category,
      updatedAt: new Date(),
    }

    if (banner !== undefined) {
      updateData.banner = banner
    }

    // If event was previously rejected/cancelled and now being updated, set to pending for review
    if (existingEvent.status === "cancelled") {
      updateData.status = "pending"
    }

    const result = await db.collection("events").updateOne({ _id: new ObjectId(eventId) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "Failed to update event" }, { status: 500 })
    }

    // Notify subscribers about the update
    const subscribers = await db
      .collection("subscriptions")
      .find({ eventId: new ObjectId(eventId) })
      .toArray()

    if (subscribers.length > 0) {
      const notifications = subscribers.map((subscription) => ({
        userId: subscription.userId,
        title: "Event Updated",
        message: `The event "${title}" has been updated. Check out the latest details!`,
        eventId: new ObjectId(eventId),
        eventTitle: title,
        type: "event_update" as const,
        read: false,
        createdAt: new Date(),
      }))

      await db.collection("notifications").insertMany(notifications)
    }

    return NextResponse.json({
      success: true,
      message: "Event updated successfully",
      data: {
        eventId,
        notificationsCreated: subscribers.length,
        statusChanged: existingEvent.status === "cancelled" && updateData.status === "pending",
      },
    })
  } catch (error) {
    console.error("Update user event error:", error)
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

    // Check if event exists and user owns it
    const existingEvent = await db.collection("events").findOne({
      _id: new ObjectId(eventId),
      createdBy: new ObjectId(user._id!),
    })

    if (!existingEvent) {
      return NextResponse.json({ success: false, message: "Event not found or access denied" }, { status: 404 })
    }

    // Get subscriber count before deletion for notification
    const subscriberCount = await db.collection("subscriptions").countDocuments({
      eventId: new ObjectId(eventId),
    })

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

    // Get all subscribers before deletion to notify them
    const subscribers = await db
      .collection("subscriptions")
      .find({ eventId: new ObjectId(eventId) })
      .toArray()

    // Delete event and related data in a transaction-like manner
    await Promise.all([
      db.collection("events").deleteOne({ _id: new ObjectId(eventId) }),
      db.collection("subscriptions").deleteMany({ eventId: new ObjectId(eventId) }),
      db.collection("notifications").deleteMany({ eventId: new ObjectId(eventId) }),
    ])

    // Notify subscribers about the deletion
    if (subscribers.length > 0) {
      const notifications = subscribers.map((subscription) => ({
        userId: subscription.userId,
        title: "Event Cancelled",
        message: `The event "${existingEvent.title}" has been cancelled by the organizer.`,
        type: "event_update" as const,
        read: false,
        createdAt: new Date(),
      }))

      await db.collection("notifications").insertMany(notifications)
    }

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully",
      data: {
        eventId,
        eventTitle: existingEvent.title,
        subscribersNotified: subscribers.length,
        imageDeleted: !!existingEvent.banner,
      },
    })
  } catch (error) {
    console.error("Delete user event error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
