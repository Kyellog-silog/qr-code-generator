import { NextRequest, NextResponse } from "next/server"
import { storage, isProduction } from "@/lib/storage"
import { localKV } from "@/lib/local-kv"

export const runtime = "edge"

interface LinkData {
  destination: string
  createdAt: number
  updatedAt: number
  clicks: number
}

async function getLink(slug: string): Promise<LinkData | null> {
  return storage.get<LinkData>(`link:${slug}`)
}

async function incrementClicks(slug: string): Promise<void> {
  if (isProduction) {
    storage.hincrby(`link:${slug}`, "clicks", 1).catch(() => {})
  } else {
    const data = localKV.get(`link:${slug}`) as LinkData | null
    if (data) {
      data.clicks++
      localKV.set(`link:${slug}`, data)
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    // Get the link data
    const linkData = await getLink(slug)

    if (!linkData) {
      // Redirect to home page or show 404
      return NextResponse.redirect(new URL("/", request.url))
    }

    // Increment click count (fire and forget)
    incrementClicks(slug)

    // Redirect to the destination
    return NextResponse.redirect(linkData.destination, { status: 307 })
  } catch (error) {
    console.error("Redirect error:", error)
    return NextResponse.redirect(new URL("/", request.url))
  }
}
