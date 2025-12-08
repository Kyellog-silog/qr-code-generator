"use client"

import { useState, useEffect, useRef } from "react"
import QRCode from "qrcode"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Smartphone, Phone, MessageSquare, MapPin, Globe, Link } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface QRData {
  text: string
  url: string
  phone: string
  location: {
    latitude: string
    longitude: string
    mapsUrl: string
    useDirectLink: boolean
  }
}

export default function QRGenerator() {
  const [activeTab, setActiveTab] = useState("text")
  const [qrData, setQRData] = useState<QRData>({
    text: "",
    url: "",
    phone: "",
    location: { latitude: "", longitude: "", mapsUrl: "", useDirectLink: true },
  })
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("M")
  const [size, setSize] = useState(256)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Parse coordinates from various Google Maps URL formats
  const parseCoordinatesFromUrl = (url: string): { lat: string; lng: string } | null => {
    try {
      // Pattern 1: @lat,lng in URL (e.g., @40.7128,-74.0060)
      const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/
      const atMatch = url.match(atPattern)
      if (atMatch) {
        return { lat: atMatch[1], lng: atMatch[2] }
      }

      // Pattern 2: ?q=lat,lng or place/lat,lng
      const qPattern = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/
      const qMatch = url.match(qPattern)
      if (qMatch) {
        return { lat: qMatch[1], lng: qMatch[2] }
      }

      // Pattern 3: /place/.../@lat,lng
      const placePattern = /place\/[^/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/
      const placeMatch = url.match(placePattern)
      if (placeMatch) {
        return { lat: placeMatch[1], lng: placeMatch[2] }
      }

      // Pattern 4: ll=lat,lng
      const llPattern = /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/
      const llMatch = url.match(llPattern)
      if (llMatch) {
        return { lat: llMatch[1], lng: llMatch[2] }
      }

      // Pattern 5: destination=lat,lng
      const destPattern = /destination=(-?\d+\.?\d*),(-?\d+\.?\d*)/
      const destMatch = url.match(destPattern)
      if (destMatch) {
        return { lat: destMatch[1], lng: destMatch[2] }
      }

      return null
    } catch {
      return null
    }
  }

  // Check if URL is a shortened Google Maps link
  const isShortenedMapsUrl = (url: string): boolean => {
    return url.includes("goo.gl") || url.includes("maps.app.goo.gl")
  }

  // Handle Maps URL input and extract coordinates if possible
  const handleMapsUrlChange = (url: string) => {
    // Try to parse coordinates from the URL
    const coords = parseCoordinatesFromUrl(url)
    
    if (coords) {
      // Full URL with coordinates - extract them
      setQRData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          mapsUrl: url,
          latitude: coords.lat,
          longitude: coords.lng,
          useDirectLink: false, // Use coordinates since we have them
        }
      }))
    } else {
      // Shortened URL or no coordinates found - use direct link
      setQRData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          mapsUrl: url,
          useDirectLink: true, // Use the URL directly
        }
      }))
    }
  }

  const generateQRString = () => {
    switch (activeTab) {
      case "text":
        return qrData.text
      case "url":
        return qrData.url.startsWith("http") ? qrData.url : `https://${qrData.url}`
      case "phone":
        return qrData.phone.trim() ? `tel:${qrData.phone}` : ""
      case "location":
        // If using direct link (shortened URL or user preference)
        if (qrData.location.useDirectLink && qrData.location.mapsUrl.trim()) {
          return qrData.location.mapsUrl.trim()
        }
        // Use coordinates to generate a universal Google Maps URL
        const lat = qrData.location.latitude
        const lng = qrData.location.longitude
        if (lat && lng) {
          return `https://www.google.com/maps?q=${lat},${lng}`
        }
        return ""
      default:
        return ""
    }
  }

  const hasValidContent = () => {
    switch (activeTab) {
      case "text":
        return qrData.text.trim().length > 0
      case "url":
        return qrData.url.trim().length > 0
      case "phone":
        return qrData.phone.trim().length > 0
      case "location":
        // Valid if we have a direct link OR coordinates
        return (qrData.location.useDirectLink && qrData.location.mapsUrl.trim().length > 0) ||
               (qrData.location.latitude.trim().length > 0 && qrData.location.longitude.trim().length > 0)
      default:
        return false
    }
  }

  const generateQRCode = async () => {
    const qrString = generateQRString()
    if (!qrString.trim()) return

    try {
      const canvas = canvasRef.current
      if (canvas) {
        await QRCode.toCanvas(canvas, qrString, {
          errorCorrectionLevel: errorLevel,
          width: size,
          margin: 2,
          color: {
            dark: "#0f172a", // slate-900
            light: "#ffffff",
          },
        })

        const dataUrl = canvas.toDataURL()
        setQrCodeUrl(dataUrl)
      }
    } catch (error) {
      console.error("Error generating QR code:", error)
    }
  }

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement("a")
      link.download = `qr-code-${activeTab}.png`
      link.href = qrCodeUrl
      link.click()
    }
  }

  useEffect(() => {
    generateQRCode()
  }, [qrData, activeTab, errorLevel, size])

  const updateQRData = (field: string, value: any) => {
    setQRData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const updateNestedQRData = (parent: string, field: string, value: any) => {
    setQRData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof QRData],
        [field]: value,
      },
    }))
  }

  return (
    <div className="min-h-screen bg-background p-4 transition-colors duration-300">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 text-balance">QR Code Generator</h1>
          <p className="text-muted-foreground text-lg leading-[150%] tracking-[-0.1px]">
            Create stunning QR codes for different types of content
          </p>
        </div>

        <div className={`grid gap-8 ${hasValidContent() ? "lg:grid-cols-2" : "lg:grid-cols-1 max-w-2xl mx-auto"}`}>
          {/* Input Section */}
          <Card className="bg-card border-border shadow-2xl">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Smartphone className="h-5 w-5 text-secondary" />
                QR Code Content
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Choose the type of content and fill in the details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 mb-6 bg-muted border border-border p-1">
                  <TabsTrigger
                    value="text"
                    className="data-[state=active]:bg-foreground data-[state=active]:text-background text-muted-foreground hover:text-foreground transition-all duration-200"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="url"
                    className="data-[state=active]:bg-foreground data-[state=active]:text-background text-muted-foreground hover:text-foreground transition-all duration-200"
                  >
                    <Globe className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="phone"
                    className="data-[state=active]:bg-foreground data-[state=active]:text-background text-muted-foreground hover:text-foreground transition-all duration-200"
                  >
                    <Phone className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="location"
                    className="data-[state=active]:bg-foreground data-[state=active]:text-background text-muted-foreground hover:text-foreground transition-all duration-200"
                  >
                    <MapPin className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <div>
                    <Label className="text-foreground font-medium" htmlFor="text">
                      Text Content
                    </Label>
                    <Textarea
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-secondary focus:ring-secondary/20"
                      id="text"
                      placeholder="Enter your text here..."
                      value={qrData.text}
                      onChange={(e) => updateQRData("text", e.target.value)}
                      rows={4}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="url" className="space-y-4">
                  <div>
                    <Label className="text-foreground font-medium" htmlFor="url">
                      Website URL
                    </Label>
                    <Input
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-secondary focus:ring-secondary/20"
                      id="url"
                      placeholder="example.com or https://example.com"
                      value={qrData.url}
                      onChange={(e) => updateQRData("url", e.target.value)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="phone" className="space-y-4">
                  <div>
                    <Label className="text-foreground font-medium" htmlFor="phone">
                      Phone Number
                    </Label>
                    <Input
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-secondary focus:ring-secondary/20"
                      id="phone"
                      placeholder="+1234567890"
                      value={qrData.phone}
                      onChange={(e) => updateQRData("phone", e.target.value)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="location" className="space-y-4">
                  <div>
                    <Label className="text-foreground font-medium" htmlFor="maps-url">
                      <div className="flex items-center gap-2">
                        <Link className="h-4 w-4" />
                        Google Maps Link
                      </div>
                    </Label>
                    <Input
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-secondary focus:ring-secondary/20"
                      id="maps-url"
                      placeholder="Paste Google Maps share link (e.g., https://maps.app.goo.gl/...)"
                      value={qrData.location.mapsUrl}
                      onChange={(e) => handleMapsUrlChange(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {isShortenedMapsUrl(qrData.location.mapsUrl) 
                        ? "✓ Shortened link detected - will be used directly in QR code"
                        : "Paste any Google Maps link - coordinates will be extracted if available"}
                    </p>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">or enter coordinates manually</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-foreground font-medium" htmlFor="latitude">
                        Latitude
                      </Label>
                      <Input
                        className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-secondary focus:ring-secondary/20"
                        id="latitude"
                        placeholder="40.7128"
                        value={qrData.location.latitude}
                        onChange={(e) => {
                          updateNestedQRData("location", "latitude", e.target.value)
                          updateNestedQRData("location", "useDirectLink", false)
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-foreground font-medium" htmlFor="longitude">
                        Longitude
                      </Label>
                      <Input
                        className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-secondary focus:ring-secondary/20"
                        id="longitude"
                        placeholder="-74.0060"
                        value={qrData.location.longitude}
                        onChange={(e) => {
                          updateNestedQRData("location", "longitude", e.target.value)
                          updateNestedQRData("location", "useDirectLink", false)
                        }}
                      />
                    </div>
                  </div>
                  
                  {hasValidContent() && (
                    <div className="p-3 bg-muted/50 border border-border rounded-md">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">QR Code will contain:</span>{" "}
                        {qrData.location.useDirectLink && qrData.location.mapsUrl
                          ? "Direct Google Maps link (works on all devices)"
                          : "Universal coordinates link (works on iOS & Android)"}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* QR Code Settings */}
              <div className="mt-6 pt-6 border-t border-border space-y-4">
                <h3 className="font-semibold text-foreground">QR Code Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground font-medium" htmlFor="error-level">
                      Error Correction
                    </Label>
                    <Select value={errorLevel} onValueChange={(value: "L" | "M" | "Q" | "H") => setErrorLevel(value)}>
                      <SelectTrigger className="bg-input border-border text-foreground focus:border-secondary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">Low (7%)</SelectItem>
                        <SelectItem value="M">Medium (15%)</SelectItem>
                        <SelectItem value="Q">Quartile (25%)</SelectItem>
                        <SelectItem value="H">High (30%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-foreground font-medium" htmlFor="size">
                      Size (pixels)
                    </Label>
                    <Select value={size.toString()} onValueChange={(value) => setSize(Number.parseInt(value))}>
                      <SelectTrigger className="bg-input border-border text-foreground focus:border-secondary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="128">128x128</SelectItem>
                        <SelectItem value="256">256x256</SelectItem>
                        <SelectItem value="512">512x512</SelectItem>
                        <SelectItem value="1024">1024x1024</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Display Section - Only show when there's content */}
          {hasValidContent() && (
            <Card className="bg-card border-border shadow-2xl">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-foreground">Generated QR Code</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Scan with your device or download the image
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="bg-white p-6 rounded-xl shadow-inner border border-border">
                  <canvas ref={canvasRef} className="max-w-full h-auto" style={{ imageRendering: "pixelated" }} />
                </div>

                {qrCodeUrl && (
                  <Button
                    onClick={downloadQRCode}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download QR Code
                  </Button>
                )}

                <div className="w-full">
                  <Label className="text-foreground font-medium">Preview Data:</Label>
                  <div className="mt-2 p-3 bg-muted border border-border rounded-md text-sm font-mono break-all max-h-32 overflow-y-auto text-secondary">
                    {generateQRString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
