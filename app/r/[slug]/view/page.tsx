import { storage } from "@/lib/storage"
import { notFound } from "next/navigation"
import { MessageSquare, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface LinkData {
  destination: string
  createdAt: number
  updatedAt: number
  clicks: number
}

async function getLink(slug: string): Promise<LinkData | null> {
  return storage.get<LinkData>(`link:${slug}`)
}

export default async function TextViewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const linkData = await getLink(slug)

  if (!linkData) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-slate-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <MessageSquare className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Message</h1>
                <p className="text-sm text-slate-400">QR Code Content</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
              <p className="text-white text-lg leading-relaxed whitespace-pre-wrap break-words">
                {linkData.destination}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-700 bg-slate-900/30">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Shared via QR Code
              </p>
              <Link 
                href="/"
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Create your own QR
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
