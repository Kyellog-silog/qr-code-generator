"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Eye, EyeOff, AlertCircle, X } from "lucide-react"

interface PasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  title?: string
  description?: string
}

export function PasswordModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  title = "Enter Password",
  description = "Enter your password to continue"
}: PasswordModalProps) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Invalid password")
        return
      }

      setPassword("")
      onSuccess()
    } catch (err) {
      setError("Failed to authenticate. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setPassword("")
    setError("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border-border shadow-2xl">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="mx-auto mb-2 p-2 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full w-fit">
            <Lock className="h-6 w-6 text-emerald-500" />
          </div>
          <CardTitle className="text-center">{title}</CardTitle>
          <CardDescription className="text-center">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="modal-password">Password</Label>
              <div className="relative">
                <Input
                  id="modal-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                disabled={loading || !password}
              >
                {loading ? "Verifying..." : "Continue"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
