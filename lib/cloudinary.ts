import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  resource_type: string
}

export async function uploadToCloudinary(
  file: Buffer | string,
  options: {
    folder?: string
    public_id?: string
    transformation?: any
    resource_type?: "image" | "video" | "raw" | "auto"
  } = {},
): Promise<CloudinaryUploadResult> {
  try {
    const uploadOptions = {
      folder: options.folder || "event-management",
      resource_type: options.resource_type || "image",
      ...options,
    }

    const result = await cloudinary.uploader.upload(file as string, uploadOptions)

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
    }
  } catch (error) {
    console.error("Cloudinary upload error:", error)
    throw new Error("Failed to upload image to Cloudinary")
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result.result === "ok"
  } catch (error) {
    console.error("Cloudinary delete error:", error)
    return false
  }
}

export async function deleteMultipleFromCloudinary(
  publicIds: string[],
): Promise<{ deleted: string[]; failed: string[] }> {
  try {
    const result = await cloudinary.api.delete_resources(publicIds)

    const deleted: string[] = []
    const failed: string[] = []

    for (const [publicId, status] of Object.entries(result.deleted)) {
      if (status === "deleted") {
        deleted.push(publicId)
      } else {
        failed.push(publicId)
      }
    }

    return { deleted, failed }
  } catch (error) {
    console.error("Cloudinary bulk delete error:", error)
    return { deleted: [], failed: publicIds }
  }
}

export function extractPublicIdFromUrl(cloudinaryUrl: string): string | null {
  try {
    // Extract public_id from Cloudinary URL
    // Format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.ext
    const urlParts = cloudinaryUrl.split("/")
    const uploadIndex = urlParts.findIndex((part) => part === "upload")

    if (uploadIndex === -1) return null

    // Get everything after version number (or upload if no version)
    let pathAfterUpload = urlParts.slice(uploadIndex + 1)

    // Remove version if present (starts with 'v' followed by numbers)
    if (pathAfterUpload[0] && /^v\d+$/.test(pathAfterUpload[0])) {
      pathAfterUpload = pathAfterUpload.slice(1)
    }

    // Join the remaining parts and remove file extension
    const publicIdWithExt = pathAfterUpload.join("/")
    const lastDotIndex = publicIdWithExt.lastIndexOf(".")

    return lastDotIndex > 0 ? publicIdWithExt.substring(0, lastDotIndex) : publicIdWithExt
  } catch (error) {
    console.error("Error extracting public_id from URL:", error)
    return null
  }
}

export default cloudinary
