import { kv } from "@vercel/kv"
import { NextRequest, NextResponse } from "next/server"
import { localKV } from "@/lib/local-kv"

export const runtime = "edge"

interface LinkData {
  slug: string
  destination: string
  createdAt: number
  updatedAt: number
  clicks: number
  status: "draft" | "active"
  qrCode?: string // Base64 data URL of the QR code image
}

interface SessionData {
  createdAt: number
  expiresAt: number
}

// Use Vercel KV/Upstash in production, local storage in development
const isProduction = !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL)

// Storage abstraction
const storage = {
  async get<T>(key: string): Promise<T | null> {
    if (isProduction) {
      return await kv.get<T>(key)
    }
    return localKV.get(key) as T | null
  },
  async set(key: string, value: unknown): Promise<void> {
    if (isProduction) {
      await kv.set(key, value)
    } else {
      localKV.set(key, value)
    }
  },
  async del(key: string): Promise<void> {
    if (isProduction) {
      await kv.del(key)
    } else {
      localKV.del(key)
    }
  },
  async keys(pattern: string): Promise<string[]> {
    if (isProduction) {
      return await kv.keys(pattern)
    }
    return localKV.keys(pattern)
  }
}

// Session-based authentication check
const isAuthorized = async (request: NextRequest): Promise<boolean> => {
  const sessionToken = request.cookies.get("session")?.value
  
  if (!sessionToken) {
    return false
  }
  
  const session = await storage.get<SessionData>(`session:${sessionToken}`)
  
  if (!session || session.expiresAt < Date.now()) {
    return false
  }
  
  return true
}

// GET - List all links or get a specific link
export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const slug = searchParams.get("slug")

  try {
    if (slug) {
      // Get specific link
      const linkData = await storage.get<LinkData>(`link:${slug}`)
      if (!linkData) {
        return NextResponse.json({ error: "Link not found" }, { status: 404 })
      }
      return NextResponse.json({ ...linkData, slug })
    }

    // List all links
    const keys = await storage.keys("link:*")
    const links: LinkData[] = []

    for (const key of keys) {
      const data = await storage.get<Omit<LinkData, "slug">>(key)
      if (data) {
        links.push({
          slug: key.replace("link:", ""),
          ...data,
        })
      }
    }

    // Sort by most recent
    links.sort((a, b) => b.updatedAt - a.updatedAt)

    return NextResponse.json({ links, isLocal: !isProduction })
  } catch (error) {
    console.error("Error fetching links:", error)
    return NextResponse.json({ error: "Failed to fetch links" }, { status: 500 })
  }
}

// POST - Create a new link
export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { slug, destination, status: linkStatus = "active", qrCode } = body

    if (!slug || !destination) {
      return NextResponse.json(
        { error: "slug and destination are required" },
        { status: 400 }
      )
    }

    // Validate slug format (alphanumeric, hyphens, underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "slug can only contain letters, numbers, hyphens, and underscores" },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existing = await storage.get(`link:${slug}`)
    if (existing) {
      return NextResponse.json(
        { error: "slug already exists" },
        { status: 409 }
      )
    }

    // Validate destination URL
    try {
      new URL(destination)
    } catch {
      return NextResponse.json(
        { error: "destination must be a valid URL" },
        { status: 400 }
      )
    }

    const now = Date.now()
    const linkData: Omit<LinkData, "slug"> = {
      destination,
      createdAt: now,
      updatedAt: now,
      clicks: 0,
      status: linkStatus === "draft" ? "draft" : "active",
      ...(qrCode && { qrCode }), // Store QR code if provided
    }

    await storage.set(`link:${slug}`, linkData)

    // Build redirect URL for response
    const baseUrl = request.headers.get("origin") || request.headers.get("host") || ""
    const protocol = baseUrl.startsWith("localhost") ? "http" : "https"
    const redirectUrl = baseUrl ? `${protocol}://${baseUrl.replace(/^https?:\/\//, "")}/r/${slug}` : `/r/${slug}`

    return NextResponse.json({ slug, redirectUrl, ...linkData }, { status: 201 })
  } catch (error) {
    console.error("Error creating link:", error)
    return NextResponse.json({ error: "Failed to create link" }, { status: 500 })
  }
}

// PUT - Update an existing link's destination
export async function PUT(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { slug, destination, status: newStatus, qrCode } = body

    if (!slug) {
      return NextResponse.json(
        { error: "slug is required" },
        { status: 400 }
      )
    }

    // Check if link exists
    const existing = await storage.get<Omit<LinkData, "slug">>(`link:${slug}`)
    if (!existing) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 })
    }

    // Validate destination URL if provided
    if (destination) {
      try {
        new URL(destination)
      } catch {
        return NextResponse.json(
          { error: "destination must be a valid URL" },
          { status: 400 }
        )
      }
    }

    const updatedData = {
      ...existing,
      ...(destination && { destination }),
      ...(newStatus && { status: newStatus }),
      ...(qrCode && { qrCode }), // Update QR code if provided
      updatedAt: Date.now(),
    }

    await storage.set(`link:${slug}`, updatedData)

    return NextResponse.json({ slug, ...updatedData })
  } catch (error) {
    console.error("Error updating link:", error)
    return NextResponse.json({ error: "Failed to update link" }, { status: 500 })
  }
}

// DELETE - Remove a link
export async function DELETE(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get("slug")

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 })
    }

    const existing = await storage.get(`link:${slug}`)
    if (!existing) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 })
    }

    await storage.del(`link:${slug}`)

    return NextResponse.json({ success: true, deleted: slug })
  } catch (error) {
    console.error("Error deleting link:", error)
    return NextResponse.json({ error: "Failed to delete link" }, { status: 500 })
  }
}
