"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Eye, EyeOff, Check, AlertCircle } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SetupPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState("")

  // Check if already set up
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await fetch("/api/auth?action=status")
        const data = await res.json()
        
        if (data.isSetup) {
          // Already set up, redirect to home
          router.push("/")
        }
      } catch (err) {
        console.error("Failed to check setup status:", err)
      } finally {
        setChecking(false)
      }
    }
    
    checkSetup()
  }, [router])

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup", password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to set up password")
        return
      }

      // Success - redirect to home
      router.push("/")
    } catch (err) {
      setError("Failed to set up password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = () => {
    if (password.length === 0) return null
    if (password.length < 6) return { text: "Too short", color: "text-red-500" }
    if (password.length < 8) return { text: "Fair", color: "text-yellow-500" }
    if (password.length < 12) return { text: "Good", color: "text-emerald-500" }
    return { text: "Strong", color: "text-green-500" }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Checking setup status...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 transition-colors duration-500 flex items-center justify-center">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-border shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full w-fit">
            <Lock className="h-8 w-8 text-emerald-500" />
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Set Up Your Password
          </CardTitle>
          <CardDescription>
            Create a password to protect your QR codes and links.
            You&apos;ll need this password to create dynamic QR codes and manage your links.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a secure password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordStrength() && (
                <p className={`text-xs ${passwordStrength()?.color}`}>
                  Strength: {passwordStrength()?.text}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="pr-10"
                />
                {confirmPassword && password === confirmPassword && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
              disabled={loading || !password || !confirmPassword}
            >
              {loading ? "Setting up..." : "Create Password"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              This password protects access to creating dynamic QR codes and managing your links.
              Make sure to remember it!
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
