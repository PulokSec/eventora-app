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

    // Prevent admin from changing their own role
    if (userId === user._id!.toString()) {
      return NextResponse.json({ success: false, message: "Cannot change your own role" }, { status: 400 })
    }

    const body = await request.json()
    const { role } = body

    // Validate role
    const validRoles = ["admin", "user"]
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, message: "Invalid role. Must be either 'admin' or 'user'" },
        { status: 400 },
      )
    }

    const { db } = await connectToDatabase()

    // Check if user exists
    const existingUser = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    if (!existingUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Check if role is actually changing
    if (existingUser.role === role) {
      return NextResponse.json({
        success: true,
        message: `User role is already ${role}`,
        data: { userId, role },
      })
    }

    // Additional validation: Check if we're trying to remove the last admin
    if (existingUser.role === "admin" && role === "user") {
      const adminCount = await db.collection("users").countDocuments({
        role: "admin",
        status: "active",
        _id: { $ne: new ObjectId(userId) },
      })

      if (adminCount === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Cannot remove admin role. At least one admin must remain in the system.",
          },
          { status: 400 },
        )
      }
    }

    // Update user role
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          role: role,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "Failed to update user role" }, { status: 500 })
    }

    // If user is being demoted from admin to user, update their pending events to active
    // If user is being promoted to admin, their events can remain as is
    let eventsUpdated = 0
    if (existingUser.role === "admin" && role === "user") {
      // When demoting from admin, no special event handling needed
      // Their events remain with current status
    } else if (existingUser.role === "user" && role === "admin") {
      // When promoting to admin, activate their pending events
      const updateResult = await db.collection("events").updateMany(
        {
          createdBy: new ObjectId(userId),
          status: "pending",
        },
        {
          $set: {
            status: "active",
            updatedAt: new Date(),
          },
        },
      )
      eventsUpdated = updateResult.modifiedCount
    }

    // Create notification for the user
    const notificationMessage =
      role === "admin"
        ? "Congratulations! You have been granted administrator privileges. You now have access to admin features."
        : "Your role has been changed to regular user. Some administrative features may no longer be available."

    const notification: Omit<Notification, "_id"> = {
      userId: new ObjectId(userId),
      title: `Role Updated to ${role === "admin" ? "Administrator" : "User"}`,
      message: notificationMessage,
      type: "status_change",
      read: false,
      createdAt: new Date(),
    }

    await db.collection("notifications").insertOne(notification)

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role} successfully`,
      data: {
        userId,
        role,
        previousRole: existingUser.role,
        eventsUpdated: eventsUpdated > 0 ? `${eventsUpdated} pending events activated` : "No events affected",
      },
    })
  } catch (error) {
    console.error("Update user role error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
