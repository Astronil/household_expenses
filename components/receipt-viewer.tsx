"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, ZoomIn, ZoomOut, X } from "lucide-react"
import Image from "next/image"

interface ReceiptViewerProps {
  imageUrl: string
  isOpen: boolean
  onClose: () => void
}

export function ReceiptViewer({ imageUrl, isOpen, onClose }: ReceiptViewerProps) {
  const [scale, setScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    try {
      setLoading(true)
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `receipt-${Date.now()}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading image:", error)
      setError("Error downloading image. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartPosition({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - startPosition.x,
        y: e.clientY - startPosition.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5))
  }

  const handleReset = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader className="mb-4">
          <DialogTitle>Receipt</DialogTitle>
        </DialogHeader>
        <div className="w-full p-4 sm:p-6">
          <div className="relative w-full flex flex-col items-center justify-center">
            {loading ? (
              <div className="flex items-center justify-center w-full h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center p-4">{error}</div>
            ) : (
              <div className="w-full flex flex-col items-center gap-4">
                <div className="relative w-full flex justify-center">
                  <img
                    src={imageUrl}
                    alt="Receipt"
                    className="max-w-full h-auto max-h-[50vh] sm:max-h-[60vh] object-contain rounded-lg shadow-lg"
                    style={{
                      transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                      cursor: isDragging ? 'grabbing' : 'grab',
                      transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="flex gap-2 justify-center sm:justify-start">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomOut}
                      className="w-full sm:w-auto"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      className="w-full sm:w-auto"
                    >
                      Reset
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomIn}
                      className="w-full sm:w-auto"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2 justify-center sm:justify-start">
                    <Button
                      variant="outline"
                      onClick={() => window.open(imageUrl, "_blank")}
                      className="w-full sm:w-auto"
                    >
                      Open in New Tab
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDownload}
                      className="w-full sm:w-auto"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 