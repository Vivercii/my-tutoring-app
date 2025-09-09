'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, ArrowRight, BookOpen, Users, Calendar, TrendingUp, Sparkles, Target, Clock, Award } from 'lucide-react'

interface WelcomeModalProps {
  userName?: string
  onComplete: () => void
  onStartOnboarding: () => void
}

export default function WelcomeModal({ userName, onComplete, onStartOnboarding }: WelcomeModalProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleGetStarted = () => {
    setIsVisible(false)
    onStartOnboarding()
  }

  const handleClose = () => {
    setIsVisible(false)
    onComplete()
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Header with Logo */}
        <div className="relative bg-gradient-to-br from-black via-gray-900 to-black text-white p-10 rounded-t-3xl">
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-4 mb-6">
            <img 
              src="https://res.cloudinary.com/dsoo2uoow/image/upload/v1757102414/Upstart_Prep_Logo_uqiba4.svg" 
              alt="UpstartPrep Logo" 
              className="h-32 w-auto filter brightness-0 invert"
            />
          </div>
          
          <h1 className="text-4xl font-light mb-3">
            Welcome{userName ? `, ${userName}` : ''}
          </h1>
          <p className="text-gray-300 text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            Your journey to academic excellence starts here
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Founder Message */}
          <div className="mb-8">
            <h2 className="text-2xl font-light mb-4 text-gray-900">A Message from Our Founder</h2>
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <p className="text-gray-700 mb-3">
                Hi, I'm Kharis Yeboah.
              </p>
              <p className="text-gray-700 mb-3">
                I'm a Mathematics Professor who's spent 15 years figuring out why brilliant students struggle with standardized tests.
              </p>
              <p className="text-gray-700 mb-3 font-medium">
                The answer? These tests don't measure intelligence – they measure pattern recognition.
              </p>
              <p className="text-gray-700 mb-3">
                I watched too many parents spend thousands on generic prep that didn't work. Too many students grinding through endless practice problems without real improvement.
              </p>
              <p className="text-gray-700">
                So I built UpstartPrep to be different. No confusion. No black box. Just clear progress you can track.
              </p>
              <p className="text-gray-700 mt-4 italic">
                - Kharis, Mathematics Professor & Founder
              </p>
            </div>
          </div>

          {/* What Makes Us Different */}
          <div className="mb-8">
            <h3 className="text-xl font-light mb-6 text-gray-900">What Makes UpstartPrep Different</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Complete Transparency</h4>
                  <p className="text-sm text-gray-600 mt-1">Track hours, view session notes, monitor progress in real-time</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-sm">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Smart Scheduling</h4>
                  <p className="text-sm text-gray-600 mt-1">Book sessions instantly, sync to your calendar automatically</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Adaptive Practice</h4>
                  <p className="text-sm text-gray-600 mt-1">Tests that adjust to your child's level, just like the real SAT</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-sm">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Hand-Picked Tutors</h4>
                  <p className="text-sm text-gray-600 mt-1">Matched specifically to your child's needs and learning style</p>
                </div>
              </div>
            </div>
          </div>

          {/* Coming Soon */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 rounded-2xl border border-purple-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-gray-900 font-semibold mb-1">Coming Soon: Pattern Recognition Training</p>
                <p className="text-gray-700 text-sm">
                  The game-changer that teaches students to see through test tricks and recognize the patterns that repeat on every test.
                </p>
              </div>
            </div>
          </div>

          {/* Getting Started Steps */}
          <div className="mb-8">
            <h3 className="text-xl font-light mb-6 text-gray-900">Your Next Steps</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-gray-800 to-black text-white rounded-full flex items-center justify-center text-sm font-medium shadow-sm">
                  1
                </div>
                <p className="text-gray-700">Add your student(s) to get started</p>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-gray-800 to-black text-white rounded-full flex items-center justify-center text-sm font-medium shadow-sm">
                  2
                </div>
                <p className="text-gray-700">Tell us about their academic goals</p>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-gray-800 to-black text-white rounded-full flex items-center justify-center text-sm font-medium shadow-sm">
                  3
                </div>
                <p className="text-gray-700">We'll match them with the perfect tutor</p>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-gray-800 to-black text-white rounded-full flex items-center justify-center text-sm font-medium shadow-sm">
                  4
                </div>
                <p className="text-gray-700">Book your first session and watch them thrive</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleGetStarted}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-black to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all duration-200 flex items-center justify-center gap-3 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={handleClose}
              className="px-6 py-4 text-gray-600 hover:text-gray-900 transition-colors hover:bg-gray-50 rounded-xl"
            >
              I'll explore on my own
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}