import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Dummy user stats
    const stats = {
      myEvents: 5,
      subscribedEvents: 12,
      upcomingEvents: 8,
    }

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
