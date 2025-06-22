import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Authentication required" }, { status: 401 })
    }

    const notificationId = params.id
    if (!ObjectId.isValid(notificationId)) {
      return NextResponse.json({ success: false, message: "Invalid notification ID" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const result = await db.collection("notifications").updateOne(
      {
        _id: new ObjectId(notificationId),
        userId: new ObjectId(user._id!),
      },
      {
        $set: { read: true },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
    })
  } catch (error) {
    console.error("Mark notification as read error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
