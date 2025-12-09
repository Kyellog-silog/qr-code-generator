"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Settings2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface QRColors {
  foreground: string
  background: string
}

export interface ColorPreset {
  name: string
  foreground: string
  background: string
}

export const colorPresets: ColorPreset[] = [
  { name: "Classic", foreground: "#000000", background: "#ffffff" },
  { name: "Midnight", foreground: "#1e3a5f", background: "#f0f4f8" },
  { name: "Forest", foreground: "#1d4e2c", background: "#e8f5e9" },
  { name: "Ocean", foreground: "#0d47a1", background: "#e3f2fd" },
  { name: "Sunset", foreground: "#bf360c", background: "#fff3e0" },
  { name: "Berry", foreground: "#4a148c", background: "#f3e5f5" },
  { name: "Slate", foreground: "#37474f", background: "#eceff1" },
  { name: "Rose", foreground: "#880e4f", background: "#fce4ec" },
]

interface QRSettingsProps {
  errorLevel: string
  size: number
  colors: QRColors
  onErrorLevelChange: (value: string) => void
  onSizeChange: (value: number) => void
  onColorPreset: (foreground: string, background: string) => void
  onForegroundChange: (color: string) => void
  onBackgroundChange: (color: string) => void
  onResetColors: () => void
}

export function QRSettings({
  errorLevel,
  size,
  colors,
  onErrorLevelChange,
  onSizeChange,
  onColorPreset,
  onForegroundChange,
  onBackgroundChange,
  onResetColors,
}: QRSettingsProps) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border shadow-xl">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-foreground flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-secondary" />
          Settings
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Customize your QR code appearance
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Error Correction Level */}
        <div className="space-y-2">
          <Label className="text-foreground">Error Correction Level</Label>
          <Select value={errorLevel} onValueChange={onErrorLevelChange}>
            <SelectTrigger className="bg-muted/50 border-border focus:ring-ring">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="L">Low (7%)</SelectItem>
              <SelectItem value="M">Medium (15%)</SelectItem>
              <SelectItem value="Q">Quartile (25%)</SelectItem>
              <SelectItem value="H">High (30%)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Higher levels make QR codes more scannable when damaged
          </p>
        </div>

        {/* QR Code Size */}
        <div className="space-y-2">
          <Label className="text-foreground">QR Code Size</Label>
          <Select value={size.toString()} onValueChange={(v) => onSizeChange(parseInt(v))}>
            <SelectTrigger className="bg-muted/50 border-border focus:ring-ring">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="150">Small (150px)</SelectItem>
              <SelectItem value="200">Medium (200px)</SelectItem>
              <SelectItem value="300">Large (300px)</SelectItem>
              <SelectItem value="400">Extra Large (400px)</SelectItem>
              <SelectItem value="500">Huge (500px)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Color Presets */}
        <div className="space-y-3">
          <Label className="text-foreground">Color Theme</Label>
          <div className="grid grid-cols-4 gap-2">
            {colorPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => onColorPreset(preset.foreground, preset.background)}
                className={`
                  relative p-2 rounded-lg border-2 transition-all duration-200
                  hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
                  ${colors.foreground === preset.foreground && colors.background === preset.background 
                    ? "border-primary shadow-md" 
                    : "border-border hover:border-muted-foreground/50"
                  }
                `}
                title={preset.name}
              >
                <div className="aspect-square rounded overflow-hidden">
                  <div
                    className="w-full h-full grid grid-cols-3 grid-rows-3 gap-0.5 p-0.5"
                    style={{ backgroundColor: preset.background }}
                  >
                    {[...Array(9)].map((_, i) => (
                      <div
                        key={i}
                        className="rounded-sm"
                        style={{
                          backgroundColor: i % 2 === 0 ? preset.foreground : preset.background,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 block text-center truncate">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Colors */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-foreground">Custom Colors</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetColors}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Foreground</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={colors.foreground}
                  onChange={(e) => onForegroundChange(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer overflow-hidden"
                  style={{ padding: 0 }}
                />
                <span className="text-sm text-muted-foreground font-mono">
                  {colors.foreground}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Background</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={colors.background}
                  onChange={(e) => onBackgroundChange(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer overflow-hidden"
                  style={{ padding: 0 }}
                />
                <span className="text-sm text-muted-foreground font-mono">
                  {colors.background}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
