'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, Check, Sparkles } from 'lucide-react'
import { usePremiumTheme } from '@/components/providers/PremiumThemeProvider'

const PREMIUM_PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$29.99',
    period: '/month',
    description: 'Perfect for trying out premium features',
    savings: null,
  },
  {
    id: 'quarterly',
    name: 'Quarterly',
    price: '$74.97',
    period: '/3 months',
    description: 'Save $14.97 (17% off)',
    savings: 'Save $14.97',
    popular: true,
  },
  {
    id: 'semiannual',
    name: 'Semi-Annual',
    price: '$119.94',
    period: '/6 months',
    description: 'Save $59.94 (33% off)',
    savings: 'Save $59.94',
  },
  {
    id: 'annual',
    name: 'Annual',
    price: '$179.88',
    period: '/year',
    description: 'Save $179.88 (50% off)',
    savings: 'Best Value!',
    bestValue: true,
  },
]

const PREMIUM_FEATURES = [
  'Advanced practice exams with detailed explanations',
  'Progress tracking and analytics',
  'Personalized study recommendations',
  'Priority support',
  'Gold theme and exclusive features',
  'Access to premium question bank',
]

export function PremiumUpgradeCard() {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const { isPremium } = usePremiumTheme()

  if (isPremium) {
    return (
      <div className="bg-gradient-to-r from-gray-900 to-black rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Crown className="h-8 w-8" />
          <div>
            <h3 className="text-2xl font-light">Premium Member</h3>
            <p className="text-white/90 font-light">You have access to all premium features!</p>
          </div>
        </div>
      </div>
    )
  }

  const handleSubscribe = async (priceType: string) => {
    setLoading(priceType)
    try {
      const response = await fetch('/api/checkout/premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceType }),
      })

      const data = await response.json()
      if (data.url) {
        router.push(data.url)
      } else {
        console.error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <Crown className="h-8 w-8 text-gray-700" />
          <h2 className="text-3xl font-light">Upgrade to Premium</h2>
          <Sparkles className="h-8 w-8 text-gray-700" />
        </div>
        <p className="text-gray-600 font-light">
          Unlock advanced features and accelerate your learning
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {PREMIUM_PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-lg border-2 p-4 ${
              plan.popular
                ? 'border-gray-800 shadow-lg'
                : plan.bestValue
                ? 'border-gray-900 shadow-lg'
                : 'border-gray-200'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-light">
                  MOST POPULAR
                </span>
              </div>
            )}
            {plan.bestValue && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-light">
                  BEST VALUE
                </span>
              </div>
            )}
            
            <div className="text-center mb-4 mt-2">
              <h3 className="font-light text-lg">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-light">{plan.price}</span>
                <span className="text-gray-600 text-sm font-light">{plan.period}</span>
              </div>
              {plan.savings && (
                <p className="text-sm font-light text-gray-700 mt-1">
                  {plan.savings}
                </p>
              )}
            </div>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading !== null}
              className={`w-full py-2 px-4 rounded-lg font-light transition-colors ${
                plan.popular || plan.bestValue
                  ? 'bg-black hover:bg-gray-900 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-white'
              } disabled:opacity-50`}
            >
              {loading === plan.id ? 'Processing...' : 'Subscribe'}
            </button>
          </div>
        ))}
      </div>

      <div className="border-t pt-6">
        <h3 className="font-light text-lg mb-4">Premium Features Include:</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {PREMIUM_FEATURES.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-gray-700 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 font-light">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 text-center font-light">
          <span className="font-normal">Note:</span> If you purchase a tutoring package, premium access is included automatically!
        </p>
      </div>
    </div>
  )
}