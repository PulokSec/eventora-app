import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { deleteFromCloudinary, extractPublicIdFromUrl } from "@/lib/cloudinary"

export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Authentication required" }, { status: 401 })
    }

    const { imageUrl, publicId } = await request.json()

    if (!imageUrl && !publicId) {
      return NextResponse.json({ success: false, message: "Image URL or public ID required" }, { status: 400 })
    }

    let targetPublicId = publicId

    // Extract public_id from URL if not provided
    if (!targetPublicId && imageUrl) {
      targetPublicId = extractPublicIdFromUrl(imageUrl)
    }

    if (!targetPublicId) {
      return NextResponse.json({ success: false, message: "Could not determine image public ID" }, { status: 400 })
    }

    // Delete from Cloudinary
    const deleted = await deleteFromCloudinary(targetPublicId)

    if (deleted) {
      return NextResponse.json({
        success: true,
        message: "Image deleted successfully",
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to delete image from Cloudinary",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Image delete error:", error)
    return NextResponse.json({ success: false, message: "Failed to delete image" }, { status: 500 })
  }
}
