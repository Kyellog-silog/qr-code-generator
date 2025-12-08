"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Plus, 
  Trash2, 
  Edit2, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw,
  Link as LinkIcon,
  MousePointer2,
  ArrowLeft,
  QrCode,
  X,
  Download
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"

interface LinkData {
  slug: string
  destination: string
  createdAt: number
  updatedAt: number
  clicks: number
  qrCode?: string
}

export default function AdminPage() {
  const [links, setLinks] = useState<LinkData[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [isLocal, setIsLocal] = useState(false)
  const [viewingQR, setViewingQR] = useState<LinkData | null>(null)
  
  // Form states
  const [editDestination, setEditDestination] = useState("")
  const [error, setError] = useState("")

  const fetchLinks = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/links")
      const data = await res.json()
      if (data.links) {
        setLinks(data.links)
      }
      if (data.isLocal !== undefined) {
        setIsLocal(data.isLocal)
      }
    } catch (err) {
      console.error("Failed to fetch links:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLinks()
  }, [])

  const updateLink = async (slug: string) => {
    if (!editDestination.trim()) {
      setError("Destination is required")
      return
    }

    try {
      const res = await fetch("/api/links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, destination: editDestination.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to update link")
        return
      }

      setEditingSlug(null)
      setEditDestination("")
      fetchLinks()
    } catch (err) {
      setError("Failed to update link")
    }
  }

  const deleteLink = async (slug: string) => {
    if (!confirm(`Delete /${slug}? This cannot be undone.`)) return

    try {
      const res = await fetch(`/api/links?slug=${slug}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to delete link")
        return
      }

      fetchLinks()
    } catch (err) {
      setError("Failed to delete link")
    }
  }

  const copyLink = async (slug: string) => {
    const url = `${window.location.origin}/r/${slug}`
    await navigator.clipboard.writeText(url)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  const downloadQR = (link: LinkData) => {
    if (!link.qrCode) return
    const a = document.createElement("a")
    a.href = link.qrCode
    a.download = `qr-${link.slug}.png`
    a.click()
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-background p-4 transition-colors duration-500">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to QR Generator
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Link Manager
          </h1>
          <p className="text-muted-foreground mt-2">
            Create permanent short URLs with changeable destinations
          </p>
          {isLocal && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">
              <p className="text-yellow-600 dark:text-yellow-400 font-medium">⚠️ Running in Local Mode</p>
              <p className="text-yellow-600/80 dark:text-yellow-400/80 text-xs mt-1">
                Data is stored in memory and will be lost when the server restarts. Deploy to Vercel with KV for persistent storage.
              </p>
            </div>
          )}
        </div>

        {/* Links List */}
        <Card className="bg-card/80 backdrop-blur-sm border-border shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-secondary" />
                Your Links
              </CardTitle>
              <CardDescription>
                {links.length} link{links.length !== 1 ? "s" : ""} total
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchLinks} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                Loading links...
              </div>
            ) : links.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <LinkIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No links yet. Create your first one above!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {links.map((link) => (
                  <div
                    key={link.slug}
                    className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-lg font-semibold text-secondary">/r/{link.slug}</code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => copyLink(link.slug)}
                          >
                            {copiedSlug === link.slug ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <a
                            href={`/r/${link.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>

                        {editingSlug === link.slug ? (
                          <div className="flex gap-2 mt-2">
                            <Input
                              value={editDestination}
                              onChange={(e) => setEditDestination(e.target.value)}
                              placeholder="New destination URL"
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={() => updateLink(link.slug)}
                              className="bg-gradient-to-r from-emerald-500 to-cyan-500"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingSlug(null)
                                setEditDestination("")
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground truncate">
                            → {link.destination}
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MousePointer2 className="h-3 w-3" />
                            {link.clicks} click{link.clicks !== 1 ? "s" : ""}
                          </span>
                          <span>Updated: {formatDate(link.updatedAt)}</span>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        {link.qrCode && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-secondary hover:text-secondary"
                            onClick={() => setViewingQR(link)}
                            title="View QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingSlug(link.slug)
                            setEditDestination(link.destination)
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteLink(link.slug)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* QR Code Modal */}
      {viewingQR && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-card/95 backdrop-blur-sm border-border shadow-2xl max-w-md w-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-secondary" />
                  QR Code
                </CardTitle>
                <CardDescription>
                  /r/{viewingQR.slug}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewingQR(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {viewingQR.qrCode ? (
                <>
                  <div className="p-4 bg-white rounded-xl shadow-lg">
                    <img
                      src={viewingQR.qrCode}
                      alt={`QR code for ${viewingQR.slug}`}
                      className="w-64 h-64"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center max-w-xs truncate">
                    → {viewingQR.destination}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => downloadQR(viewingQR)}
                      className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        copyLink(viewingQR.slug)
                        setViewingQR(null)
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">No QR code saved for this link</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
