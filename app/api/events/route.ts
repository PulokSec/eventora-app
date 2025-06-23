import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { Event } from "@/lib/schemas"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(request.url)

    // Get current user if authenticated
    let currentUser = null
    try {
      const { user } = await requireAuth(request)
      currentUser = user
    } catch {
      // User not authenticated, continue without user context
    }

    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "12")
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const status = searchParams.get("status") || "active"

    // Build filter
    const filter: any = {}

    if (category && category !== "all") {
      filter.category = category
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ]
    }

    if (status !== "all") {
      filter.status = status
    }

    const skip = (page - 1) * limit

    // Get events with creator information and subscription status
    // Use 'any' type for pipeline to allow advanced $lookup options
    const pipeline: any[] = [
      { $match: filter },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "creator",
        },
      },
      {
        $addFields: {
          creator: { $arrayElemAt: ["$creator", 0] },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      { $skip: skip },
      { $limit: limit },
    ]

    // Add subscription lookup if user is authenticated
    if (currentUser) {
      pipeline.splice(-2, 0, {
        $lookup: {
          from: "subscriptions",
          let: { eventId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$eventId", "$$eventId"] }, { $eq: ["$userId", new ObjectId(currentUser._id!)] }],
                },
              },
            },
          ],
          as: "userSubscription",
        },
      })

      pipeline.splice(-1, 0, {
        $addFields: {
          isSubscribed: { $gt: [{ $size: "$userSubscription" }, 0] },
        },
      })
    }

    const events = await db.collection("events").aggregate(pipeline).toArray()
    const total = await db.collection("events").countDocuments(filter)

    // Format events for response
    const formattedEvents = events.map((event) => ({
      id: event._id.toString(),
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      category: event.category,
      status: event.status,
      banner: event.banner,
      createdBy: event.createdBy.toString(),
      creator: event.creator
        ? {
            _id: event.creator._id.toString(),
            name: event.creator.name,
            email: event.creator.email,
          }
        : null,
      isSubscribed: event.isSubscribed || false,
      createdAt: event.createdAt,
    }))

    return NextResponse.json({
      success: true,
      events: formattedEvents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get events error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Authentication required" }, { status: 401 })
    }

    const { title, description, date, time, location, category, banner } = await request.json()

    // Validation
    if (!title || !description || !date || !time || !location || !category) {
      return NextResponse.json({ success: false, message: "All fields are required" }, { status: 400 })
    }

    // Validate date is in the future
    const eventDate = new Date(`${date}T${time}`)
    if (eventDate <= new Date()) {
      return NextResponse.json({ success: false, message: "Event date must be in the future" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const event: Omit<Event, "_id"> = {
      title,
      description,
      date,
      time,
      location,
      category,
      status: "pending", // New events start as pending
      banner: banner || null,
      createdBy: new ObjectId(user._id!),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("events").insertOne(event)

    return NextResponse.json({
      success: true,
      message: "Event created successfully",
      eventId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Create event error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
