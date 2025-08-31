'use client'

import React, { useState, useEffect } from 'react'

interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export default function AuthLayout({ 
  children, 
  title = "Welcome to UpstartPrep",
  subtitle = "Your journey to academic excellence starts here"
}: AuthLayoutProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  // Replace these with actual student images
  const images = [
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&h=1600&fit=crop', // Students studying together
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=1600&fit=crop', // Students collaborating
    'https://images.unsplash.com/photo-1529470839332-78ad660a6a82?w=1200&h=1600&fit=crop'  // Student smiling with laptop
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 6000) // Change image every 6 seconds

    return () => clearInterval(interval)
  }, [images.length])

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-md w-full space-y-8">
          {children}
        </div>
      </div>

      {/* Right Column - Ken Burns Effect with Images */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        {/* Ken Burns Images */}
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-2000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div 
              className="absolute inset-0 bg-cover bg-center animate-kenburns"
              style={{
                backgroundImage: `url(${image})`,
                animationDelay: `${index * 6}s`
              }}
            />
          </div>
        ))}
        
        {/* Overlay - darker, more neutral */}
        <div className="absolute inset-0 bg-black/70"></div>
        
        {/* Content - properly centered */}
        <div className="relative z-10 flex items-center justify-center min-h-screen px-8">
          <div className="max-w-md text-center text-white">
            <div className="mb-8">
              <img 
                src="/logo.svg" 
                alt="UpstartPrep Logo" 
                className="w-32 h-32 mx-auto filter brightness-0 invert"
              />
            </div>
            <h2 className="text-4xl font-bold mb-4">{title}</h2>
            <p className="text-lg text-gray-200 mb-8">{subtitle}</p>
            
            {/* Stats or Features */}
            <div className="grid grid-cols-2 gap-6 mt-12">
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold mb-2">500+</div>
                <div className="text-sm text-gray-300">Expert Tutors</div>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold mb-2">10,000+</div>
                <div className="text-sm text-gray-300">Happy Students</div>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold mb-2">4.9/5</div>
                <div className="text-sm text-gray-300">Average Rating</div>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold mb-2">24/7</div>
                <div className="text-sm text-gray-300">Support Available</div>
              </div>
            </div>

            {/* Image indicator dots */}
            <div className="flex justify-center space-x-2 mt-8">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentImageIndex 
                      ? 'bg-white w-8' 
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes kenburns {
          0% {
            transform: scale(1) translateX(0);
          }
          50% {
            transform: scale(1.1) translateX(-2%);
          }
          100% {
            transform: scale(1.2) translateX(2%);
          }
        }
        
        .animate-kenburns {
          animation: kenburns 20s ease-in-out infinite;
        }
        
        .duration-2000 {
          transition-duration: 2000ms;
        }
      `}</style>
    </div>
  )
}