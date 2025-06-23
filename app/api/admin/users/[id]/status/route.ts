import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { Notification } from "@/lib/schemas"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request, "admin")
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Admin access required" }, { status: 401 })
    }

    const userId = params.id
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 })
    }

    // Prevent admin from changing their own status
    if (userId === user._id!.toString()) {
      return NextResponse.json({ success: false, message: "Cannot change your own account status" }, { status: 400 })
    }

    const body = await request.json()
    const { status } = body

    // Validate status
    const validStatuses = ["active", "suspended"]
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status. Must be either 'active' or 'suspended'" },
        { status: 400 },
      )
    }

    const { db } = await connectToDatabase()

    // Check if user exists
    const existingUser = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    if (!existingUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Check if status is actually changing
    if (existingUser.status === status) {
      return NextResponse.json({
        success: true,
        message: `User status is already ${status}`,
        data: { userId, status },
      })
    }

    // Update user status
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          status: status,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "Failed to update user status" }, { status: 500 })
    }

    // If user is being suspended, update their events to pending status
    if (status === "suspended") {
      await db.collection("events").updateMany(
        {
          createdBy: new ObjectId(userId),
          status: "active",
        },
        {
          $set: {
            status: "pending",
            updatedAt: new Date(),
          },
        },
      )
    }

    // Create notification for the user
    const notificationMessage =
      status === "suspended"
        ? "Your account has been suspended. Please contact support for assistance."
        : "Your account has been reactivated. You can now access all features."

    const notification: Omit<Notification, "_id"> = {
      userId: new ObjectId(userId),
      title: `Account ${status === "suspended" ? "Suspended" : "Reactivated"}`,
      message: notificationMessage,
      type: "status_change",
      read: false,
      createdAt: new Date(),
    }

    await db.collection("notifications").insertOne(notification)

    return NextResponse.json({
      success: true,
      message: `User status updated to ${status} successfully`,
      data: {
        userId,
        status,
        previousStatus: existingUser.status,
        eventsAffected: status === "suspended" ? "Active events moved to pending" : "No events affected",
      },
    })
  } catch (error) {
    console.error("Update user status error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
