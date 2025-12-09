import { kv } from "@vercel/kv"
import { NextRequest, NextResponse } from "next/server"
import { localKV } from "@/lib/local-kv"
import bcrypt from "bcryptjs"

export const runtime = "edge"

// Use Vercel KV/Upstash in production, local storage in development
const isProduction = !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL)

// Rate limiting configuration
const MAX_LOGIN_ATTEMPTS = 5 // Max attempts before lockout
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes lockout
const ATTEMPT_WINDOW = 15 * 60 * 1000 // 15 minute window for counting attempts

interface RateLimitData {
  attempts: number
  firstAttempt: number
  lockedUntil?: number
}

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
}

// Get client IP for rate limiting
function getClientIP(request: NextRequest): string {
  // Try various headers that might contain the real IP
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }
  const realIP = request.headers.get("x-real-ip")
  if (realIP) {
    return realIP
  }
  // Fallback - in production this might not be accurate
  return "unknown"
}

// Check and update rate limit
async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remainingAttempts?: number; lockedUntil?: number }> {
  const key = `ratelimit:${ip}`
  const now = Date.now()
  
  const data = await storage.get<RateLimitData>(key)
  
  // Check if currently locked out
  if (data?.lockedUntil && data.lockedUntil > now) {
    const remainingSeconds = Math.ceil((data.lockedUntil - now) / 1000)
    return { allowed: false, lockedUntil: data.lockedUntil }
  }
  
  // Reset if window has expired
  if (!data || (now - data.firstAttempt) > ATTEMPT_WINDOW) {
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS }
  }
  
  // Check remaining attempts
  if (data.attempts >= MAX_LOGIN_ATTEMPTS) {
    // Lock the account
    const lockedUntil = now + LOCKOUT_DURATION
    await storage.set(key, { ...data, lockedUntil })
    return { allowed: false, lockedUntil }
  }
  
  return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - data.attempts }
}

// Record a failed login attempt
async function recordFailedAttempt(ip: string): Promise<{ remainingAttempts: number; locked: boolean }> {
  const key = `ratelimit:${ip}`
  const now = Date.now()
  
  const data = await storage.get<RateLimitData>(key)
  
  let newData: RateLimitData
  
  if (!data || (now - data.firstAttempt) > ATTEMPT_WINDOW) {
    // Start fresh window
    newData = { attempts: 1, firstAttempt: now }
  } else {
    // Increment attempts
    newData = { ...data, attempts: data.attempts + 1 }
    
    // Check if we should lock
    if (newData.attempts >= MAX_LOGIN_ATTEMPTS) {
      newData.lockedUntil = now + LOCKOUT_DURATION
    }
  }
  
  await storage.set(key, newData)
  
  return {
    remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - newData.attempts),
    locked: !!newData.lockedUntil
  }
}

// Clear rate limit on successful login
async function clearRateLimit(ip: string): Promise<void> {
  const key = `ratelimit:${ip}`
  await storage.del(key)
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
      // Check rate limiting first
      const clientIP = getClientIP(request)
      const rateLimit = await checkRateLimit(clientIP)
      
      if (!rateLimit.allowed) {
        const remainingTime = rateLimit.lockedUntil 
          ? Math.ceil((rateLimit.lockedUntil - Date.now()) / 1000 / 60) 
          : 15
        return NextResponse.json({ 
          error: `Too many failed attempts. Please try again in ${remainingTime} minute${remainingTime !== 1 ? 's' : ''}.`,
          locked: true,
          lockedUntil: rateLimit.lockedUntil
        }, { status: 429 })
      }
      
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
        // Record failed attempt
        const attemptResult = await recordFailedAttempt(clientIP)
        
        if (attemptResult.locked) {
          return NextResponse.json({ 
            error: `Too many failed attempts. Account locked for 15 minutes.`,
            locked: true
          }, { status: 429 })
        }
        
        return NextResponse.json({ 
          error: `Invalid password. ${attemptResult.remainingAttempts} attempt${attemptResult.remainingAttempts !== 1 ? 's' : ''} remaining.`,
          remainingAttempts: attemptResult.remainingAttempts
        }, { status: 401 })
      }
      
      // Clear failed attempts on successful login
      await clearRateLimit(clientIP)
      
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
