import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { uploadToCloudinary } from "@/lib/cloudinary"

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Authentication required" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string // 'event-banner', 'user-avatar', etc.

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Invalid file type. Only JPEG, PNG, and WebP are allowed" },
        { status: 400 },
      )
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, message: "File size too large. Maximum 5MB allowed" }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Convert buffer to base64 data URL
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`

    // Determine folder based on type
    const folder = type === "user-avatar" ? "event-management/avatars" : "event-management/events"

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(base64, {
      folder,
      transformation:
        type === "user-avatar"
          ? { width: 200, height: 200, crop: "fill", gravity: "face" }
          : { width: 800, height: 400, crop: "fill" },
    })

    return NextResponse.json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
      },
    })
  } catch (error) {
    console.error("Image upload error:", error)
    return NextResponse.json({ success: false, message: "Failed to upload image" }, { status: 500 })
  }
}
