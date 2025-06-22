import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request, "admin")
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Admin access required" }, { status: 401 })
    }

    const userId = params.id
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 })
    }

    const { role, status } = await request.json()

    const { db } = await connectToDatabase()

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (role) updateData.role = role
    if (status) updateData.status = status

    const result = await db.collection("users").updateOne({ _id: new ObjectId(userId) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
    })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await requireAuth(request, "admin")
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Admin access required" }, { status: 401 })
    }

    const userId = params.id
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Get user data before deletion to clean up images
    const userToDelete = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    if (!userToDelete) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Get all events created by this user to delete their images
    const userEvents = await db
      .collection("events")
      .find({ createdBy: new ObjectId(userId) })
      .toArray()

    // Delete user avatar from Cloudinary if exists
    const imagesToDelete: string[] = []

    if (userToDelete.avatar) {
      try {
        const { extractPublicIdFromUrl } = await import("@/lib/cloudinary")
        const avatarPublicId = extractPublicIdFromUrl(userToDelete.avatar)
        if (avatarPublicId) {
          imagesToDelete.push(avatarPublicId)
        }
      } catch (error) {
        console.error("Failed to extract avatar public ID:", error)
      }
    }

    // Collect event banner public IDs
    for (const event of userEvents) {
      if (event.banner) {
        try {
          const { extractPublicIdFromUrl } = await import("@/lib/cloudinary")
          const bannerPublicId = extractPublicIdFromUrl(event.banner)
          if (bannerPublicId) {
            imagesToDelete.push(bannerPublicId)
          }
        } catch (error) {
          console.error("Failed to extract banner public ID:", error)
        }
      }
    }

    // Delete images from Cloudinary
    if (imagesToDelete.length > 0) {
      try {
        const { deleteMultipleFromCloudinary } = await import("@/lib/cloudinary")
        await deleteMultipleFromCloudinary(imagesToDelete)
      } catch (cloudinaryError) {
        console.error("Failed to delete images from Cloudinary:", cloudinaryError)
        // Continue with user deletion even if image deletion fails
      }
    }

    // Delete user and related data
    await Promise.all([
      db.collection("users").deleteOne({ _id: new ObjectId(userId) }),
      db.collection("events").deleteMany({ createdBy: new ObjectId(userId) }),
      db.collection("subscriptions").deleteMany({ userId: new ObjectId(userId) }),
      db.collection("notifications").deleteMany({ userId: new ObjectId(userId) }),
    ])

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
