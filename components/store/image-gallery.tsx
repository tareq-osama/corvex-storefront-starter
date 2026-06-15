"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { toProxiedImageSrc } from "@/lib/image"

interface ImageGalleryProps {
  images: { url: string; alt?: string | null }[]
  thumbnail?: string | null
  selectedImageUrl?: string | null
  className?: string
}

export function ImageGallery({ images, thumbnail, selectedImageUrl, className }: ImageGalleryProps) {
  const allImages = [
    ...(thumbnail ? [{ url: thumbnail, alt: "Product" }] : []),
    ...images,
  ].filter(img => img.url)

  const [activeIndex, setActiveIndex] = useState(0)

  // When a variant is selected, jump to its image if present
  useEffect(() => {
    if (!selectedImageUrl) return
    const idx = allImages.findIndex(img => img.url === selectedImageUrl)
    if (idx !== -1) {
      setActiveIndex(idx)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImageUrl])

  if (allImages.length === 0) {
    return (
      <div className={cn("aspect-square rounded-2xl bg-muted/30 flex items-center justify-center", className)}>
        <svg className="h-16 w-16 text-muted-foreground/20" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
        </svg>
      </div>
    )
  }

  const activeImage = allImages[activeIndex]

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main image */}
      <div className="aspect-square rounded-2xl overflow-hidden bg-muted/30">
        <img
          src={toProxiedImageSrc(activeImage.url) ?? activeImage.url}
          alt={activeImage.alt ?? "Product"}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Thumbnail strip */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-all",
                i === activeIndex
                  ? "border-primary ring-1 ring-primary/20"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <img
                src={toProxiedImageSrc(img.url) ?? img.url}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
