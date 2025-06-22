import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { requireAuth, hashPassword } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Authentication required" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get user stats
    const [eventsCreated, eventsSubscribed] = await Promise.all([
      db.collection("events").countDocuments({ createdBy: new ObjectId(user._id!) }),
      db.collection("subscriptions").countDocuments({ userId: new ObjectId(user._id!) }),
    ])

    return NextResponse.json({
      success: true,
      user: {
        id: user._id!.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        createdAt: user.createdAt,
        stats: {
          eventsCreated,
          eventsSubscribed,
        },
      },
    })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Authentication required" }, { status: 401 })
    }

    const { name, email, currentPassword, newPassword, avatar } = await request.json()

    const { db } = await connectToDatabase()

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (name) updateData.name = name
    if (email) {
      // Check if email is already taken
      const existingUser = await db.collection("users").findOne({ email, _id: { $ne: new ObjectId(user._id!) } })
      if (existingUser) {
        return NextResponse.json({ success: false, message: "Email already taken" }, { status: 400 })
      }
      updateData.email = email
    }
    if (avatar !== undefined) updateData.avatar = avatar

    // Handle password change
    if (currentPassword && newPassword) {
      const { verifyPassword } = await import("@/lib/auth")
      const isValidPassword = await verifyPassword(currentPassword, user.password)
      if (!isValidPassword) {
        return NextResponse.json({ success: false, message: "Current password is incorrect" }, { status: 400 })
      }
      updateData.password = await hashPassword(newPassword)
    }

    await db.collection("users").updateOne({ _id: new ObjectId(user._id!) }, { $set: updateData })

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
