'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface Banner {
  id: string
  htmlContent: string
  cssContent: string
  linkUrl?: string | null
}

export default function BannerDisplay() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBanners()
  }, [])

  useEffect(() => {
    // Rotate banners every 10 seconds if there are multiple
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [banners.length])

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/banners/active')
      if (response.ok) {
        const data = await response.json()
        setBanners(data)
      }
    } catch (error) {
      console.error('Failed to fetch banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBannerClick = () => {
    const currentBanner = banners[currentBannerIndex]
    if (currentBanner?.linkUrl) {
      window.open(currentBanner.linkUrl, '_blank')
    }
  }

  const handleClose = () => {
    setIsVisible(false)
  }

  // Don't render if no banners, loading, or not visible
  if (!isVisible || loading || banners.length === 0) {
    return null
  }

  const currentBanner = banners[currentBannerIndex]

  return (
    <div className="relative w-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        aria-label="Close banner"
      >
        <X className="h-4 w-4 text-white" />
      </button>

      {/* Banner container - matches Continue Your Learning Path */}
      <div 
        className={`relative w-full ${currentBanner.linkUrl ? 'cursor-pointer' : ''}`}
        onClick={handleBannerClick}
      >
        {/* Inject CSS with scoped styles - override fixed dimensions */}
        <style dangerouslySetInnerHTML={{ __html: `
          .parent-banner-display .banner-container {
            width: 100% !important;
            height: auto !important;
            min-height: 80px !important;
            display: flex !important;
            align-items: center !important;
            background: transparent !important;
          }
          .parent-banner-display .accent-bar {
            height: 100% !important;
          }
          .parent-banner-display .bg-circle {
            display: none !important;
          }
          ${currentBanner.cssContent}
        ` }} />
        {/* Render HTML */}
        <div className="parent-banner-display">
          <div dangerouslySetInnerHTML={{ __html: currentBanner.htmlContent }} />
        </div>
      </div>

      {/* Banner indicators if multiple banners */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBannerIndex(index)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                index === currentBannerIndex ? 'bg-white' : 'bg-white/50'
              }`}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}