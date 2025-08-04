"use client"

import { useState } from "react"
import Image from "next/image"
import { ImageIcon } from "lucide-react"

interface ImageFallbackProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  fallbackClassName?: string
}

export function ImageFallback({ src, alt, width, height, fill, className, fallbackClassName }: ImageFallbackProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${fallbackClassName || className}`}
        style={
          !fill && width && height
            ? { width: `${width}px`, height: `${height}px` }
            : fill
              ? { position: "absolute", inset: 0 }
              : undefined
        }
      >
        <ImageIcon className="h-6 w-6 text-gray-400" />
      </div>
    )
  }

  return (
    <div className={fill ? "relative" : ""} style={!fill && width && height ? { width, height } : undefined}>
      {isLoading && (
        <div
          className={`flex items-center justify-center bg-gray-100 animate-pulse ${className}`}
          style={
            !fill && width && height
              ? { width: `${width}px`, height: `${height}px` }
              : fill
                ? { position: "absolute", inset: 0 }
                : undefined
          }
        >
          <ImageIcon className="h-6 w-6 text-gray-300" />
        </div>
      )}
      <Image
        src={src || "/placeholder.svg"}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-200`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true)
          setIsLoading(false)
        }}
        unoptimized={process.env.NODE_ENV === "development"}
      />
    </div>
  )
}
