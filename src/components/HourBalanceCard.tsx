'use client'

import { useState, useEffect } from 'react'
import { Clock, TrendingUp, TrendingDown, History, AlertCircle } from 'lucide-react'

interface Transaction {
  id: string
  type: string
  hours: number
  balanceBefore: number
  balanceAfter: number
  description: string
  createdAt: string
}

export function HourBalanceCard() {
  const [balance, setBalance] = useState(0)
  const [totalPurchased, setTotalPurchased] = useState(0)
  const [totalUsed, setTotalUsed] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCreditHistory()
  }, [])

  const fetchCreditHistory = async () => {
    try {
      const response = await fetch('/api/credits/history')
      if (response.ok) {
        const data = await response.json()
        setBalance(data.balance || 0)
        setTotalPurchased(data.totalPurchased || 0)
        setTotalUsed(data.totalUsed || 0)
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Failed to fetch credit history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-light text-gray-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            Tutoring Hours Balance
          </h3>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-gray-700 hover:text-gray-900 font-light flex items-center gap-1"
          >
            <History className="h-4 w-4" />
            {showHistory ? 'Hide' : 'View'} History
          </button>
        </div>

        {/* Main Balance Display */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2 font-light">Current Balance</p>
            <p className="text-5xl font-light text-gray-900">
              {balance.toFixed(1)}
              <span className="text-2xl font-light text-gray-600 ml-2">hours</span>
            </p>
            
            {balance < 5 && balance > 0 && (
              <div className="mt-3 flex items-center justify-center gap-2 text-gray-700">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm font-light">Running low - consider purchasing more hours</p>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-gray-600" />
              <p className="text-sm text-gray-600 font-light">Total Purchased</p>
            </div>
            <p className="text-2xl font-light text-gray-900">{totalPurchased.toFixed(1)}h</p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-gray-600" />
              <p className="text-sm text-gray-600 font-light">Total Used</p>
            </div>
            <p className="text-2xl font-light text-gray-900">{totalUsed.toFixed(1)}h</p>
          </div>
        </div>

        {/* Buy More Button */}
        <button
          onClick={() => window.location.href = '/dashboard/billing'}
          className="w-full bg-gray-900 hover:bg-black text-white font-light py-3 px-4 rounded-lg transition-colors"
        >
          Purchase More Hours
        </button>
      </div>

      {/* Transaction History */}
      {showHistory && (
        <div className="border-t bg-gray-50 p-6">
          <h4 className="font-light text-gray-900 mb-4">Transaction History</h4>
          
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No transactions yet</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-white rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {transaction.type === 'PURCHASE' ? (
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-gray-700" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <TrendingDown className="h-4 w-4 text-gray-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-light text-gray-900">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-light ${
                      transaction.hours > 0 ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {transaction.hours > 0 ? '+' : ''}{Math.abs(transaction.hours).toFixed(1)}h
                    </p>
                    <p className="text-xs text-gray-500">
                      Balance: {transaction.balanceAfter.toFixed(1)}h
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}