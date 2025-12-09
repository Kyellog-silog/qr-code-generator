"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Copy, Check } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

interface QRPreviewProps {
  qrCodeUrl: string | null
  isGenerating: boolean
  copiedImage: boolean
  copiedSvg: boolean
  onDownloadPNG: () => void
  onDownloadSVG: () => void
  onCopyImage: () => void
  onCopySVG: () => void
}

export function QRPreview({
  qrCodeUrl,
  isGenerating,
  copiedImage,
  copiedSvg,
  onDownloadPNG,
  onDownloadSVG,
  onCopyImage,
  onCopySVG,
}: QRPreviewProps) {
  return (
    <Card className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-border shadow-xl">
      <CardContent className="flex-1 flex items-center justify-center p-8">
        <div className="w-full flex flex-col items-center gap-6">
          <div className="aspect-square w-full max-w-[280px] bg-white rounded-2xl flex items-center justify-center shadow-inner p-4 relative overflow-hidden">
            {isGenerating && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                <Spinner className="h-8 w-8 text-primary" />
              </div>
            )}
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="Generated QR Code"
                className="max-w-full max-h-full object-contain transition-opacity duration-300"
                style={{ opacity: isGenerating ? 0.5 : 1 }}
              />
            ) : (
              <div className="text-muted-foreground text-center">
                <div className="w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <p className="text-sm">Enter text to generate QR code</p>
              </div>
            )}
          </div>

          {qrCodeUrl && (
            <div className="w-full max-w-[280px] space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={onDownloadPNG}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                >
                  <Download className="h-4 w-4" />
                  PNG
                </Button>
                <Button
                  onClick={onDownloadSVG}
                  variant="outline"
                  className="flex-1 border-border hover:bg-muted gap-2"
                >
                  <Download className="h-4 w-4" />
                  SVG
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={onCopyImage}
                  variant="secondary"
                  className="flex-1 gap-2 transition-all duration-200"
                  disabled={copiedImage}
                >
                  {copiedImage ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Image
                    </>
                  )}
                </Button>
                <Button
                  onClick={onCopySVG}
                  variant="outline"
                  className="flex-1 border-border hover:bg-muted gap-2 transition-all duration-200"
                  disabled={copiedSvg}
                >
                  {copiedSvg ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy SVG
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
