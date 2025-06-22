import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Authentication required" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get user's subscribed events
    const subscriptions = await db
      .collection("subscriptions")
      .aggregate([
        { $match: { userId: new ObjectId(user._id!) } },
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "event",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "event.createdBy",
            foreignField: "_id",
            as: "creator",
          },
        },
        {
          $addFields: {
            event: { $arrayElemAt: ["$event", 0] },
            creator: { $arrayElemAt: ["$creator", 0] },
          },
        },
        {
          $project: {
            "event._id": 1,
            "event.title": 1,
            "event.description": 1,
            "event.date": 1,
            "event.time": 1,
            "event.location": 1,
            "event.category": 1,
            "event.status": 1,
            "event.banner": 1,
            "creator.name": 1,
            "creator.email": 1,
            createdAt: 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .toArray()

    return NextResponse.json({
      success: true,
      subscriptions,
    })
  } catch (error) {
    console.error("Get user subscriptions error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
