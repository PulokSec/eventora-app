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

    // Get user's events
    const events = await db
      .collection("events")
      .aggregate([
        { $match: { createdBy: new ObjectId(user._id!) } },
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
        { $sort: { createdAt: -1 } },
      ])
      .toArray()

    return NextResponse.json({
      success: true,
      events,
    })
  } catch (error) {
    console.error("Get user events error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
