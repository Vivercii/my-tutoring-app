'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Search,
  X,
  ArrowLeft,
  Clock,
  TrendingUp,
  User,
  Calendar,
  FileText,
  Hash
} from 'lucide-react'

interface SearchSuggestion {
  id: string
  type: 'recent' | 'student' | 'session' | 'exam' | 'trending'
  text: string
  icon: React.ReactNode
  subtitle?: string
}

interface ExpandingSearchProps {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}

export default function ExpandingSearch({ isOpen, onOpen, onClose }: ExpandingSearchProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Get initial suggestions
  const getInitialSuggestions = (): SearchSuggestion[] => {
    const recents = localStorage.getItem('recentSearches')
    const recentSearches = recents ? JSON.parse(recents).slice(0, 3) : []
    
    const suggestions: SearchSuggestion[] = recentSearches.map((search: string, idx: number) => ({
      id: `recent-${idx}`,
      type: 'recent' as const,
      text: search,
      icon: <Clock className="h-4 w-4" />
    }))

    // Add trending/common searches
    if (session?.user?.role === 'STUDENT') {
      suggestions.push(
        {
          id: 'trending-1',
          type: 'trending',
          text: 'Practice test scores',
          icon: <TrendingUp className="h-4 w-4" />
        },
        {
          id: 'trending-2',
          type: 'trending',
          text: 'Upcoming sessions',
          icon: <Calendar className="h-4 w-4" />
        }
      )
    } else if (session?.user?.role === 'PARENT') {
      suggestions.push(
        {
          id: 'trending-1',
          type: 'trending',
          text: 'Student progress',
          icon: <TrendingUp className="h-4 w-4" />
        },
        {
          id: 'trending-2',
          type: 'trending',
          text: 'Session history',
          icon: <Calendar className="h-4 w-4" />
        }
      )
    }

    return suggestions.slice(0, 5)
  }

  // Search suggestions based on query
  const searchSuggestions = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions(getInitialSuggestions())
      return
    }

    const results: SearchSuggestion[] = []
    const lower = searchQuery.toLowerCase()

    // Mock suggestions - in production, call API
    if (lower.includes('john') || lower.includes('student')) {
      results.push({
        id: 'student-1',
        type: 'student',
        text: 'John Smith',
        subtitle: 'Grade 11 Student',
        icon: <User className="h-4 w-4" />
      })
    }

    if (lower.includes('math') || lower.includes('session')) {
      results.push({
        id: 'session-1',
        type: 'session',
        text: 'Math Tutoring Session',
        subtitle: 'Tomorrow at 3:00 PM',
        icon: <Calendar className="h-4 w-4" />
      })
    }

    if (lower.includes('test') || lower.includes('practice')) {
      results.push({
        id: 'exam-1',
        type: 'exam',
        text: 'SAT Practice Test #5',
        subtitle: 'Score: 1420/1600',
        icon: <FileText className="h-4 w-4" />
      })
    }

    // Add search query as first option
    results.unshift({
      id: 'search-query',
      type: 'recent',
      text: searchQuery,
      icon: <Search className="h-4 w-4" />
    })

    setSuggestions(results.slice(0, 6))
  }

  // Handle search submission
  const handleSearch = (searchText?: string) => {
    const searchQuery = searchText || query
    if (!searchQuery.trim()) return

    // Save to recent searches
    const recents = localStorage.getItem('recentSearches')
    const recentSearches = recents ? JSON.parse(recents) : []
    const updated = [searchQuery, ...recentSearches.filter((s: string) => s !== searchQuery)].slice(0, 10)
    localStorage.setItem('recentSearches', JSON.stringify(updated))

    // Navigate to search results page (or perform search)
    console.log('Searching for:', searchQuery)
    
    // Close search
    handleClose()
  }

  // Handle close
  const handleClose = () => {
    setQuery('')
    setShowSuggestions(false)
    setSelectedIndex(-1)
    onClose()
  }

  // Effect to focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
        setShowSuggestions(true)
        setSuggestions(getInitialSuggestions())
      }, 100)
    }
  }, [isOpen])

  // Effect to search as user types
  useEffect(() => {
    const timer = setTimeout(() => {
      searchSuggestions(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSearch(suggestions[selectedIndex].text)
      } else {
        handleSearch()
      }
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'recent': return 'text-gray-400'
      case 'student': return 'text-blue-500'
      case 'session': return 'text-green-500'
      case 'exam': return 'text-purple-500'
      case 'trending': return 'text-orange-500'
      default: return 'text-gray-400'
    }
  }

  if (!isOpen) {
    // Collapsed state - just the search icon
    return (
      <button 
        onClick={onOpen}
        className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
        title="Search (⌘K)"
      >
        <Search className="h-4 w-4" />
      </button>
    )
  }

  // Expanded state
  return (
    <div 
      ref={searchContainerRef}
      className="absolute left-0 right-0 top-0 h-full bg-black z-50 flex items-center px-4 lg:relative lg:flex-1 lg:max-w-2xl lg:mx-4"
    >
      {/* Back button on mobile */}
      <button
        onClick={handleClose}
        className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors mr-2 lg:hidden"
      >
        <ArrowLeft className="h-5 w-5 text-white" />
      </button>

      {/* Search Input Container */}
      <div className="flex-1 relative">
        <div className="flex items-center bg-gray-900/50 rounded-lg border border-gray-700 focus-within:border-gray-500 transition-colors">
          <div className="pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search students, sessions, exams..."
            className="flex-1 bg-transparent px-3 py-2 text-white placeholder-gray-400 outline-none text-sm"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-2 hover:bg-gray-700/50 rounded transition-colors mr-1"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => handleSearch(suggestion.text)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full px-4 py-2.5 flex items-center space-x-3 text-left hover:bg-gray-50 transition-colors ${
                  index === selectedIndex ? 'bg-gray-50' : ''
                }`}
              >
                <span className={getIconColor(suggestion.type)}>
                  {suggestion.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{suggestion.text}</p>
                  {suggestion.subtitle && (
                    <p className="text-xs text-gray-500 truncate">{suggestion.subtitle}</p>
                  )}
                </div>
                {suggestion.type === 'recent' && (
                  <span className="text-xs text-gray-400">Recent</span>
                )}
                {suggestion.type === 'trending' && (
                  <span className="text-xs text-orange-500">Trending</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Close button on desktop */}
      <button
        onClick={handleClose}
        className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors ml-2 hidden lg:block"
      >
        <X className="h-4 w-4 text-white" />
      </button>
    </div>
  )
}