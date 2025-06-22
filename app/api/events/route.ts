import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { authenticateRequest } from "@/lib/auth"
import type { Event } from "@/lib/schemas"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const status = searchParams.get("status")

    const { db } = await connectToDatabase()

    // Build filter
    const filter: any = {}
    if (category && category !== "all") {
      filter.category = category
    }
    if (status && status !== "all") {
      filter.status = status
    }
    if (search) {
      filter.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    // Get events with pagination
    const skip = (page - 1) * limit
    const events = await db
      .collection("events")
      .aggregate([
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
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ])
      .toArray()

    const total = await db.collection("events").countDocuments(filter)

    return NextResponse.json({
      success: true,
      events,
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
    const { user, error } = await authenticateRequest(request)
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Authentication required" }, { status: 401 })
    }

    const { title, description, date, time, location, category, banner } = await request.json()

    // Validation
    if (!title || !description || !date || !time || !location || !category) {
      return NextResponse.json({ success: false, message: "All fields are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const newEvent: Omit<Event, "_id"> = {
      title,
      description,
      date,
      time,
      location,
      category,
      status: user.role === "admin" ? "active" : "pending",
      banner,
      createdBy: new ObjectId(user._id!),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("events").insertOne(newEvent)

    return NextResponse.json({
      success: true,
      message: "Event created successfully",
      event: {
        id: result.insertedId.toString(),
        ...newEvent,
      },
    })
  } catch (error) {
    console.error("Create event error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
