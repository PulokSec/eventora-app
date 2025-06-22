import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const category = searchParams.get("category") || "all"

    // Dummy search logic
    const allEvents = [
      {
        id: "1",
        title: "Tech Conference 2024",
        description: "Join us for the biggest tech conference of the year.",
        date: "2024-03-15",
        time: "09:00",
        location: "San Francisco Convention Center",
        category: "technology",
      },
    ]

    let filteredEvents = allEvents

    if (query) {
      filteredEvents = filteredEvents.filter(
        (event) =>
          event.title.toLowerCase().includes(query.toLowerCase()) ||
          event.description.toLowerCase().includes(query.toLowerCase()),
      )
    }

    if (category !== "all") {
      filteredEvents = filteredEvents.filter((event) => event.category === category)
    }

    return NextResponse.json({
      success: true,
      events: filteredEvents,
      query,
      category,
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
