'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Clock,
  Check,
  X,
  CreditCard,
  Zap,
  TrendingUp,
  Award,
  AlertCircle,
  MessageSquare,
  ArrowLeft
} from 'lucide-react'

interface PricingPlan {
  id: string
  priceId: string
  name: string
  hours: number
  price: number
  popular?: boolean
  savings?: string
  features: string[]
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'gold',
    priceId: 'price_1S2M7NLDoRMBiHI8IBMbQEpB',
    name: 'Gold Package',
    hours: 5,
    price: 1099.75,
    popular: true,
    features: [
      '5 hours of 1-on-1 tutoring',
      '1 month platform access ($49 value)',
      'Duration: 1-3 weeks',
      'Progress reports + check-ins',
      '2 proctored exams',
      '~2 unproctored exams'
    ]
  },
  {
    id: 'growth',
    priceId: 'price_10_hours', // Replace with your actual Stripe Price ID
    name: 'Growth Pack',
    hours: 10,
    price: 700,
    popular: true,
    savings: 'Save $50',
    features: [
      '10 hours of 1-on-1 tutoring',
      'All subjects available',
      'Priority scheduling',
      'Progress tracking',
      'Session recordings',
      'Monthly progress reports'
    ]
  },
  {
    id: 'accelerator',
    priceId: 'price_20_hours', // Replace with your actual Stripe Price ID
    name: 'Accelerator Pack',
    hours: 20,
    price: 1300,
    savings: 'Save $200',
    features: [
      '20 hours of 1-on-1 tutoring',
      'All subjects available',
      'Priority scheduling',
      'Progress tracking',
      'Session recordings',
      'Weekly progress reports',
      'Practice materials included'
    ]
  },
  {
    id: 'intensive',
    priceId: 'price_40_hours', // Replace with your actual Stripe Price ID
    name: 'Intensive Pack',
    hours: 40,
    price: 2400,
    savings: 'Save $600',
    features: [
      '40 hours of 1-on-1 tutoring',
      'All subjects available',
      'VIP scheduling',
      'Progress tracking',
      'Session recordings',
      'Daily progress reports',
      'Practice materials included',
      'Parent consultation sessions'
    ]
  }
]

export default function BillingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState<string | null>(null)
  const [currentBalance, setCurrentBalance] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu && !(event.target as Element).closest('.user-menu-container')) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu])

  useEffect(() => {
    // Fetch current balance
    fetchBalance()
  }, [session])

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/credits')
      if (response.ok) {
        const data = await response.json()
        setCurrentBalance(data.hours || 0)
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error)
    }
  }

  const handlePurchase = async (priceId: string) => {
    setLoading(priceId)
    setError(null)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/dashboard/billing?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/billing?canceled=true`,
        }),
      })

      const data = await response.json()

      if (data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl
      } else {
        setError('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Purchase error:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section - Black to match navigation */}
      <div className="bg-black text-white">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-gray-400 hover:text-white text-sm mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-light mb-2">Billing & Credits</h1>
                <p className="text-gray-300">Invest in your learning journey with our flexible hour packages</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
                <div className="flex items-center mb-2">
                  <Clock className="h-5 w-5 text-blue-400 mr-2" />
                  <p className="text-sm text-gray-300">Current Balance</p>
                </div>
                <p className="text-3xl font-bold text-white">
                  {currentBalance} hours
                </p>
                <p className="text-xs text-gray-400 mt-2">Available for scheduling</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
            <Check className="h-5 w-5 mr-2" />
            <span>Payment successful! Your credits have been added to your account.</span>
          </div>
        </div>
      )}

      {canceled && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Payment was canceled. No charges were made.</span>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
            <X className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Pricing Section */}
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Choose Your Learning Package</h2>
            <p className="text-gray-700">Flexible hours that work with your schedule</p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className="relative bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all"
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{plan.name}</h3>
                  
                  {/* Hours Badge */}
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">{plan.hours}</span>
                    <span className="text-gray-700 ml-1">hours</span>
                  </div>

                  {/* Price */}
                  <div className="mb-2">
                    <span className="text-2xl font-bold text-gray-900">${plan.price}</span>
                  </div>

                  {/* Savings Badge */}
                  {plan.savings && (
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                      {plan.savings}
                    </span>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {plan.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Purchase Button */}
                <button
                  onClick={() => handlePurchase(plan.priceId)}
                  disabled={loading === plan.priceId}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading === plan.priceId ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Processing...
                    </span>
                  ) : (
                    'Get Started'
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Benefits Section */}
          <div className="mt-12 bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
              Why Parents & Students Choose Us
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Award className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Expert Tutors</h3>
                <p className="text-sm text-gray-700">
                  Carefully vetted tutors with proven track records
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Proven Results</h3>
                <p className="text-sm text-gray-700">
                  Average 200+ point score improvement
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Flexible Learning</h3>
                <p className="text-sm text-gray-700">
                  Online and in-person options available
                </p>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="mt-8 bg-gray-100 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help Choosing?</h3>
            <p className="text-gray-700 mb-4">
              Our education consultants can help you select the perfect package
            </p>
            <a 
              href="mailto:billing@upstartprep.com" 
              className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Support
            </a>
          </div>

          {/* Security Notice */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center justify-center space-x-2 text-gray-500 text-sm">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0110 0v4"></path>
              </svg>
              <span>Secured by Stripe • Your payment information is never stored</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}