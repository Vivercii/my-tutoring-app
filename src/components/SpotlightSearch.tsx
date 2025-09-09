'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Search,
  X,
  Users,
  Calendar,
  FileText,
  MessageSquare,
  TrendingUp,
  Clock,
  Award,
  Settings,
  CreditCard,
  ChevronRight,
  Command,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  Hash,
  User,
  BookOpen,
  BarChart3,
  Zap,
  PlusCircle
} from 'lucide-react'

interface SearchResult {
  id: string
  type: 'student' | 'session' | 'exam' | 'message' | 'action' | 'page'
  title: string
  subtitle?: string
  icon: React.ReactNode
  action: () => void
}

interface SpotlightSearchProps {
  isOpen: boolean
  onClose: () => void
}

export default function SpotlightSearch({ isOpen, onClose }: SpotlightSearchProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Quick actions based on user role
  const getQuickActions = (): SearchResult[] => {
    const baseActions: SearchResult[] = [
      {
        id: 'nav-dashboard',
        type: 'page',
        title: 'Go to Dashboard',
        subtitle: 'View your dashboard',
        icon: <BarChart3 className="h-4 w-4" />,
        action: () => {
          router.push('/dashboard')
          onClose()
        }
      },
      {
        id: 'nav-settings',
        type: 'page',
        title: 'Settings',
        subtitle: 'Manage your account',
        icon: <Settings className="h-4 w-4" />,
        action: () => {
          router.push('/dashboard/settings')
          onClose()
        }
      }
    ]

    if (session?.user?.role === 'STUDENT') {
      return [
        {
          id: 'action-practice',
          type: 'action',
          title: 'Start Practice Test',
          subtitle: 'Begin a new SAT practice test',
          icon: <FileText className="h-4 w-4" />,
          action: () => {
            router.push('/dashboard/exams')
            onClose()
          }
        },
        {
          id: 'action-schedule',
          type: 'action',
          title: 'View Schedule',
          subtitle: 'See upcoming sessions',
          icon: <Calendar className="h-4 w-4" />,
          action: () => {
            router.push('/dashboard/schedule')
            onClose()
          }
        },
        {
          id: 'action-message',
          type: 'action',
          title: 'Message Instructor',
          subtitle: 'Send a message to your instructor',
          icon: <MessageSquare className="h-4 w-4" />,
          action: () => {
            // This would open the messaging sidebar
            document.dispatchEvent(new CustomEvent('openMessaging'))
            onClose()
          }
        },
        ...baseActions
      ]
    } else if (session?.user?.role === 'PARENT') {
      return [
        {
          id: 'action-add-student',
          type: 'action',
          title: 'Add Student',
          subtitle: 'Add a new student',
          icon: <PlusCircle className="h-4 w-4" />,
          action: () => {
            router.push('/dashboard/students')
            onClose()
          }
        },
        {
          id: 'nav-billing',
          type: 'page',
          title: 'Billing',
          subtitle: 'Manage payment and credits',
          icon: <CreditCard className="h-4 w-4" />,
          action: () => {
            router.push('/dashboard/billing')
            onClose()
          }
        },
        ...baseActions
      ]
    } else if (session?.user?.role === 'TUTOR') {
      return [
        {
          id: 'action-session',
          type: 'action',
          title: 'Schedule Session',
          subtitle: 'Create a new tutoring session',
          icon: <Calendar className="h-4 w-4" />,
          action: () => {
            router.push('/dashboard/sessions/new')
            onClose()
          }
        },
        {
          id: 'nav-students',
          type: 'page',
          title: 'My Students',
          subtitle: 'View your students',
          icon: <Users className="h-4 w-4" />,
          action: () => {
            router.push('/dashboard/students')
            onClose()
          }
        },
        ...baseActions
      ]
    }
    
    return baseActions
  }

  // Mock search function - in production, this would call an API
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(getQuickActions())
      return
    }

    setLoading(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200))

    // Mock results based on query
    const mockResults: SearchResult[] = []
    const lowerQuery = searchQuery.toLowerCase()

    // Search for students (for parents/tutors)
    if (session?.user?.role !== 'STUDENT') {
      if (lowerQuery.includes('john') || lowerQuery.includes('student')) {
        mockResults.push({
          id: 'student-1',
          type: 'student',
          title: 'John Smith',
          subtitle: 'Grade 11 • SAT Prep',
          icon: <User className="h-4 w-4" />,
          action: () => {
            router.push('/dashboard/students/john-smith')
            onClose()
          }
        })
      }
    }

    // Search for sessions
    if (lowerQuery.includes('session') || lowerQuery.includes('math')) {
      mockResults.push({
        id: 'session-1',
        type: 'session',
        title: 'Math Tutoring Session',
        subtitle: 'Tomorrow at 3:00 PM',
        icon: <Calendar className="h-4 w-4" />,
        action: () => {
          router.push('/dashboard/sessions/upcoming')
          onClose()
        }
      })
    }

    // Search for exams/scores
    if (lowerQuery.includes('test') || lowerQuery.includes('score') || lowerQuery.includes('practice')) {
      mockResults.push({
        id: 'exam-1',
        type: 'exam',
        title: 'SAT Practice Test #5',
        subtitle: 'Score: 1420/1600',
        icon: <Award className="h-4 w-4" />,
        action: () => {
          router.push('/dashboard/exams/results')
          onClose()
        }
      })
    }

    // Add quick actions that match
    const matchingActions = getQuickActions().filter(action =>
      action.title.toLowerCase().includes(lowerQuery) ||
      action.subtitle?.toLowerCase().includes(lowerQuery)
    )
    
    setResults([...mockResults, ...matchingActions])
    setLoading(false)
  }, [session, router, onClose])

  // Handle search input
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [query, performSearch])

  // Load recent searches
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('recentSearches')
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 5))
      }
      setResults(getQuickActions())
      inputRef.current?.focus()
    }
  }, [isOpen])

  // Save search to recent
  const saveToRecent = (searchTerm: string) => {
    if (!searchTerm.trim()) return
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % results.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (results[selectedIndex]) {
          saveToRecent(query)
          results[selectedIndex].action()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex, query, onClose])

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  if (!isOpen) return null

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'student': return 'bg-blue-100 text-blue-700'
      case 'session': return 'bg-green-100 text-green-700'
      case 'exam': return 'bg-purple-100 text-purple-700'
      case 'message': return 'bg-yellow-100 text-yellow-700'
      case 'action': return 'bg-orange-100 text-orange-700'
      case 'page': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search Panel */}
      <div className="relative min-h-full flex items-start justify-center pt-[10vh] px-4">
        <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center px-4 py-3 border-b">
            <Search className="h-5 w-5 text-gray-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students, sessions, or actions..."
              className="flex-1 text-lg outline-none placeholder-gray-400"
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
            <kbd className="ml-3 px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto"></div>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {!query && recentSearches.length > 0 && (
                  <>
                    <div className="px-4 py-2">
                      <p className="text-xs text-gray-500 font-medium">Recent Searches</p>
                    </div>
                    {recentSearches.map((search, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQuery(search)}
                        className="w-full px-4 py-2 flex items-center space-x-3 hover:bg-gray-50 text-left"
                      >
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{search}</span>
                      </button>
                    ))}
                    <div className="border-t my-2" />
                    <div className="px-4 py-2">
                      <p className="text-xs text-gray-500 font-medium">Quick Actions</p>
                    </div>
                  </>
                )}
                
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      saveToRecent(query)
                      result.action()
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full px-4 py-3 flex items-center space-x-3 text-left transition-colors ${
                      index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${getTypeColor(result.type)}`}>
                      {result.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="text-xs text-gray-500 truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    {index === selectedIndex && (
                      <div className="flex items-center space-x-1">
                        <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                          ↵
                        </kbd>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500">No results found for "{query}"</p>
                <p className="text-sm text-gray-400 mt-1">Try searching for students, sessions, or actions</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <kbd className="px-1 py-0.5 bg-gray-100 rounded">↑</kbd>
                <kbd className="px-1 py-0.5 bg-gray-100 rounded">↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center space-x-1">
                <kbd className="px-1 py-0.5 bg-gray-100 rounded">↵</kbd>
                <span>Select</span>
              </span>
              <span className="flex items-center space-x-1">
                <kbd className="px-1 py-0.5 bg-gray-100 rounded">ESC</kbd>
                <span>Close</span>
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <span>Pro tip: Press</span>
              <kbd className="px-1 py-0.5 bg-gray-100 rounded">⌘</kbd>
              <kbd className="px-1 py-0.5 bg-gray-100 rounded">K</kbd>
              <span>anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}