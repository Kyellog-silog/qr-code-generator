"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { History, Trash2, QrCode, MessageSquare, Globe, Phone, MapPin } from "lucide-react"

export interface QRHistoryItem {
  id: string
  type: string
  data: string
  timestamp: number
  qrCodeUrl: string
}

interface QRHistoryProps {
  history: QRHistoryItem[]
  showHistory: boolean
  onToggleHistory: () => void
  onClearHistory: () => void
  onRestoreItem: (item: QRHistoryItem) => void
  onDeleteItem: (id: string) => void
}

function getTypeIcon(type: string) {
  switch (type) {
    case "text": return <MessageSquare className="h-3 w-3" />
    case "url": return <Globe className="h-3 w-3" />
    case "phone": return <Phone className="h-3 w-3" />
    case "location": return <MapPin className="h-3 w-3" />
    default: return <QrCode className="h-3 w-3" />
  }
}

function formatHistoryDate(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function QRHistoryToggle({ 
  historyCount, 
  showHistory, 
  onToggle 
}: { 
  historyCount: number
  showHistory: boolean
  onToggle: () => void 
}) {
  if (historyCount === 0) return null

  return (
    <div className="flex justify-center mb-6">
      <Button
        variant="outline"
        onClick={onToggle}
        className="border-border hover:bg-muted transition-all duration-300"
      >
        <History className="h-4 w-4 mr-2" />
        {showHistory ? "Hide History" : `Recent QR Codes (${historyCount})`}
      </Button>
    </div>
  )
}

export function QRHistoryPanel({
  history,
  showHistory,
  onClearHistory,
  onRestoreItem,
  onDeleteItem,
}: Omit<QRHistoryProps, "onToggleHistory">) {
  if (!showHistory || history.length === 0) return null

  return (
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
          onClick={onClearHistory}
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
              className="group relative bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-all duration-200 cursor-pointer border border-transparent hover:border-border"
              onClick={() => onRestoreItem(item)}
            >
              <div className="aspect-square bg-white rounded-md p-2 mb-2 flex items-center justify-center">
                {item.qrCodeUrl ? (
                  <img
                    src={item.qrCodeUrl}
                    alt="QR Code"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <QrCode className="h-8 w-8 text-muted-foreground/50" />
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                {getTypeIcon(item.type)}
                <span className="capitalize">{item.type}</span>
              </div>
              <p className="text-xs text-foreground truncate" title={item.data}>
                {item.data}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {formatHistoryDate(item.timestamp)}
              </p>

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteItem(item.id)
                }}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full bg-destructive/80 text-white hover:bg-destructive"
                title="Delete"
                aria-label="Delete history item"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
