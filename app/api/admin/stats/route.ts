import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request, "admin")
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Admin access required" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get basic stats
    const [totalUsers, totalEvents, totalSubscriptions] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("events").countDocuments(),
      db.collection("subscriptions").countDocuments(),
    ])

    // Get events by status
    const eventsByStatus = await db
      .collection("events")
      .aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()

    // Get events by category
    const eventsByCategory = await db
      .collection("events")
      .aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()

    // Get user growth (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const userGrowth = await db
      .collection("users")
      .aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ])
      .toArray()

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalEvents,
        totalSubscriptions,
        activeEvents: eventsByStatus.find((s) => s._id === "active")?.count || 0,
        eventsByStatus,
        eventsByCategory,
        userGrowth,
      },
    })
  } catch (error) {
    console.error("Get admin stats error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
