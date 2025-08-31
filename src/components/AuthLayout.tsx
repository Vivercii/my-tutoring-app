import React from 'react'

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
  return (
    <div className="min-h-screen flex">
      {/* Left Column - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-md w-full space-y-8">
          {children}
        </div>
      </div>

      {/* Right Column - Branding */}
      <div className="hidden lg:flex lg:flex-1 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900"></div>
        <div className="relative z-10 flex flex-col items-center justify-center px-8 text-white">
          <div className="max-w-md text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6">
                <span className="text-3xl font-bold">UP</span>
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-4">{title}</h2>
            <p className="text-lg text-blue-100 mb-8">{subtitle}</p>
            
            {/* Stats or Features */}
            <div className="grid grid-cols-2 gap-6 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">500+</div>
                <div className="text-sm text-blue-200">Expert Tutors</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">10,000+</div>
                <div className="text-sm text-blue-200">Happy Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">4.9/5</div>
                <div className="text-sm text-blue-200">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">24/7</div>
                <div className="text-sm text-blue-200">Support Available</div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-10 right-10 w-64 h-64 bg-blue-500 rounded-full filter blur-3xl opacity-20"></div>
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl opacity-20"></div>
          </div>
        </div>
      </div>
    </div>
  )
}