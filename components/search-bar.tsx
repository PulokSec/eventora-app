"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const handleSearch = async () => {
    try {
      // Dummy API call
      const response = await fetch(`/api/events/search?q=${searchQuery}&category=${selectedCategory}`)
      console.log("Search results:", await response.json())
    } catch (error) {
      console.error("Search failed:", error)
    }
  }

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "technology", label: "Technology" },
    { value: "business", label: "Business" },
    { value: "arts", label: "Arts & Culture" },
    { value: "sports", label: "Sports" },
    { value: "music", label: "Music" },
    { value: "education", label: "Education" },
    { value: "food", label: "Food & Drink" },
  ]

  return (
    <div className="flex gap-2 w-full max-w-md">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 bg-white"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-12 px-4 bg-white border-slate-200 hover:bg-slate-50">
            <Filter className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {categories.map((category) => (
            <DropdownMenuItem
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={selectedCategory === category.value ? "bg-blue-50 text-blue-600" : ""}
            >
              {category.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        onClick={handleSearch}
        className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
      >
        Search
      </Button>
    </div>
  )
}
