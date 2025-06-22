import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, "admin")
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Admin access required" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search")
    const role = searchParams.get("role")
    const status = searchParams.get("status")

    const { db } = await connectToDatabase()

    // Build filter
    const filter: any = {}
    if (search) {
      filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }]
    }
    if (role && role !== "all") {
      filter.role = role
    }
    if (status && status !== "all") {
      filter.status = status
    }

    // Get users with stats
    const skip = (page - 1) * limit
    const users = await db
      .collection("users")
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "events",
            localField: "_id",
            foreignField: "createdBy",
            as: "events",
          },
        },
        {
          $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "userId",
            as: "subscriptions",
          },
        },
        {
          $addFields: {
            eventsCreated: { $size: "$events" },
            eventsSubscribed: { $size: "$subscriptions" },
          },
        },
        {
          $project: {
            password: 0,
            events: 0,
            subscriptions: 0,
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ])
      .toArray()

    const total = await db.collection("users").countDocuments(filter)

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
