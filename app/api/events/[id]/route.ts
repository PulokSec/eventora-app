import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
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
            subscriberCount: 1,
            "creator.name": 1,
            "creator.email": 1,
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
    console.error("Get event error:", error)
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

    // Check if event exists and user has permission
    const existingEvent = await db.collection("events").findOne({ _id: new ObjectId(eventId) })
    if (!existingEvent) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    }

    // Check permissions
    if (user.role !== "admin" && existingEvent.createdBy.toString() !== user._id!.toString()) {
      return NextResponse.json({ success: false, message: "Permission denied" }, { status: 403 })
    }

    const { title, description, date, time, location, category, banner, status } = await request.json()

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (title) updateData.title = title
    if (description) updateData.description = description
    if (date) updateData.date = date
    if (time) updateData.time = time
    if (location) updateData.location = location
    if (category) updateData.category = category
    if (banner !== undefined) updateData.banner = banner
    if (status && (user.role === "admin" || existingEvent.createdBy.toString() === user._id!.toString())) {
      updateData.status = status
    }

    await db.collection("events").updateOne({ _id: new ObjectId(eventId) }, { $set: updateData })

    return NextResponse.json({
      success: true,
      message: "Event updated successfully",
    })
  } catch (error) {
    console.error("Update event error:", error)
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

    // Check if event exists and user has permission
    const existingEvent = await db.collection("events").findOne({ _id: new ObjectId(eventId) })
    if (!existingEvent) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    }

    // Check permissions
    if (user.role !== "admin" && existingEvent.createdBy.toString() !== user._id!.toString()) {
      return NextResponse.json({ success: false, message: "Permission denied" }, { status: 403 })
    }

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

    // Delete event and related data
    await Promise.all([
      db.collection("events").deleteOne({ _id: new ObjectId(eventId) }),
      db.collection("subscriptions").deleteMany({ eventId: new ObjectId(eventId) }),
      db.collection("notifications").deleteMany({ eventId: new ObjectId(eventId) }),
    ])

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully",
    })
  } catch (error) {
    console.error("Delete event error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
