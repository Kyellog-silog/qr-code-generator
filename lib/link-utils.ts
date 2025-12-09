/**
 * Shared utility functions for link type detection, parsing, and building
 * Used by both QR generator and admin pages
 */

// ============================================
// TYPE DETECTION
// ============================================

/**
 * Check if a URL is a phone link (tel:)
 */
export function isPhoneUrl(url: string): boolean {
  return url.toLowerCase().startsWith("tel:")
}

/**
 * Check if a URL is an SMS link (sms: or smsto:)
 */
export function isSmsUrl(url: string): boolean {
  return url.toLowerCase().startsWith("sms:") || url.toLowerCase().startsWith("smsto:")
}

/**
 * Check if a URL is a Google Maps location link
 */
export function isLocationUrl(url: string): boolean {
  return url.includes("google.com/maps") || url.includes("maps.google.com") || url.includes("goo.gl/maps") || url.includes("maps.app.goo.gl")
}

/**
 * Check if a URL is a standard HTTP/HTTPS URL
 */
export function isHttpUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://")
}

/**
 * Check if a URL is a shortened Google Maps link
 */
export function isShortenedMapsUrl(url: string): boolean {
  return url.includes("goo.gl") || url.includes("maps.app.goo.gl")
}

/**
 * Get the type of a link for categorization/filtering
 */
export type LinkType = "url" | "phone" | "sms" | "location"

export function getLinkType(destination: string): LinkType {
  if (isPhoneUrl(destination)) return "phone"
  if (isSmsUrl(destination)) return "sms"
  if (isLocationUrl(destination)) return "location"
  return "url"
}

// ============================================
// PARSING
// ============================================

/**
 * Parse a tel: URL to extract the phone number
 */
export function parsePhoneUrl(url: string): string {
  return url.replace(/^tel:/i, "")
}

/**
 * Parse an SMS URL to extract number and optional message
 */
export function parseSmsUrl(url: string): { number: string; message?: string } {
  const cleaned = url.replace(/^(sms:|smsto:)/i, "")
  
  // Format: sms:+1234567890?body=Hello
  if (cleaned.includes("?body=")) {
    const [number, rest] = cleaned.split("?body=")
    return { number, message: decodeURIComponent(rest || "") }
  }
  
  // Format: smsto:+1234567890:Hello
  if (cleaned.includes(":")) {
    const [number, message] = cleaned.split(":")
    return { number, message }
  }
  
  return { number: cleaned }
}

/**
 * Parse a Google Maps URL to extract coordinates or address
 */
export function parseLocationUrl(url: string): { 
  type: "coordinates" | "address"
  lat?: string
  lng?: string
  address?: string 
} | null {
  // Pattern: ?q=lat,lng (coordinates)
  const coordMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (coordMatch) {
    return { type: "coordinates", lat: coordMatch[1], lng: coordMatch[2] }
  }
  
  // Pattern: @lat,lng in URL
  const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (atMatch) {
    return { type: "coordinates", lat: atMatch[1], lng: atMatch[2] }
  }
  
  // Pattern: /search/?api=1&query=address
  const addressMatch = url.match(/query=([^&]+)/)
  if (addressMatch) {
    return { type: "address", address: decodeURIComponent(addressMatch[1]) }
  }
  
  return null
}

/**
 * Parse coordinates from various Google Maps URL formats
 */
export function parseCoordinatesFromUrl(url: string): { lat: string; lng: string } | null {
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

// ============================================
// BUILDING
// ============================================

/**
 * Build a tel: URL from a phone number
 */
export function buildPhoneUrl(phone: string): string {
  const cleanPhone = phone.replace(/^tel:/i, "").trim()
  if (!cleanPhone) return ""
  return `tel:${cleanPhone}`
}

/**
 * Build an SMS URL
 */
export function buildSmsUrl(number: string, message?: string): string {
  const cleanNumber = number.replace(/^(sms:|smsto:)/i, "").trim()
  if (!cleanNumber) return ""
  if (message) {
    return `sms:${cleanNumber}?body=${encodeURIComponent(message)}`
  }
  return `sms:${cleanNumber}`
}

/**
 * Build a Google Maps URL from address or coordinates
 */
export function buildLocationUrl(
  type: "address" | "coordinates", 
  options: { address?: string; lat?: string; lng?: string }
): string {
  if (type === "coordinates" && options.lat && options.lng) {
    return `https://www.google.com/maps?q=${options.lat},${options.lng}`
  }
  if (type === "address" && options.address) {
    const cleanAddress = options.address
      .split(/[\n\r]+/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join(", ")
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddress)}`
  }
  return ""
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate a phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "")
  if (!cleaned) return false
  return /^\+?[0-9]{6,15}$/.test(cleaned)
}

/**
 * Validate coordinates
 */
export function isValidCoordinates(lat: string, lng: string): boolean {
  const latNum = parseFloat(lat)
  const lngNum = parseFloat(lng)
  return !isNaN(latNum) && !isNaN(lngNum) && 
         latNum >= -90 && latNum <= 90 && 
         lngNum >= -180 && lngNum <= 180
}

/**
 * Validate a URL format (basic check)
 */
export function isValidUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  const hasValidDomain = trimmed.includes(".") && trimmed.length > 3
  const noSpaces = !trimmed.includes(" ")
  return hasValidDomain && noSpaces
}

// ============================================
// SANITIZATION (XSS Prevention)
// ============================================

/**
 * Allowed URL protocols for destinations
 */
const ALLOWED_PROTOCOLS = ["http:", "https:", "tel:", "sms:", "smsto:", "geo:", "mailto:"]

/**
 * Sanitize a destination URL to prevent XSS attacks
 * Returns null if the URL is invalid/dangerous
 */
export function sanitizeDestination(destination: string): string | null {
  if (!destination || typeof destination !== "string") {
    return null
  }
  
  const trimmed = destination.trim()
  if (!trimmed) return null
  
  // Check for javascript: or other dangerous protocols
  const lowerDest = trimmed.toLowerCase()
  
  // Block javascript:, data:, vbscript:, etc.
  if (lowerDest.startsWith("javascript:") || 
      lowerDest.startsWith("data:") || 
      lowerDest.startsWith("vbscript:")) {
    return null
  }
  
  // If it's a protocol we recognize, allow it
  for (const protocol of ALLOWED_PROTOCOLS) {
    if (lowerDest.startsWith(protocol)) {
      return trimmed
    }
  }
  
  // If no protocol, assume https
  if (!trimmed.includes("://")) {
    return `https://${trimmed}`
  }
  
  // Unknown protocol - block it
  return null
}

/**
 * Format a destination for display (truncate if too long)
 */
export function formatDestinationForDisplay(destination: string, maxLength = 50): string {
  if (destination.length <= maxLength) return destination
  return destination.substring(0, maxLength - 3) + "..."
}
