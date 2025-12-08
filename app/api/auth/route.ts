import { kv } from "@vercel/kv"
import { NextRequest, NextResponse } from "next/server"
import { localKV } from "@/lib/local-kv"
import bcrypt from "bcryptjs"

export const runtime = "edge"

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
}

// Session token generation
function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Session expiry: 7 days
const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000

interface AuthData {
  passwordHash: string
  createdAt: number
}

interface SessionData {
  createdAt: number
  expiresAt: number
}

// GET - Check auth status and if setup is needed
export async function GET(request: NextRequest) {
  const action = new URL(request.url).searchParams.get("action")
  
  // Check if password is set up
  if (action === "status") {
    const authData = await storage.get<AuthData>("auth:password")
    const isSetup = !!authData?.passwordHash
    
    // Check if user has valid session
    const sessionToken = request.cookies.get("session")?.value
    let isAuthenticated = false
    
    if (sessionToken) {
      const session = await storage.get<SessionData>(`session:${sessionToken}`)
      if (session && session.expiresAt > Date.now()) {
        isAuthenticated = true
      }
    }
    
    return NextResponse.json({ isSetup, isAuthenticated })
  }
  
  // Verify current session
  if (action === "verify") {
    const sessionToken = request.cookies.get("session")?.value
    
    if (!sessionToken) {
      return NextResponse.json({ authenticated: false })
    }
    
    const session = await storage.get<SessionData>(`session:${sessionToken}`)
    
    if (!session || session.expiresAt < Date.now()) {
      return NextResponse.json({ authenticated: false })
    }
    
    return NextResponse.json({ authenticated: true })
  }
  
  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}

// POST - Setup password, login, or logout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, password } = body
    
    // Setup initial password
    if (action === "setup") {
      // Check if password already exists
      const existing = await storage.get<AuthData>("auth:password")
      if (existing?.passwordHash) {
        return NextResponse.json({ error: "Password already set up" }, { status: 400 })
      }
      
      if (!password || password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
      }
      
      // Hash password with bcrypt (10 rounds)
      const passwordHash = await bcrypt.hash(password, 10)
      
      const authData: AuthData = {
        passwordHash,
        createdAt: Date.now(),
      }
      
      await storage.set("auth:password", authData)
      
      // Create session
      const sessionToken = generateSessionToken()
      const sessionData: SessionData = {
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_EXPIRY,
      }
      
      await storage.set(`session:${sessionToken}`, sessionData)
      
      const response = NextResponse.json({ success: true })
      response.cookies.set("session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_EXPIRY / 1000,
        path: "/",
      })
      
      return response
    }
    
    // Login with password
    if (action === "login") {
      const authData = await storage.get<AuthData>("auth:password")
      
      if (!authData?.passwordHash) {
        return NextResponse.json({ error: "Password not set up yet" }, { status: 400 })
      }
      
      if (!password) {
        return NextResponse.json({ error: "Password required" }, { status: 400 })
      }
      
      // Verify password
      const isValid = await bcrypt.compare(password, authData.passwordHash)
      
      if (!isValid) {
        return NextResponse.json({ error: "Invalid password" }, { status: 401 })
      }
      
      // Create session
      const sessionToken = generateSessionToken()
      const sessionData: SessionData = {
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_EXPIRY,
      }
      
      await storage.set(`session:${sessionToken}`, sessionData)
      
      const response = NextResponse.json({ success: true })
      response.cookies.set("session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_EXPIRY / 1000,
        path: "/",
      })
      
      return response
    }
    
    // Logout
    if (action === "logout") {
      const sessionToken = request.cookies.get("session")?.value
      
      // Optionally delete session from storage
      if (sessionToken) {
        // We could delete it, but for edge runtime we'll just let it expire
        // await storage.del(`session:${sessionToken}`)
      }
      
      const response = NextResponse.json({ success: true })
      response.cookies.delete("session")
      
      return response
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Auth error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
