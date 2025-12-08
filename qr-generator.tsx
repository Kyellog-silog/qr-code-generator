"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import QRCode from "qrcode"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Smartphone, Phone, MessageSquare, MapPin, Globe, Link, Copy, Check, History, Trash2, QrCode } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface QRData {
  text: string
  url: string
  phone: string
  location: {
    latitude: string
    longitude: string
    mapsUrl: string
    address: string
    inputType: "link" | "coordinates" | "address"
  }
}

interface QRHistoryItem {
  id: string
  type: string
  data: string
  timestamp: number
  qrCodeUrl: string
}

interface QRColors {
  foreground: string
  background: string
}

// Predefined color options
const colorPresets = {
  foreground: [
    { label: "Black", value: "#000000" },
    { label: "Navy", value: "#1e3a5f" },
    { label: "Forest", value: "#1a4d2e" },
    { label: "Maroon", value: "#6b1c1c" },
    { label: "Purple", value: "#4a1a6b" },
    { label: "Slate", value: "#0f172a" },
  ],
  background: [
    { label: "White", value: "#ffffff" },
    { label: "Cream", value: "#fefce8" },
    { label: "Mint", value: "#f0fdf4" },
    { label: "Lavender", value: "#faf5ff" },
    { label: "Sky", value: "#f0f9ff" },
    { label: "Rose", value: "#fff1f2" },
  ],
}

export default function QRGenerator() {
  const [activeTab, setActiveTab] = useState("text")
  const [qrData, setQRData] = useState<QRData>({
    text: "",
    url: "",
    phone: "",
    location: { latitude: "", longitude: "", mapsUrl: "", address: "", inputType: "address" },
  })
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("M")
  const [size, setSize] = useState(256)
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [qrColors, setQrColors] = useState<QRColors>({ foreground: "#000000", background: "#ffffff" })
  const [history, setHistory] = useState<QRHistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [validationState, setValidationState] = useState<"idle" | "valid" | "invalid">("idle")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("qr-history")
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory)
        // Validate structure before setting
        if (Array.isArray(parsed) && parsed.every(item => 
          typeof item.id === 'string' && 
          typeof item.type === 'string' &&
          typeof item.data === 'string' &&
          typeof item.timestamp === 'number'
        )) {
          setHistory(parsed)
        }
      } catch {
        // Invalid JSON, clear corrupted data
        localStorage.removeItem("qr-history")
      }
    }
  }, [])

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

  // Check if input looks like a Google Maps URL
  const isGoogleMapsUrl = (input: string): boolean => {
    return input.includes("google.com/maps") || 
           input.includes("maps.google.com") || 
           input.includes("goo.gl") || 
           input.includes("maps.app.goo.gl")
  }

  // Handle Maps URL input and extract coordinates if possible
  const handleMapsUrlChange = (url: string) => {
    // Try to parse coordinates from the URL
    const coords = parseCoordinatesFromUrl(url)
    
    if (coords) {
      // Full URL with coordinates - extract them and clear other fields
      setQRData(prev => ({
        ...prev,
        location: {
          mapsUrl: url,
          latitude: coords.lat,
          longitude: coords.lng,
          address: "",
          inputType: "coordinates",
        }
      }))
    } else {
      // Shortened URL or no coordinates found - use direct link
      setQRData(prev => ({
        ...prev,
        location: {
          mapsUrl: url,
          address: "",
          latitude: "",
          longitude: "",
          inputType: "link",
        }
      }))
    }
  }

  // Handle plain address input
  const handleAddressChange = (address: string) => {
    setQRData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        address: address,
        // Clear other fields when typing address
        mapsUrl: "",
        latitude: "",
        longitude: "",
        inputType: "address",
      }
    }))
  }

  // Handle coordinate input
  const handleCoordinateChange = (field: "latitude" | "longitude", value: string) => {
    setQRData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value,
        // Clear other fields when entering coordinates
        address: "",
        mapsUrl: "",
        inputType: "coordinates",
      }
    }))
  }

  // Clear all location fields
  const clearLocationFields = () => {
    setQRData(prev => ({
      ...prev,
      location: {
        latitude: "",
        longitude: "",
        mapsUrl: "",
        address: "",
        inputType: "address",
      }
    }))
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
        const { inputType, mapsUrl, latitude, longitude, address } = qrData.location
        
        // If using a direct Google Maps link
        if (inputType === "link" && mapsUrl.trim()) {
          return mapsUrl.trim()
        }
        
        // If using coordinates
        if (inputType === "coordinates" && latitude && longitude) {
          return `https://www.google.com/maps?q=${latitude},${longitude}`
        }
        
        // If using a plain text address - encode it for Google Maps search
        if (inputType === "address" && address.trim()) {
          // Clean up the address: remove extra whitespace, normalize line breaks
          const cleanAddress = address
            .split(/[\n\r]+/)
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join(", ")
          return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddress)}`
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
        const { inputType, mapsUrl, latitude, longitude, address } = qrData.location
        // Valid if we have an address, a direct link, OR coordinates
        return (inputType === "address" && address.trim().length > 0) ||
               (inputType === "link" && mapsUrl.trim().length > 0) ||
               ((inputType === "coordinates") && latitude.trim().length > 0 && longitude.trim().length > 0)
      default:
        return false
    }
  }

  // Validate input based on type
  const validateInput = useCallback(() => {
    if (!hasValidContent()) {
      setValidationState("idle")
      return
    }
    
    switch (activeTab) {
      case "url":
        // Simple URL validation - avoid complex regex that can freeze
        const url = qrData.url.trim()
        const hasValidDomain = url.includes(".") && url.length > 3
        const noSpaces = !url.includes(" ")
        setValidationState(hasValidDomain && noSpaces ? "valid" : "invalid")
        break
      case "phone":
        // Simple phone validation
        const phone = qrData.phone.replace(/[\s\-\(\)\.]/g, "")
        const isValidPhone = /^\+?[0-9]{6,15}$/.test(phone)
        setValidationState(isValidPhone ? "valid" : "invalid")
        break
      case "location":
        const { inputType: locType, mapsUrl: locUrl, latitude: locLat, longitude: locLng, address: locAddr } = qrData.location
        if (locType === "link") {
          setValidationState(locUrl.includes("google") || locUrl.includes("goo.gl") ? "valid" : "invalid")
        } else if (locType === "coordinates") {
          const lat = parseFloat(locLat)
          const lng = parseFloat(locLng)
          setValidationState(lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 ? "valid" : "invalid")
        } else if (locType === "address") {
          // Address is valid if it has some content (at least 5 chars for a basic address)
          setValidationState(locAddr.trim().length >= 5 ? "valid" : "invalid")
        }
        break
      default:
        setValidationState("valid")
    }
  }, [activeTab, qrData])

  useEffect(() => {
    validateInput()
  }, [validateInput])

  const generateQRCode = async () => {
    const qrString = generateQRString()
    if (!qrString.trim()) {
      setQrCodeUrl("")
      return
    }

    setIsGenerating(true)
    
    try {
      const canvas = canvasRef.current
      if (canvas) {
        await QRCode.toCanvas(canvas, qrString, {
          errorCorrectionLevel: errorLevel,
          width: size,
          margin: 2,
          color: {
            dark: qrColors.foreground,
            light: qrColors.background,
          },
        })

        const dataUrl = canvas.toDataURL()
        setQrCodeUrl(dataUrl)
      }
    } catch (error) {
      console.error("Error generating QR code:", error)
    } finally {
      setTimeout(() => setIsGenerating(false), 300)
    }
  }

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement("a")
      link.download = `qr-code-${activeTab}.png`
      link.href = qrCodeUrl
      link.click()
      // Save to history on download
      addToHistory()
    }
  }

  const copyToClipboard = async () => {
    const qrString = generateQRString()
    if (qrString) {
      await navigator.clipboard.writeText(qrString)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      // Save to history on copy
      addToHistory()
    }
  }

  const addToHistory = () => {
    const qrString = generateQRString()
    if (!qrString || !qrCodeUrl) return

    // Check if this exact data already exists in history (avoid duplicates)
    const existingIndex = history.findIndex(item => item.data === qrString)
    if (existingIndex === 0) return // Already the most recent, skip

    const newItem: QRHistoryItem = {
      id: Date.now().toString(),
      type: activeTab,
      data: qrString,
      timestamp: Date.now(),
      qrCodeUrl: qrCodeUrl,
    }

    // Remove duplicate if exists elsewhere in history
    const filteredHistory = history.filter(item => item.data !== qrString)
    const updatedHistory = [newItem, ...filteredHistory].slice(0, 10) // Keep last 10
    setHistory(updatedHistory)
    localStorage.setItem("qr-history", JSON.stringify(updatedHistory))
  }

  const removeFromHistory = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id)
    setHistory(updatedHistory)
    localStorage.setItem("qr-history", JSON.stringify(updatedHistory))
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem("qr-history")
  }

  const loadFromHistory = (item: QRHistoryItem) => {
    setActiveTab(item.type)
    // Restore the data based on type
    if (item.type === "text") {
      setQRData(prev => ({ ...prev, text: item.data }))
    } else if (item.type === "url") {
      const url = item.data.replace(/^https?:\/\//, "")
      setQRData(prev => ({ ...prev, url }))
    } else if (item.type === "phone") {
      const phone = item.data.replace("tel:", "")
      setQRData(prev => ({ ...prev, phone }))
    }
    setShowHistory(false)
  }

  useEffect(() => {
    generateQRCode()
  }, [qrData, activeTab, errorLevel, size, qrColors])

  const updateQRData = (field: string, value: any) => {
    setQRData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const updateNestedQRData = (parent: keyof QRData, field: string, value: string | boolean) => {
    setQRData((prev) => {
      const parentValue = prev[parent]
      if (typeof parentValue === "object" && parentValue !== null) {
        return {
          ...prev,
          [parent]: {
            ...parentValue,
            [field]: value,
          },
        }
      }
      return prev
    })
  }

  const getValidationClasses = () => {
    if (validationState === "valid") return "border-green-500 focus:border-green-500 focus:ring-green-500/20"
    if (validationState === "invalid") return "border-red-500 focus:border-red-500 focus:ring-red-500/20"
    return "border-border focus:border-secondary focus:ring-secondary/20"
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "text": return <MessageSquare className="h-3 w-3" />
      case "url": return <Globe className="h-3 w-3" />
      case "phone": return <Phone className="h-3 w-3" />
      case "location": return <MapPin className="h-3 w-3" />
      default: return <QrCode className="h-3 w-3" />
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 transition-colors duration-500">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-balance bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent animate-gradient">
            QR Code Generator
          </h1>
          <p className="text-muted-foreground text-lg leading-[150%] tracking-[-0.1px]">
            Create stunning QR codes for different types of content
          </p>
        </div>

        {/* History Toggle Button */}
        {history.length > 0 && (
          <div className="flex justify-center mb-6">
            <Button
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
              className="border-border hover:bg-muted transition-all duration-300"
            >
              <History className="h-4 w-4 mr-2" />
              {showHistory ? "Hide History" : `Recent QR Codes (${history.length})`}
            </Button>
          </div>
        )}

        {/* History Section */}
        {showHistory && history.length > 0 && (
          <Card className="mb-8 bg-card/50 backdrop-blur-sm border-border shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <CardHeader className="border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <History className="h-5 w-5 text-secondary" />
                  Recent QR Codes
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Click to restore or delete
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="group relative bg-muted/50 border border-border rounded-lg p-3 cursor-pointer hover:bg-muted hover:shadow-lg transition-all duration-300 hover:scale-105"
                    onClick={() => loadFromHistory(item)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-secondary">{getTypeIcon(item.type)}</span>
                      <span className="text-xs uppercase text-muted-foreground font-medium">{item.type}</span>
                    </div>
                    <img
                      src={item.qrCodeUrl}
                      alt="QR Code"
                      className="w-full aspect-square rounded bg-white"
                    />
                    <p className="text-xs text-muted-foreground mt-2 truncate">{item.data}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFromHistory(item.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Input Section */}
          <Card className="bg-card/80 backdrop-blur-sm border-border shadow-2xl shadow-black/10 dark:shadow-black/30 hover:shadow-3xl transition-shadow duration-500">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Smartphone className="h-5 w-5 text-secondary" />
                QR Code Content
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Choose the type of content and fill in the details
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 mb-6 mt-2 bg-muted border border-border p-1">
                  <TabsTrigger
                    value="text"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white text-muted-foreground hover:text-foreground transition-all duration-300"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="url"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white text-muted-foreground hover:text-foreground transition-all duration-300"
                  >
                    <Globe className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="phone"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white text-muted-foreground hover:text-foreground transition-all duration-300"
                  >
                    <Phone className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="location"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white text-muted-foreground hover:text-foreground transition-all duration-300"
                  >
                    <MapPin className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4 animate-in fade-in-50 duration-300">
                  <div>
                    <Label className="text-foreground font-medium" htmlFor="text">
                      Text Content
                    </Label>
                    <Textarea
                      className={`bg-input text-foreground placeholder:text-muted-foreground transition-all duration-300 ${getValidationClasses()}`}
                      id="text"
                      placeholder="Enter your text here..."
                      value={qrData.text}
                      onChange={(e) => updateQRData("text", e.target.value)}
                      rows={4}
                    />
                    {validationState === "valid" && hasValidContent() && (
                      <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Valid text content
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="url" className="space-y-4 animate-in fade-in-50 duration-300">
                  <div>
                    <Label className="text-foreground font-medium" htmlFor="url">
                      Website URL
                    </Label>
                    <Input
                      className={`bg-input text-foreground placeholder:text-muted-foreground transition-all duration-300 ${getValidationClasses()}`}
                      id="url"
                      placeholder="example.com or https://example.com"
                      value={qrData.url}
                      onChange={(e) => updateQRData("url", e.target.value)}
                    />
                    {validationState === "valid" && hasValidContent() && (
                      <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Valid URL format
                      </p>
                    )}
                    {validationState === "invalid" && hasValidContent() && (
                      <p className="text-xs text-red-500 mt-1">Please enter a valid URL</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="phone" className="space-y-4 animate-in fade-in-50 duration-300">
                  <div>
                    <Label className="text-foreground font-medium" htmlFor="phone">
                      Phone Number
                    </Label>
                    <Input
                      className={`bg-input text-foreground placeholder:text-muted-foreground transition-all duration-300 ${getValidationClasses()}`}
                      id="phone"
                      placeholder="+1234567890"
                      value={qrData.phone}
                      onChange={(e) => updateQRData("phone", e.target.value)}
                    />
                    {validationState === "valid" && hasValidContent() && (
                      <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Valid phone format
                      </p>
                    )}
                    {validationState === "invalid" && hasValidContent() && (
                      <p className="text-xs text-red-500 mt-1">Please enter a valid phone number</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="location" className="space-y-4 animate-in fade-in-50 duration-300">
                  {/* Header with Clear Button */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Fill in <span className="font-medium text-foreground">one</span> of the options below. Editing any field will clear the others.
                    </p>
                    {hasValidContent() && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearLocationFields}
                        className="text-xs text-muted-foreground hover:text-destructive h-7 px-2"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>

                  {/* Address Input - Primary */}
                  <div className={`p-3 rounded-lg border transition-all duration-300 ${qrData.location.inputType === "address" && qrData.location.address ? "border-secondary bg-secondary/5" : "border-transparent"}`}>
                    <Label className="text-foreground font-medium" htmlFor="address">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Street Address
                        {qrData.location.inputType === "address" && qrData.location.address && (
                          <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">Active</span>
                        )}
                      </div>
                    </Label>
                    <Textarea
                      className={`bg-input text-foreground placeholder:text-muted-foreground transition-all duration-300 mt-2 ${qrData.location.inputType === "address" && qrData.location.address ? getValidationClasses() : "border-border"}`}
                      id="address"
                      placeholder="Enter full address, e.g.:&#10;151 W. 30th St, 3rd Floor&#10;New York, NY 10001"
                      value={qrData.location.address}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Works with Google Maps and Apple Maps on all devices
                    </p>
                    {validationState === "valid" && qrData.location.inputType === "address" && hasValidContent() && (
                      <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Valid address
                      </p>
                    )}
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">or</span>
                    </div>
                  </div>

                  {/* Google Maps Link */}
                  <div className={`p-3 rounded-lg border transition-all duration-300 ${(qrData.location.inputType === "link" || qrData.location.inputType === "coordinates") && qrData.location.mapsUrl ? "border-secondary bg-secondary/5" : "border-transparent"}`}>
                    <Label className="text-foreground font-medium" htmlFor="maps-url">
                      <div className="flex items-center gap-2">
                        <Link className="h-4 w-4" />
                        Google Maps Link
                        {qrData.location.inputType === "link" && qrData.location.mapsUrl && (
                          <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">Active</span>
                        )}
                      </div>
                    </Label>
                    <Input
                      className={`bg-input text-foreground placeholder:text-muted-foreground transition-all duration-300 mt-2 ${qrData.location.inputType === "link" && qrData.location.mapsUrl ? getValidationClasses() : "border-border"}`}
                      id="maps-url"
                      placeholder="Paste Google Maps share link (e.g., https://maps.app.goo.gl/...)"
                      value={qrData.location.mapsUrl}
                      onChange={(e) => handleMapsUrlChange(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {qrData.location.mapsUrl && isShortenedMapsUrl(qrData.location.mapsUrl) 
                        ? "Shortened link detected - will be used directly"
                        : "Paste any Google Maps link"}
                    </p>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">or</span>
                    </div>
                  </div>

                  {/* Coordinates */}
                  <div className={`p-3 rounded-lg border transition-all duration-300 ${qrData.location.inputType === "coordinates" && (qrData.location.latitude || qrData.location.longitude) ? "border-secondary bg-secondary/5" : "border-transparent"}`}>
                    <Label className="text-foreground font-medium">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-4 w-4" />
                        Coordinates
                        {qrData.location.inputType === "coordinates" && qrData.location.latitude && qrData.location.longitude && (
                          <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">Active</span>
                        )}
                      </div>
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-foreground text-xs" htmlFor="latitude">
                          Latitude
                        </Label>
                        <Input
                          className={`bg-input text-foreground placeholder:text-muted-foreground transition-all duration-300 ${qrData.location.inputType === "coordinates" && qrData.location.latitude ? getValidationClasses() : "border-border"}`}
                          id="latitude"
                          placeholder="40.7128"
                          value={qrData.location.latitude}
                          onChange={(e) => handleCoordinateChange("latitude", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-foreground text-xs" htmlFor="longitude">
                          Longitude
                        </Label>
                        <Input
                          className={`bg-input text-foreground placeholder:text-muted-foreground transition-all duration-300 ${qrData.location.inputType === "coordinates" && qrData.location.longitude ? getValidationClasses() : "border-border"}`}
                          id="longitude"
                          placeholder="-74.0060"
                          value={qrData.location.longitude}
                          onChange={(e) => handleCoordinateChange("longitude", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Active Selection Summary */}
                  {hasValidContent() && (
                    <div className="p-3 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-secondary/30 rounded-lg">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">Using:</span>{" "}
                        {qrData.location.inputType === "address" && qrData.location.address
                          ? `Address search: "${qrData.location.address.split('\n')[0]}..."`
                          : qrData.location.inputType === "link" && qrData.location.mapsUrl
                          ? "Direct Google Maps link"
                          : `Coordinates: ${qrData.location.latitude}, ${qrData.location.longitude}`}
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

                {/* Color Customization */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground">QR Code Colors</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-foreground font-medium text-xs">Foreground</Label>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {colorPresets.foreground.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setQrColors(prev => ({ ...prev, foreground: color.value }))}
                            className={`w-7 h-7 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                              qrColors.foreground === color.value ? "border-secondary ring-2 ring-secondary/30" : "border-border"
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.label}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-foreground font-medium text-xs">Background</Label>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {colorPresets.background.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setQrColors(prev => ({ ...prev, background: color.value }))}
                            className={`w-7 h-7 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                              qrColors.background === color.value ? "border-secondary ring-2 ring-secondary/30" : "border-border"
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.label}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Display Section */}
          <Card className="bg-card/80 backdrop-blur-sm border-border shadow-2xl shadow-black/10 dark:shadow-black/30 hover:shadow-3xl transition-all duration-500">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-foreground flex items-center gap-2">
                <QrCode className="h-5 w-5 text-secondary" />
                Generated QR Code
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {hasValidContent() ? "Scan with your device or download the image" : "Enter content on the left to generate a QR code"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4 pt-6">
              {/* QR Code Display */}
              <div 
                className={`relative p-6 rounded-2xl shadow-inner border border-border transition-all duration-500 ${
                  isGenerating ? "scale-95 opacity-50" : "scale-100 opacity-100"
                }`}
                style={{ backgroundColor: qrColors.background }}
              >
                {hasValidContent() ? (
                  <canvas 
                    ref={canvasRef} 
                    className={`max-w-full h-auto transition-all duration-300 ${isGenerating ? "blur-sm" : "blur-0"}`}
                    style={{ imageRendering: "pixelated" }} 
                  />
                ) : (
                  /* Empty State Placeholder */
                  <div className="w-48 h-48 flex flex-col items-center justify-center text-center">
                    <div className="w-32 h-32 border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-3">
                      <QrCode className="h-12 w-12 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-400">Your QR code will appear here</p>
                  </div>
                )}
                
                {/* Generating Animation Overlay */}
                {isGenerating && hasValidContent() && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {hasValidContent() && qrCodeUrl && (
                <div className="w-full space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Button
                    onClick={downloadQRCode}
                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-medium py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download QR Code
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={copyToClipboard}
                    className="w-full border-border hover:bg-muted transition-all duration-300"
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Data
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Preview Data */}
              {hasValidContent() && (
                <div className="w-full animate-in fade-in duration-300">
                  <Label className="text-foreground font-medium">Preview Data:</Label>
                  <div className="mt-2 p-3 bg-muted/50 border border-border rounded-md text-sm font-mono break-all max-h-32 overflow-y-auto text-secondary">
                    {generateQRString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
