'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import { 
  Clock, ChevronLeft, ChevronRight, Flag, Eye, EyeOff,
  BookOpen, MessageSquare, Maximize2, Minimize2, 
  FileText, Calculator, Highlighter, X, Check, AlertCircle,
  Grid3X3, ChevronDown, Menu, BookMarked, Circle, Triangle,
  Grid, ChevronUp, CircleDot, CheckCircle, XCircle, LogOut
} from 'lucide-react'

const KatexRenderer = dynamic(() => import('@/components/KatexRenderer'), { 
  ssr: false 
})

interface AnswerOption {
  id: string
  text: string
  isCorrect?: boolean
}

interface Question {
  id: string
  questionCode?: string
  questionText: string
  questionType: string
  points: number
  options?: AnswerOption[]
  passage?: string
  explanation?: string
}

interface ExamQuestion {
  id: string
  order: number
  question: Question
}

interface Module {
  id: string
  title?: string
  order: number
  timeLimit?: number
  questions: ExamQuestion[]
}

interface Section {
  id: string
  title: string
  order: number
  modules: Module[]
}

interface Exam {
  id: string
  title: string
  description?: string
  timeLimit?: number
  sections: Section[]
}

export default function StudentExamTakePage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const examId = params?.examId as string

  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [showQuestionGrid, setShowQuestionGrid] = useState(false)
  const [showPassage, setShowPassage] = useState(true)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [savedStatus, setSavedStatus] = useState<string>('')
  const [assignmentId, setAssignmentId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timerWarning, setTimerWarning] = useState<number | null>(null)
  const [showTimer, setShowTimer] = useState(true)
  const [strikethroughOptions, setStrikethroughOptions] = useState<Set<string>>(new Set())
  const [showCalculator, setShowCalculator] = useState(false)
  const [showReference, setShowReference] = useState(false)
  const [isAdaptiveExam, setIsAdaptiveExam] = useState(false)
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null)
  const [module1Score, setModule1Score] = useState<number | null>(null)
  const [adaptivePath, setAdaptivePath] = useState<string | null>(null)
  const [showModuleCompletion, setShowModuleCompletion] = useState(false)
  const [showAbortModal, setShowAbortModal] = useState(false)
  
  // Highlighting state for Reading & Writing sections
  const [highlights, setHighlights] = useState<Record<string, Array<{id: string, start: number, end: number, color: string, text: string}>>>({})
  const [highlighterColor, setHighlighterColor] = useState<'yellow' | 'blue' | 'green' | 'pink'>('yellow')
  const [showHighlighter, setShowHighlighter] = useState(false)
  const [columnWidth, setColumnWidth] = useState(50) // Percentage for left column
  
  // Desmos calculator state
  const [calculatorMode, setCalculatorMode] = useState<'right-sidebar' | 'left-sidebar' | 'bottom-drawer' | 'floating' | 'minimized'>('right-sidebar')
  const [calculatorPosition, setCalculatorPosition] = useState({ x: 100, y: 100 })
  const [calculatorSize, setCalculatorSize] = useState({ width: 400, height: 500 })
  const [isDraggingCalc, setIsDraggingCalc] = useState(false)
  const [isResizingCalc, setIsResizingCalc] = useState(false)
  
  // Draggable button state
  const [isDragging, setIsDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const [buttonPosition, setButtonPosition] = useState<'bottom-right' | 'bottom-left' | 'top-left' | 'top-right' | 'middle-left' | 'middle-right'>('bottom-right')
  const [hasMoved, setHasMoved] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(80) // Default fallback

  const navigatorButtonRef = useRef<HTMLButtonElement>(null)
  const saveDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const dragRef = useRef<HTMLButtonElement>(null)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const buttonStartPos = useRef({ x: 0, y: 0 })
  const dragThreshold = 5 // pixels of movement before considering it a drag
  
  // Calculator refs
  const calcRef = useRef<HTMLDivElement>(null)
  const calcDragStart = useRef({ x: 0, y: 0 })
  const calcStartPos = useRef({ x: 0, y: 0 })
  const calcResizeStart = useRef({ width: 0, height: 0, x: 0, y: 0 })

  // Memoized computations for better performance
  const allQuestions = useMemo(() => {
    if (!exam) return []
    const questions: { 
      id: string;
      question: ExamQuestion; 
      sectionIndex: number; 
      moduleIndex: number; 
      questionIndex: number;
      globalIndex: number;
    }[] = []
    
    let globalIndex = 0
    exam.sections.forEach((section, sIndex) => {
      section.modules.forEach((module, mIndex) => {
        module.questions.forEach((question, qIndex) => {
          questions.push({
            id: question.id,
            question,
            sectionIndex: sIndex,
            moduleIndex: mIndex,
            questionIndex: qIndex,
            globalIndex: globalIndex++
          })
        })
      })
    })
    
    return questions
  }, [exam])

  const currentGlobalIndex = useMemo(() => {
    return allQuestions.findIndex(
      q => q.sectionIndex === currentSectionIndex && 
           q.moduleIndex === currentModuleIndex && 
           q.questionIndex === currentQuestionIndex
    )
  }, [allQuestions, currentSectionIndex, currentModuleIndex, currentQuestionIndex])

  // Get questions for current module only
  const currentModuleQuestions = useMemo(() => {
    return allQuestions.filter(
      q => q.sectionIndex === currentSectionIndex && 
           q.moduleIndex === currentModuleIndex
    )
  }, [allQuestions, currentSectionIndex, currentModuleIndex])

  // Count answered questions in current module
  const currentModuleAnsweredCount = useMemo(() => {
    return currentModuleQuestions.filter(q => {
      const baseQuestionId = q.question.question ? q.question.question.id : q.question.id
      return answers[baseQuestionId] !== undefined
    }).length
  }, [currentModuleQuestions, answers])

  const unansweredCount = useMemo(() => {
    return allQuestions.length - Object.keys(answers).length
  }, [allQuestions, answers])

  // Timer color based on remaining time
  const getTimerClass = useCallback(() => {
    if (!timeRemaining) return 'bg-gray-50 text-gray-700 border-gray-200'
    if (timeRemaining <= 60) return 'bg-red-100 text-red-700 border-red-300 animate-pulse'
    if (timeRemaining <= 300) return 'bg-red-50 text-red-600 border-red-200'
    if (timeRemaining <= 600) return 'bg-orange-50 text-orange-600 border-orange-200'
    return 'bg-gray-50 text-gray-700 border-gray-200'
  }, [timeRemaining])

  // Get position styles for button based on snap position
  const getButtonPositionStyles = useCallback(() => {
    // Add extra padding below header for top positions
    const topOffset = `${headerHeight + 16}px` // header height + 1rem padding
    
    const positions = {
      'bottom-right': { bottom: '1rem', right: '1rem', top: 'auto', left: 'auto' },
      'bottom-left': { bottom: '1rem', left: '1rem', top: 'auto', right: 'auto' },
      'top-left': { top: topOffset, left: '1rem', bottom: 'auto', right: 'auto' },
      'top-right': { top: topOffset, right: '1rem', bottom: 'auto', left: 'auto' },
      'middle-left': { top: '50%', left: '1rem', transform: 'translateY(-50%)', bottom: 'auto', right: 'auto' },
      'middle-right': { top: '50%', right: '1rem', transform: 'translateY(-50%)', bottom: 'auto', left: 'auto' }
    }
    
    if (isDragging) {
      return {
        position: 'fixed' as const,
        left: `${dragPosition.x}px`,
        top: `${dragPosition.y}px`,
        transform: 'translate(-50%, -50%)',
        cursor: 'grabbing',
        zIndex: 1000
      }
    }
    
    return {
      position: 'fixed' as const,
      ...positions[buttonPosition],
      transition: 'all 0.3s ease-out'
    }
  }, [buttonPosition, isDragging, dragPosition, headerHeight])

  // Calculate nearest snap position
  const calculateSnapPosition = useCallback((x: number, y: number) => {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }
    
    const threshold = 150 // Distance from edge to snap
    const middleYRange = viewport.height * 0.3 // 30% from center is "middle"
    const centerY = viewport.height / 2
    
    // Check if in middle vertical range
    const isMiddle = Math.abs(y - centerY) < middleYRange
    
    if (isMiddle) {
      return x < viewport.width / 2 ? 'middle-left' : 'middle-right'
    }
    
    // Check corners
    const isTop = y < viewport.height / 2
    const isLeft = x < viewport.width / 2
    
    if (isTop) {
      return isLeft ? 'top-left' : 'top-right'
    } else {
      return isLeft ? 'bottom-left' : 'bottom-right'
    }
  }, [])

  // Drag event handlers
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    setIsDragging(true)
    setHasMoved(false) // Reset movement flag
    dragStartPos.current = { x: clientX, y: clientY }
    
    // Get current button position
    if (dragRef.current) {
      const rect = dragRef.current.getBoundingClientRect()
      buttonStartPos.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      }
      setDragPosition(buttonStartPos.current)
    }
  }, [])

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    const deltaX = clientX - dragStartPos.current.x
    const deltaY = clientY - dragStartPos.current.y
    
    // Check if moved beyond threshold
    if (!hasMoved && (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold)) {
      setHasMoved(true)
    }
    
    setDragPosition({
      x: buttonStartPos.current.x + deltaX,
      y: buttonStartPos.current.y + deltaY
    })
  }, [isDragging, hasMoved, dragThreshold])

  const handleDragEnd = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return
    
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as MouseEvent).clientX
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : (e as MouseEvent).clientY
    
    // Only snap if actually moved
    if (hasMoved) {
      const newPosition = calculateSnapPosition(clientX, clientY)
      setButtonPosition(newPosition)
    }
    
    setIsDragging(false)
    
    // Small delay to prevent click event if we moved
    setTimeout(() => {
      setHasMoved(false)
    }, 50)
  }, [isDragging, hasMoved, calculateSnapPosition])

  // Add global event listeners for drag
  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleDragMove(e)
      const handleMouseUp = (e: MouseEvent) => handleDragEnd(e)
      const handleTouchMove = (e: TouchEvent) => handleDragMove(e)
      const handleTouchEnd = (e: TouchEvent) => handleDragEnd(e)
      
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  // Get calculator styles based on mode
  const getCalculatorStyles = useCallback(() => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 40,
      backgroundColor: 'white',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      transition: isDraggingCalc || isResizingCalc ? 'none' : 'all 0.3s ease-out'
    }
    
    switch (calculatorMode) {
      case 'right-sidebar':
        return {
          ...baseStyles,
          right: 0,
          top: headerHeight,
          bottom: 0,
          width: '40%',
          minWidth: '350px',
          maxWidth: '600px',
          borderLeft: '1px solid #e5e7eb'
        }
      case 'left-sidebar':
        return {
          ...baseStyles,
          left: 0,
          top: headerHeight,
          bottom: 0,
          width: '40%',
          minWidth: '350px',
          maxWidth: '600px',
          borderRight: '1px solid #e5e7eb'
        }
      case 'bottom-drawer':
        return {
          ...baseStyles,
          left: 0,
          right: 0,
          bottom: 0,
          height: '50%',
          minHeight: '300px',
          maxHeight: '600px',
          borderTop: '1px solid #e5e7eb'
        }
      case 'floating':
        return {
          ...baseStyles,
          left: calculatorPosition.x,
          top: calculatorPosition.y,
          width: calculatorSize.width,
          height: calculatorSize.height,
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }
      case 'minimized':
        return {
          ...baseStyles,
          display: 'none'
        }
      default:
        return baseStyles
    }
  }, [calculatorMode, calculatorPosition, calculatorSize, isDraggingCalc, isResizingCalc, headerHeight])

  // Get main content styles when calculator is docked
  const getMainContentStyles = useCallback(() => {
    if (!showCalculator || calculatorMode === 'floating' || calculatorMode === 'minimized') {
      return {}
    }
    
    switch (calculatorMode) {
      case 'right-sidebar':
        return {
          marginRight: '40%',
          transition: 'margin 0.3s ease-out'
        }
      case 'left-sidebar':
        return {
          marginLeft: '40%',
          transition: 'margin 0.3s ease-out'
        }
      case 'bottom-drawer':
        return {
          marginBottom: '50%',
          transition: 'margin 0.3s ease-out'
        }
      default:
        return {}
    }
  }, [showCalculator, calculatorMode])

  // Calculator drag handler
  useEffect(() => {
    if (!isDraggingCalc) return
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      const deltaX = e.clientX - calcDragStart.current.x
      const deltaY = e.clientY - calcDragStart.current.y
      
      const newX = calcStartPos.current.x + deltaX
      const newY = calcStartPos.current.y + deltaY
      
      // Keep calculator within viewport
      setCalculatorPosition(prev => {
        const currentSize = calculatorSize // Use current value from closure
        return {
          x: Math.max(0, Math.min(window.innerWidth - currentSize.width, newX)),
          y: Math.max(0, Math.min(window.innerHeight - currentSize.height, newY))
        }
      })
    }
    
    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault()
      setIsDraggingCalc(false)
    }
    
    // Keep cursor change minimal while dragging
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingCalc])

  // Calculator resize handler
  useEffect(() => {
    if (!isResizingCalc) return
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      const deltaX = e.clientX - calcResizeStart.current.x
      const deltaY = e.clientY - calcResizeStart.current.y
      
      const newWidth = calcResizeStart.current.width + deltaX
      const newHeight = calcResizeStart.current.height + deltaY
      
      setCalculatorSize({
        width: Math.max(350, Math.min(window.innerWidth * 0.9, newWidth)),
        height: Math.max(300, Math.min(window.innerHeight * 0.9, newHeight))
      })
    }
    
    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault()
      setIsResizingCalc(false)
      document.body.style.cursor = ''
    }
    
    // Set cursor for entire document while resizing
    document.body.style.cursor = 'se-resize'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.body.style.cursor = ''
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizingCalc])

  // Save and load calculator preferences
  useEffect(() => {
    const saved = localStorage.getItem('calculatorPreferences')
    if (saved) {
      try {
        const prefs = JSON.parse(saved)
        if (prefs.mode) setCalculatorMode(prefs.mode)
        if (prefs.position) setCalculatorPosition(prefs.position)
        if (prefs.size) setCalculatorSize(prefs.size)
      } catch (e) {
        console.error('Failed to load calculator preferences')
      }
    }
  }, [])

  useEffect(() => {
    if (!isDraggingCalc && !isResizingCalc) {
      localStorage.setItem('calculatorPreferences', JSON.stringify({
        mode: calculatorMode,
        position: calculatorPosition,
        size: calculatorSize
      }))
    }
  }, [calculatorMode, calculatorPosition, calculatorSize, isDraggingCalc, isResizingCalc])

  // Measure header height dynamically
  useEffect(() => {
    const measureHeader = () => {
      // Look for the header element - it's usually the first fixed/sticky element or has specific classes
      const header = document.querySelector('header') || 
                     document.querySelector('[role="banner"]') ||
                     document.querySelector('.bg-white.border-b') ||
                     document.querySelector('nav')
      
      if (header) {
        const rect = header.getBoundingClientRect()
        setHeaderHeight(rect.height)
      } else {
        // Try to find any top fixed element that might be the header
        const elements = document.querySelectorAll('div')
        for (const el of elements) {
          const style = window.getComputedStyle(el)
          const rect = el.getBoundingClientRect()
          if ((style.position === 'fixed' || style.position === 'sticky') && 
              rect.top === 0 && rect.height > 40 && rect.height < 120) {
            setHeaderHeight(rect.height)
            break
          }
        }
      }
    }
    
    // Measure on mount and window resize
    measureHeader()
    window.addEventListener('resize', measureHeader)
    
    // Also measure after a short delay in case header renders late
    setTimeout(measureHeader, 100)
    
    return () => window.removeEventListener('resize', measureHeader)
  }, [exam]) // Re-measure when exam loads as header might change

  // Load saved button position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('questionTrayPosition')
    if (savedPosition && ['bottom-right', 'bottom-left', 'top-left', 'top-right', 'middle-left', 'middle-right'].includes(savedPosition)) {
      setButtonPosition(savedPosition as typeof buttonPosition)
    }
  }, [])

  // Save button position to localStorage when it changes
  useEffect(() => {
    if (!isDragging) {
      localStorage.setItem('questionTrayPosition', buttonPosition)
    }
  }, [buttonPosition, isDragging])

  useEffect(() => {
    // Just fetch the exam data directly
    fetchExam()
  }, [examId])

  // Keyboard navigation for answer choices
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentQuestion = getCurrentQuestion()
      if (!currentQuestion?.question.options) return

      // Arrow keys for navigation within radio group
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const options = currentQuestion.question.options
        const currentAnswerId = answers[currentQuestion.question.id]
        const currentIndex = options.findIndex(opt => opt.id === currentAnswerId)
        
        let newIndex
        if (e.key === 'ArrowDown') {
          newIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % options.length
        } else {
          newIndex = currentIndex === -1 ? options.length - 1 : (currentIndex - 1 + options.length) % options.length
        }
        
        if (options[newIndex]) {
          handleAnswerSelect(currentQuestion.id, options[newIndex].id)
          e.preventDefault()
        }
      }

      // Alt key shortcuts
      if (e.altKey) {
        switch (e.key) {
          case 'ArrowLeft':
            navigateToPrevious()
            break
          case 'ArrowRight':
            navigateToNext()
            break
          case 'f':
          case 'F':
            toggleFlag()
            break
          case 'g':
          case 'G':
            setShowQuestionGrid(true)
            break
          case '1':
          case '2':
          case '3':
          case '4':
            const optionIndex = parseInt(e.key) - 1
            selectAnswerByIndex(optionIndex)
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentSectionIndex, currentModuleIndex, currentQuestionIndex, answers])

  // Timer with warnings
  useEffect(() => {
    if (exam?.timeLimit && timeRemaining !== null) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) {
            if (!isSubmitting) {
              handleSubmitExam(true)
            }
            return 0
          }
          
          // Show warnings at specific intervals
          if (prev === 600 && timerWarning !== 600) {
            setTimerWarning(600)
            showToast('10 minutes remaining', 'warning')
          } else if (prev === 300 && timerWarning !== 300) {
            setTimerWarning(300)
            showToast('5 minutes remaining', 'warning')
          } else if (prev === 60 && timerWarning !== 60) {
            setTimerWarning(60)
            showToast('1 minute remaining!', 'error')
          }
          
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [exam?.timeLimit, timeRemaining, timerWarning, isSubmitting])

  // Focus management for modal
  useEffect(() => {
    if (showQuestionGrid) {
      previousFocusRef.current = document.activeElement as HTMLElement
      // Trap focus in modal
      const modal = document.getElementById('navigator-modal')
      if (modal) {
        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
        
        firstElement?.focus()
        
        const handleTabKey = (e: KeyboardEvent) => {
          if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === firstElement) {
              lastElement?.focus()
              e.preventDefault()
            } else if (!e.shiftKey && document.activeElement === lastElement) {
              firstElement?.focus()
              e.preventDefault()
            }
          }
          
          if (e.key === 'Escape') {
            setShowQuestionGrid(false)
          }
        }
        
        modal.addEventListener('keydown', handleTabKey)
        return () => modal.removeEventListener('keydown', handleTabKey)
      }
    } else {
      // Return focus to navigator button
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [showQuestionGrid])

  const fetchExam = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/students/exams/${examId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setExam(data.exam)
        setAssignmentId(data.assignment.id)
        setTimeRemaining(data.timeRemaining)
        
        if (data.savedAnswers) {
          // Only update answers if we don't have any yet (to avoid overwriting during navigation)
          setAnswers(prev => {
            if (Object.keys(prev).length > 0) {
              // We already have answers, don't overwrite
              return prev
            }
            
            const answersMap: Record<string, string> = {}
            Object.entries(data.savedAnswers).forEach(([questionId, answer]: [string, any]) => {
              if (answer.selectedChoice) {
                answersMap[questionId] = answer.selectedChoice
              }
            })
            return answersMap
          })
          
          const flaggedSet = new Set<string>()
          Object.entries(data.savedAnswers).forEach(([questionId, answer]: [string, any]) => {
            if (answer.isFlagged) {
              flaggedSet.add(questionId)
            }
          })
          setFlaggedQuestions(flaggedSet)
        }
      }
    } catch (error) {
      console.error('Failed to fetch exam:', error)
      showToast('Failed to load exam. Please refresh the page.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const saveAnswer = async (examQuestionId: string, answer: string) => {
    if (!assignmentId) return
    
    // Find the question from all questions to get base question ID
    const question = allQuestions.find(q => q.id === examQuestionId)
    if (!question) return
    
    // Get the base question ID (handle nested structure)
    const baseQuestionId = question.question.question ? question.question.question.id : question.question.id
    
    // Clear existing debounce
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current)
    }
    
    // Debounce save for text answers
    saveDebounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/students/exams/${examId}/answers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            assignmentId,
            questionId: baseQuestionId,  // Send base question ID to API
            selectedChoice: answer,
            isFlagged: flaggedQuestions.has(baseQuestionId)
          })
        })
        
        if (response.ok) {
          setSavedStatus(`Saved • ${new Date().toLocaleTimeString()}`)
          // Announce to screen readers
          announceToScreenReader('Answer saved')
          
          // Clear saved status after 3 seconds
          setTimeout(() => setSavedStatus(''), 3000)
        } else {
          throw new Error('Failed to save')
        }
      } catch (error) {
        console.error('Failed to save answer:', error)
        showToast('Failed to save answer. Retrying...', 'error')
        // Retry logic here if needed
      }
    }, 300) // 300ms debounce
  }

  const toggleFlag = async () => {
    const currentQuestion = getCurrentQuestion()
    if (!currentQuestion || !assignmentId) return
    
    // Use base question ID for consistency
    const baseQuestionId = currentQuestion.question.id
    const newFlagged = new Set(flaggedQuestions)
    
    if (newFlagged.has(baseQuestionId)) {
      newFlagged.delete(baseQuestionId)
      announceToScreenReader('Question unflagged')
    } else {
      newFlagged.add(baseQuestionId)
      announceToScreenReader('Question flagged for review')
    }
    
    setFlaggedQuestions(newFlagged)
    
    try {
      await fetch(`/api/students/exams/${examId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          assignmentId,
          questionId: baseQuestionId,
          selectedChoice: answers[baseQuestionId] || null,
          isFlagged: newFlagged.has(baseQuestionId)
        })
      })
    } catch (error) {
      console.error('Failed to update flag:', error)
      showToast('Failed to update flag', 'error')
    }
  }

  const handleSubmitExam = async (autoSubmit = false) => {
    if (!assignmentId || isSubmitting) return
    
    // Check for unanswered or flagged questions
    if (!autoSubmit && (unansweredCount > 0 || flaggedQuestions.size > 0)) {
      setShowReviewModal(true)
      return
    }
    
    const confirmed = autoSubmit || window.confirm(
      'Are you sure you want to submit this exam? You cannot change your answers after submission.'
    )
    
    if (!confirmed) return
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/students/exams/${examId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ assignmentId })
      })
      
      if (response.ok) {
        const data = await response.json()
        // Save results to sessionStorage for the review page
        const resultsWithExamInfo = {
          ...data,
          exam: {
            type: 'PRACTICE_TEST',
            allowRetakes: false
          }
        }
        sessionStorage.setItem(`exam-results-${examId}`, JSON.stringify(resultsWithExamInfo))
        router.push(`/dashboard/exams/${examId}/review`)
      } else {
        throw new Error('Failed to submit')
      }
    } catch (error) {
      console.error('Failed to submit exam:', error)
      showToast('Failed to submit exam. Please try again.', 'error')
      setIsSubmitting(false)
    }
  }

  const getCurrentSection = () => exam?.sections[currentSectionIndex]
  const getCurrentModule = () => getCurrentSection()?.modules[currentModuleIndex]
  const getCurrentQuestion = () => getCurrentModule()?.questions[currentQuestionIndex]

  const navigateToQuestion = (sIndex: number, mIndex: number, qIndex: number) => {
    setCurrentSectionIndex(sIndex)
    setCurrentModuleIndex(mIndex)
    setCurrentQuestionIndex(qIndex)
    setShowQuestionGrid(false)
    setShowReviewModal(false)
  }

  const navigateToNext = () => {
    const currentModule = getCurrentModule()
    if (!currentModule) return
    
    // Only navigate within current module
    if (currentQuestionIndex < currentModule.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
    // Don't automatically move to next module - user must complete current module first
  }

  const toggleStrikethrough = (optionId: string) => {
    setStrikethroughOptions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(optionId)) {
        newSet.delete(optionId)
      } else {
        newSet.add(optionId)
      }
      return newSet
    })
  }

  const navigateToPrevious = () => {
    // Only navigate within current module
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
    // Don't allow navigation to previous module
  }

  const selectAnswerByIndex = (index: number) => {
    const currentQuestion = getCurrentQuestion()
    if (!currentQuestion || !currentQuestion.question.options) return
    
    const option = currentQuestion.question.options[index]
    if (option) {
      handleAnswerSelect(currentQuestion.id, option.id)
    }
  }

  const handleAbortTest = async () => {
    // Navigate back to dashboard
    router.push('/dashboard')
  }

  const handleAnswerSelect = (examQuestionId: string, answer: string) => {
    if (!examQuestionId) {
      console.error('No exam question ID provided!')
      return
    }
    
    // Find the base question ID for storing answers
    const examQuestion = allQuestions.find(q => q.id === examQuestionId)
    if (!examQuestion) {
      console.error('Could not find exam question for ID:', examQuestionId)
      return
    }
    
    // The structure is: examQuestion.question (ExamQuestion) -> question (Question)
    const baseQuestionId = examQuestion.question.question ? examQuestion.question.question.id : examQuestion.question.id
    
    // Update answers state using base question ID
    const newAnswers = { ...answers, [baseQuestionId]: answer }
    
    setAnswers(newAnswers)
    saveAnswer(examQuestionId, answer)
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getQuestionStatus = (questionId: string) => {
    if (flaggedQuestions.has(questionId)) return 'flagged'
    if (answers[questionId]) return 'answered'
    return 'unanswered'
  }

  // Helper functions for accessibility
  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'status')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 1000)
  }

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    // Implementation for toast notification
    announceToScreenReader(message)
    console.log(`[${type.toUpperCase()}] ${message}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Exam Not Found</h2>
          <p className="text-gray-600">This exam is not available or has been removed.</p>
        </div>
      </div>
    )
  }

  const currentQuestion = getCurrentQuestion()
  const currentSection = getCurrentSection()
  const currentModule = getCurrentModule()
  
  // Calculate section-related values for question sidebar
  const currentSectionStartIndex = allQuestions.findIndex(q => q.sectionIndex === currentSectionIndex)
  const totalQuestionsInSection = allQuestions.filter(q => q.sectionIndex === currentSectionIndex).length
  const questions = allQuestions // alias for compatibility
  
  // Check if current section is Reading & Writing
  const isReadingWritingSection = currentSection?.title?.toLowerCase().includes('reading') || 
                                   currentSection?.title?.toLowerCase().includes('writing')

  // If no current question, show loading or error state
  if (!currentQuestion && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Questions Available</h2>
          <p className="text-gray-600">This exam doesn't have any questions yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header - Black to match dashboard */}
      <header className="h-20 bg-black px-8 flex items-center justify-between relative">
        {/* LEFT — Exam info */}
        <div className="flex-1 flex items-center">
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-light text-white">{exam?.title || 'Practice Test'}</h1>
            <div className="flex items-center gap-4">
              {/* UpstartPrep Logo */}
              <div className="flex items-center gap-1.5">
                <img 
                  src="https://res.cloudinary.com/dsoo2uoow/image/upload/v1753632447/Untitled_design_p2dbhm.png"
                  alt="UpstartPrep Logo"
                  className="h-6 w-auto"
                />
                <span className="text-xs text-gray-400 font-medium">UpstartPrep</span>
              </div>
              <span className="text-xs text-gray-400">
                Section {currentSectionIndex + 1}: {currentSection?.title}
              </span>
            </div>
          </div>
        </div>

        {/* CENTER — Timer (Absolutely positioned for true centering) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {exam.timeLimit && (
            <div className="flex items-center gap-2">
              {showTimer ? (
                <>
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-lg font-medium font-mono text-white">
                    {formatTime(timeRemaining || 0)}
                  </span>
                  <button
                    className="text-xs text-gray-500 hover:text-gray-300 underline ml-1"
                    onClick={() => setShowTimer(false)}
                  >
                    Hide
                  </button>
                </>
              ) : (
                <button
                  className="text-sm text-gray-500 hover:text-gray-300 underline"
                  onClick={() => setShowTimer(true)}
                >
                  Show Timer
                </button>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — Actions */}
        <div className="flex-1 flex items-center gap-2 justify-end">
          {/* Abort Test Button - Subtle but accessible */}
          <button
            onClick={() => setShowAbortModal(true)}
            className="p-2 hover:bg-gray-800 rounded transition-colors text-center group"
            aria-label="Exit test"
          >
            <LogOut className="h-4 w-4 text-gray-500 group-hover:text-red-400" />
            <span className="text-[10px] text-gray-500 group-hover:text-red-400 block mt-0.5">Exit</span>
          </button>
          
          <div className="w-px h-8 bg-gray-700 mx-1" /> {/* Separator */}
          
          <button
            onClick={() => setShowReference(true)}
            className="p-2 hover:bg-gray-800 rounded transition-colors text-center"
            aria-label="Reference materials"
          >
            <BookMarked className="h-4 w-4 text-gray-300" />
            <span className="text-[10px] text-gray-400 block mt-0.5">Reference</span>
          </button>
          <button
            className="p-2 hover:bg-gray-800 rounded transition-colors text-center"
            aria-label="Calculator"
            onClick={() => setShowCalculator(true)}
          >
            <Calculator className="h-4 w-4 text-gray-300" />
            <span className="text-[10px] text-gray-400 block mt-0.5">Calculator</span>
          </button>
          <button
            ref={navigatorButtonRef}
            onClick={() => setShowQuestionGrid(true)}
            className="p-2 hover:bg-gray-800 rounded transition-colors text-center"
            aria-label="More options"
          >
            <Grid3X3 className="h-4 w-4 text-gray-300" />
            <span className="text-[10px] text-gray-400 block mt-0.5">More</span>
          </button>
          <div className="ml-4">
            <select
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-white/20"
              value={`${currentSectionIndex}-${currentModuleIndex}`}
              onChange={(e) => {
                const [sIndex, mIndex] = e.target.value.split('-').map(Number)
                setCurrentSectionIndex(sIndex)
                setCurrentModuleIndex(mIndex)
                setCurrentQuestionIndex(0)
              }}
            >
              {exam.sections.map((section, sIndex) => (
                section.modules.map((module, mIndex) => (
                  <option key={`${sIndex}-${mIndex}`} value={`${sIndex}-${mIndex}`}>
                    {section.title} {module.title && `- ${module.title}`}
                  </option>
                ))
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Horizontal Progress Dots */}
      <div className="bg-gray-50 border-b px-4 py-3">
        <div className="flex items-center justify-center gap-1.5 overflow-x-auto scrollbar-hide">
          {allQuestions.map((q, index) => {
            const baseQuestionId = q.question.question ? q.question.question.id : q.question.id
            const status = getQuestionStatus(baseQuestionId)
            const isCurrent = q.sectionIndex === currentSectionIndex && 
                            q.moduleIndex === currentModuleIndex && 
                            q.questionIndex === currentQuestionIndex
            
            return (
              <button
                key={q.id}
                onClick={() => navigateToQuestion(q.sectionIndex, q.moduleIndex, q.questionIndex)}
                className={`
                  group relative flex-shrink-0 w-3 h-3 rounded-full transition-all duration-200
                  ${isCurrent 
                    ? 'w-4 h-4 bg-blue-600 ring-2 ring-blue-400 ring-offset-2' 
                    : status === 'answered'
                    ? 'bg-green-500 hover:scale-125'
                    : status === 'flagged'
                    ? 'bg-yellow-500 hover:scale-125'
                    : 'bg-gray-300 hover:bg-gray-400 hover:scale-125'
                  }
                `}
                aria-label={`Question ${index + 1} - ${status}${isCurrent ? ' (current)' : ''}`}
                title={`Question ${index + 1}`}
              >
                {status === 'flagged' && !isCurrent && (
                  <Flag className="absolute inset-0 w-full h-full text-white p-0.5" />
                )}
                {/* Tooltip on hover */}
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  Q{index + 1}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content Area - Conditional layout based on section type */}
      <main 
        className="flex-1 overflow-y-auto bg-gray-50" 
        role="main"
        style={getMainContentStyles()}
      >
        {isReadingWritingSection ? (
          // Two-column layout for Reading & Writing
          <div className="flex h-full relative">
            {/* Question Number Sidebar - Far Left */}
            <div className="w-16 bg-gray-50 border-r border-gray-200 overflow-y-auto">
              <div className="py-4">
                {currentModuleQuestions.map((q, i) => {
                  const isCurrentQuestion = q.sectionIndex === currentSectionIndex && 
                                          q.moduleIndex === currentModuleIndex && 
                                          q.questionIndex === currentQuestionIndex
                  const questionId = q.question?.question?.id || q.question?.id
                  const isAnswered = questionId && answers[questionId]
                  const isFlagged = questionId && flaggedQuestions.has(questionId)
                  
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        // Navigate to this question within the current module
                        navigateToQuestion(q.sectionIndex, q.moduleIndex, q.questionIndex)
                      }}
                      className={`
                        w-full py-3 text-sm font-medium transition-all
                        ${isCurrentQuestion 
                          ? 'bg-blue-500 text-white' 
                          : isAnswered
                          ? 'text-blue-600 hover:bg-gray-100'
                          : 'text-gray-500 hover:bg-gray-100'
                        }
                        ${isFlagged ? 'relative' : ''}
                      `}
                    >
                      {i + 1}
                      {isFlagged && (
                        <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
            
            {/* Left Column - Passage */}
            <div 
              className="bg-white border-r border-gray-200 overflow-y-auto p-8"
              style={{ width: `${columnWidth}%` }}
            >
              {currentQuestion?.question?.passage ? (
                <div className="prose prose-sm max-w-none">
                  <div className="mb-4 flex items-center justify-end">
                    {/* Highlighter Toolbar */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowHighlighter(!showHighlighter)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Toggle highlighter"
                      >
                        <Highlighter className="h-4 w-4 text-gray-600" />
                      </button>
                      {showHighlighter && (
                        <div className="flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-lg shadow-sm">
                          <button
                            onClick={() => setHighlighterColor('yellow')}
                            className={`w-8 h-8 rounded ${highlighterColor === 'yellow' ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                            style={{ backgroundColor: '#fef3c7' }}
                            title="Yellow"
                          />
                          <button
                            onClick={() => setHighlighterColor('blue')}
                            className={`w-8 h-8 rounded ${highlighterColor === 'blue' ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                            style={{ backgroundColor: '#dbeafe' }}
                            title="Blue"
                          />
                          <button
                            onClick={() => setHighlighterColor('green')}
                            className={`w-8 h-8 rounded ${highlighterColor === 'green' ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                            style={{ backgroundColor: '#d1fae5' }}
                            title="Green"
                          />
                          <button
                            onClick={() => setHighlighterColor('pink')}
                            className={`w-8 h-8 rounded ${highlighterColor === 'pink' ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                            style={{ backgroundColor: '#fce7f3' }}
                            title="Pink"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Passage content */}
                  <div 
                    className="text-base leading-relaxed text-gray-800 select-text"
                      onMouseUp={() => {
                        if (!showHighlighter) return
                        
                        const selection = window.getSelection()
                        if (!selection || selection.isCollapsed) return
                        
                        const selectedText = selection.toString()
                        if (!selectedText.trim()) return
                        
                        // Create a unique ID for this highlight
                        const highlightId = `highlight-${Date.now()}`
                        const passageId = currentQuestion.question.passage || currentQuestion.question.id
                        
                        // Add highlight to state
                        setHighlights(prev => ({
                          ...prev,
                          [passageId]: [
                            ...(prev[passageId] || []),
                            {
                              id: highlightId,
                              start: selection.anchorOffset,
                              end: selection.focusOffset,
                              color: highlighterColor,
                              text: selectedText
                            }
                          ]
                        }))
                        
                        // Wrap selected text with highlight span
                        try {
                          const range = selection.getRangeAt(0)
                          const span = document.createElement('span')
                          span.className = 'highlighted-text'
                          span.style.backgroundColor = {
                            yellow: '#fef3c7',
                            blue: '#dbeafe',
                            green: '#d1fae5',
                            pink: '#fce7f3'
                          }[highlighterColor]
                          span.style.padding = '2px 0'
                          span.style.borderRadius = '2px'
                          
                          range.surroundContents(span)
                          selection.removeAllRanges()
                        } catch (e) {
                          // If surroundContents fails (e.g., selection spans multiple elements),
                          // fall back to a simpler approach
                          console.log('Could not highlight across elements')
                        }
                      }}
                  >
                    <KatexRenderer content={currentQuestion.question.passage} />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>No passage for this question</p>
                </div>
              )}
            </div>
            
            
            {/* Right Column - Question */}
            <div 
              className="flex-1 overflow-y-auto"
              style={{ width: `${100 - columnWidth}%` }}
            >
              <div className="max-w-3xl mx-auto px-8 py-8">
                <div className="">
                  {/* Question Header with Flag */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Question {currentGlobalIndex + 1}
                      </h2>
                      <button
                        onClick={toggleFlag}
                        className={`p-1.5 rounded transition-colors ${
                          currentQuestion && flaggedQuestions.has(
                            currentQuestion.question.id
                          )
                            ? 'text-orange-600 hover:text-orange-700'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                        aria-label={`${
                          currentQuestion && flaggedQuestions.has(
                            currentQuestion.question.id
                          ) ? 'Unflag' : 'Flag'
                        } question`}
                        title="Flag for review"
                      >
                        <BookMarked className="h-4 w-4" />
                      </button>
                    </div>
                    {currentQuestion?.question?.points && currentQuestion.question.points > 0 && (
                      <span className="text-sm text-gray-500">
                        {currentQuestion.question.points} {currentQuestion.question.points === 1 ? 'point' : 'points'}
                      </span>
                    )}
                  </div>
                  
                  {/* Question Instruction Only - for Reading & Writing, extract just the question */}
                  {currentQuestion?.question?.questionText && (
                    <div className="text-base leading-relaxed text-gray-700 mb-6">
                      {/* For Reading & Writing, questionText often contains the instruction */}
                      <KatexRenderer content={currentQuestion.question.questionText} />
                    </div>
                  )}
            
            {/* Answer Options */}
            <div className="space-y-3">
            {currentQuestion?.question.questionType === 'MULTIPLE_CHOICE' && currentQuestion.question.options ? (
              <div 
                className="space-y-3"
                role="radiogroup"
                aria-labelledby="answer-label"
                aria-describedby="answer-instructions"
              >
                <span id="answer-instructions" className="sr-only">
                  Use arrow keys to navigate between choices, Space to select
                </span>
                {currentQuestion.question.options.map((option, index) => {
                  const optionLetter = String.fromCharCode(65 + index)
                  const baseQuestionId = currentQuestion.question.id
                  const isSelected = answers[baseQuestionId] === option.id
                  
                  return (
                    <label
                      key={option.id}
                      className={`
                        relative flex items-center gap-4 py-4 px-5 rounded-lg cursor-pointer 
                        transition-all duration-150 border
                        ${isSelected
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.question.id}`}
                        value={option.id}
                        checked={isSelected}
                        onChange={() => handleAnswerSelect(currentQuestion.id, option.id)}
                        className="sr-only"
                        aria-label={`Option ${optionLetter}`}
                      />
                      
                      {/* Radio Button */}
                      <div className="flex items-center justify-center">
                        <div className={`w-5 h-5 rounded-full border-2 transition-all ${
                          isSelected ? 'border-blue-500' : 'border-gray-400'
                        }`}>
                          {isSelected && (
                            <div className="w-full h-full rounded-full flex items-center justify-center">
                              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Option Letter and Text */}
                      <div className="flex items-start gap-3 flex-1">
                        <span className={`text-base font-medium min-w-[24px] ${strikethroughOptions.has(option.id) ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                          {optionLetter})
                        </span>
                        <div className={`text-base leading-relaxed relative flex-1 ${strikethroughOptions.has(option.id) ? 'text-gray-400' : 'text-gray-700'}`}>
                          <div className={strikethroughOptions.has(option.id) ? 'line-through decoration-2 decoration-gray-600' : ''}>
                            <KatexRenderer content={option.text} />
                          </div>
                        </div>
                      </div>
                      
                      {/* Strikethrough Option */}
                      <button
                        type="button"
                        className={`p-1.5 rounded transition-colors ${
                          strikethroughOptions.has(option.id) 
                            ? 'text-red-600 bg-red-100 hover:bg-red-200' 
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                        onClick={(e) => {
                          e.preventDefault()
                          toggleStrikethrough(option.id)
                        }}
                        aria-label={`${strikethroughOptions.has(option.id) ? 'Remove' : 'Add'} strike through`}
                        title={`${strikethroughOptions.has(option.id) ? 'Remove' : 'Add'} strike through`}
                      >
                        <span className="text-xs font-bold">S</span>
                      </button>
                    </label>
                  )
                })}
              </div>
            ) : currentQuestion?.question.questionType === 'SHORT_ANSWER' ? (
              <div className="space-y-3">
                <textarea
                  className="w-full p-4 border-2 border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  rows={6}
                  placeholder="Enter your answer here..."
                  value={answers[currentQuestion.question.id] || ''}
                  onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
                  aria-label="Short answer response"
                />
                <p className="text-xs text-gray-500">
                  Your answer will be automatically saved as you type.
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-600">This question type is not yet supported.</p>
              </div>
            )}
            </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Single column layout for Math sections
          <div className="max-w-4xl mx-auto px-8 py-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              {/* Question Header with Flag */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-light text-gray-900">
                    Question {currentGlobalIndex + 1}
                  </h2>
                  <button
                    onClick={toggleFlag}
                    className={`p-2 rounded-lg transition-colors ${
                      currentQuestion && flaggedQuestions.has(
                        currentQuestion.question.id
                      )
                        ? 'text-orange-600 bg-orange-100 hover:bg-orange-200'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                    aria-label={`${
                      currentQuestion && flaggedQuestions.has(
                        currentQuestion.question.id
                      ) ? 'Unflag' : 'Flag'
                    } question`}
                    title="Flag for review"
                  >
                    <BookMarked className="h-5 w-5" />
                  </button>
                </div>
                {currentQuestion?.question?.points && currentQuestion.question.points > 0 && (
                  <span className="text-sm text-gray-500">
                    {currentQuestion.question.points} {currentQuestion.question.points === 1 ? 'point' : 'points'}
                  </span>
                )}
              </div>
              
              {/* Question Text */}
              <div className="text-base text-gray-800 leading-relaxed mb-8">
                {currentQuestion?.question?.questionText && (
                  <KatexRenderer content={currentQuestion.question.questionText} />
                )}
              </div>
              
              {/* Answer Options */}
              <div className="space-y-3">
              {currentQuestion?.question.questionType === 'MULTIPLE_CHOICE' && currentQuestion.question.options ? (
                <div 
                  className="space-y-3"
                  role="radiogroup"
                  aria-labelledby="answer-label"
                  aria-describedby="answer-instructions"
                >
                  <span id="answer-instructions" className="sr-only">
                    Use arrow keys to navigate between choices, Space to select
                  </span>
                  {currentQuestion.question.options.map((option, index) => {
                    const optionLetter = String.fromCharCode(65 + index)
                    const baseQuestionId = currentQuestion.question.id
                    const isSelected = answers[baseQuestionId] === option.id
                    
                    return (
                      <label
                        key={option.id}
                        className={`
                          relative flex items-center gap-4 py-4 px-5 rounded-lg border-2 cursor-pointer 
                          transition-all duration-150
                          ${isSelected
                            ? 'bg-blue-50 border-blue-500'
                            : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.question.id}`}
                          value={option.id}
                          checked={isSelected}
                          onChange={() => handleAnswerSelect(currentQuestion.id, option.id)}
                          className="sr-only"
                          aria-label={`Option ${optionLetter}`}
                        />
                        
                        {/* Radio Circle */}
                        <div className="flex items-center justify-center">
                          <div className={`
                            w-5 h-5 rounded-full border-2 transition-all
                            ${isSelected
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-400'
                            }
                          `}>
                            {isSelected && (
                              <div className="w-full h-full rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full" />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Option Letter and Text */}
                        <div className="flex items-center gap-3 flex-1">
                          <span className={`text-base font-medium ${strikethroughOptions.has(option.id) ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{optionLetter})</span>
                          <div className={`text-base relative ${strikethroughOptions.has(option.id) ? 'text-gray-400' : 'text-gray-800'}`}>
                            <div className={strikethroughOptions.has(option.id) ? 'line-through decoration-2 decoration-gray-600' : ''}>
                              <KatexRenderer content={option.text} />
                            </div>
                          </div>
                        </div>
                        
                        {/* Strikethrough Option */}
                        <button
                          type="button"
                          className={`p-1.5 rounded transition-colors ${
                            strikethroughOptions.has(option.id) 
                              ? 'text-red-600 bg-red-100 hover:bg-red-200' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                          }`}
                          onClick={(e) => {
                            e.preventDefault()
                            toggleStrikethrough(option.id)
                          }}
                          aria-label={`${strikethroughOptions.has(option.id) ? 'Remove' : 'Add'} strike through`}
                          title={`${strikethroughOptions.has(option.id) ? 'Remove' : 'Add'} strike through`}
                        >
                          <span className="text-xs font-bold">S</span>
                        </button>
                      </label>
                    )
                  })}
                </div>
              ) : currentQuestion?.question.questionType === 'SHORT_ANSWER' ? (
                <div className="space-y-3">
                  <textarea
                    className="w-full p-4 border-2 border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    rows={6}
                    placeholder="Enter your answer here..."
                    value={answers[currentQuestion.question.id] || ''}
                    onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
                    aria-label="Short answer response"
                  />
                  <p className="text-xs text-gray-500">
                    Your answer will be automatically saved as you type.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-600">This question type is not yet supported.</p>
                </div>
              )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Navigation Footer - Fixed at bottom */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={navigateToPrevious}
              disabled={currentQuestionIndex === 0}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all
                ${currentQuestionIndex === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }
              `}
              aria-label="Previous question"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{currentModuleAnsweredCount} of {currentModuleQuestions.length} answered</span>
              {flaggedQuestions.size > 0 && (
                <span className="text-orange-600 font-medium">
                  {flaggedQuestions.size} flagged for review
                </span>
              )}
            </div>
            
            <button
              onClick={navigateToNext}
              disabled={currentQuestionIndex === currentModuleQuestions.length - 1}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all
                ${currentQuestionIndex === currentModuleQuestions.length - 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800 shadow-sm'
                }
              `}
              aria-label="Next question"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Persistent Draggable Question Tray Button */}
      <button
        ref={dragRef}
        onClick={() => {
          // Only open drawer if we didn't drag (just clicked)
          if (!isDragging && !hasMoved) {
            setShowQuestionGrid(true)
          }
        }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        style={getButtonPositionStyles()}
        className={`
          bg-white shadow-md rounded-full px-4 py-2 flex items-center gap-2 
          border border-gray-200 text-sm z-30
          ${isDragging 
            ? 'opacity-80 shadow-2xl scale-110' 
            : 'hover:shadow-lg hover:scale-105 transition-all duration-200'
          }
        `}
      >
        <div className="flex items-center gap-2 pointer-events-none select-none">
          <Grid className="h-4 w-4 text-gray-600" />
          <span className="font-medium text-gray-700">
            Q{currentQuestionIndex + 1}/{currentModuleQuestions.length}
          </span>
          {currentModuleAnsweredCount > 0 && (
            <span className="text-xs text-green-600">
              ({currentModuleAnsweredCount} done)
            </span>
          )}
          <ChevronUp 
            className={`h-3 w-3 text-gray-500 transition-transform ${
              buttonPosition.includes('top') ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </button>

      {/* Question Navigator Drawer */}
      <>
        {/* Backdrop - semi-transparent to allow viewing question */}
        <div 
          className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
            showQuestionGrid ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setShowQuestionGrid(false)}
        />
        
        {/* Drawer */}
        <div 
          className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out ${
            showQuestionGrid ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
            <div 
              className="bg-white rounded-t-xl shadow-2xl overflow-hidden mx-auto"
              style={{ maxHeight: '280px', maxWidth: '1200px' }}
              role="dialog"
              aria-label="Question Navigator"
              aria-modal="true"
            >
              {/* Drawer Handle */}
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>
              
              {/* Section Header */}
              <div className="px-6 py-2 text-center">
                <h3 className="text-sm font-medium text-gray-700">
                  Section 1. Module 1: Math
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Questions answered ({currentModuleAnsweredCount} / {currentModuleQuestions.length})
                </p>
              </div>
              
              {/* Legend */}
              <div className="px-6 py-2">
                <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                      <CircleDot className="h-3 w-3 text-white" />
                    </div>
                    <span>Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-400 rounded flex items-center justify-center">
                      <Circle className="h-3 w-3 text-white" />
                    </div>
                    <span>Unanswered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-yellow-500 rounded flex items-center justify-center">
                      <Flag className="h-3 w-3 text-white" />
                    </div>
                    <span>For Review</span>
                  </div>
                </div>
              </div>
              
              {/* Questions Grid */}
              <div className="px-6 py-3 overflow-y-auto" style={{ maxHeight: '120px' }}>
                <div className="flex flex-wrap gap-3 justify-center">
                  {currentModuleQuestions.map((q, index) => {
                    const baseQuestionId = q.question.question ? q.question.question.id : q.question.id
                    const status = getQuestionStatus(baseQuestionId)
                    const isCurrent = q.sectionIndex === currentSectionIndex && 
                                    q.moduleIndex === currentModuleIndex && 
                                    q.questionIndex === currentQuestionIndex
                    const isAnswered = status === 'answered'
                    const isFlagged = status === 'flagged'
                    
                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          navigateToQuestion(q.sectionIndex, q.moduleIndex, q.questionIndex)
                          setShowQuestionGrid(false)
                        }}
                        className={`
                          relative w-16 h-16 rounded-lg flex items-center justify-center text-lg font-bold
                          transition-all duration-150 active:scale-95
                          ${isCurrent 
                            ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2' 
                            : isAnswered
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : isFlagged
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }
                        `}
                        aria-label={`Question ${index + 1} - ${status}`}
                      >
                        <span className={isCurrent ? 'text-white' : 'text-gray-900'}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        {isAnswered && !isCurrent && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded flex items-center justify-center">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                        )}
                        {!isAnswered && !isCurrent && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-400 rounded flex items-center justify-center">
                            <Circle className="h-3 w-3 text-white" />
                          </div>
                        )}
                        {isFlagged && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded flex items-center justify-center">
                            <Flag className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
      </>

      {/* Review Modal before submission */}
      {showReviewModal && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={(e) => e.target === e.currentTarget && setShowReviewModal(false)}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Review Before Submission</h2>
            
            <div className="space-y-4 mb-6">
              {unansweredCount > 0 && (
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-3">
                    <Circle className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium text-red-900">
                      {unansweredCount} Unanswered {unansweredCount === 1 ? 'Question' : 'Questions'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const firstUnanswered = allQuestions.find(
                        q => !answers[q.question.question.id]
                      )
                      if (firstUnanswered) {
                        navigateToQuestion(
                          firstUnanswered.sectionIndex,
                          firstUnanswered.moduleIndex,
                          firstUnanswered.questionIndex
                        )
                      }
                    }}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Go to first →
                  </button>
                </div>
              )}
              
              {flaggedQuestions.size > 0 && (
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-3">
                    <Flag className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-900">
                      {flaggedQuestions.size} Flagged for Review
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const firstFlagged = allQuestions.find(
                        q => flaggedQuestions.has(q.question.question.id)
                      )
                      if (firstFlagged) {
                        navigateToQuestion(
                          firstFlagged.sectionIndex,
                          firstFlagged.moduleIndex,
                          firstFlagged.questionIndex
                        )
                      }
                    }}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Review →
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
              >
                Continue Review
              </button>
              <button
                onClick={() => {
                  setShowReviewModal(false)
                  handleSubmitExam(true)
                }}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Positioning Desmos Calculator */}
      {showCalculator && calculatorMode !== 'minimized' && (
        <div 
          ref={calcRef}
          style={getCalculatorStyles()}
          className={`flex flex-col ${calculatorMode === 'floating' ? 'rounded-lg' : ''} ${
            isDraggingCalc ? 'shadow-2xl opacity-90 scale-105' : ''
          } ${isResizingCalc ? 'shadow-xl' : ''}`}
        >
          {/* Calculator Header with Controls */}
          <div 
            className={`bg-gray-50 border-b border-gray-200 px-3 py-2 flex-shrink-0 ${
              calculatorMode === 'floating' ? 'cursor-move rounded-t-lg' : ''
            }`}
            onMouseDown={(e) => {
              // Only start dragging if we're not clicking on a button or its children
              const target = e.target as HTMLElement
              const isButton = target.tagName === 'BUTTON' || target.closest('button')
              
              if (calculatorMode === 'floating' && !isResizingCalc && !isButton) {
                e.preventDefault()
                setIsDraggingCalc(true)
                calcDragStart.current = { x: e.clientX, y: e.clientY }
                calcStartPos.current = { x: calculatorPosition.x, y: calculatorPosition.y }
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700 select-none">Desmos Calculator</span>
              </div>
              
              {/* Position Control Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCalculatorMode('left-sidebar')}
                  className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
                    calculatorMode === 'left-sidebar' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
                  }`}
                  title="Dock Left"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={() => setCalculatorMode('bottom-drawer')}
                  className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
                    calculatorMode === 'bottom-drawer' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
                  }`}
                  title="Dock Bottom"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
                
                <button
                  onClick={() => setCalculatorMode('right-sidebar')}
                  className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
                    calculatorMode === 'right-sidebar' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
                  }`}
                  title="Dock Right"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
                
                <button
                  onClick={() => setCalculatorMode('floating')}
                  className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
                    calculatorMode === 'floating' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
                  }`}
                  title="Float Window"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                
                <div className="w-px h-5 bg-gray-300 mx-1" />
                
                <button
                  onClick={() => setCalculatorMode('minimized')}
                  className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
                  title="Minimize"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowCalculator(false)
                  }}
                  className="p-1.5 rounded hover:bg-red-100 transition-colors text-gray-600 hover:text-red-600"
                  title="Close Calculator"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Desmos iframe Container */}
          <div className="flex-1 bg-white overflow-hidden">
            <iframe
              src="https://www.desmos.com/testing/virginia/graphing"
              className="w-full h-full"
              title="Desmos Graphing Calculator"
              style={{ border: 'none', display: 'block' }}
            />
          </div>
          
          {/* Resize Handle for floating mode */}
          {calculatorMode === 'floating' && (
            <div
              className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize hover:bg-blue-100 transition-colors"
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsResizingCalc(true)
                calcResizeStart.current = {
                  width: calculatorSize.width,
                  height: calculatorSize.height,
                  x: e.clientX,
                  y: e.clientY
                }
              }}
              style={{
                borderBottomRightRadius: '8px'
              }}
            >
              <svg 
                className="w-6 h-6 text-gray-400" 
                viewBox="0 0 24 24" 
                fill="none"
                style={{ transform: 'rotate(90deg)' }}
              >
                <path 
                  d="M12 17L7 12L12 7M17 17L12 12L17 7" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
      )}
      
      {/* Minimized Calculator Button */}
      {showCalculator && calculatorMode === 'minimized' && (
        <button
          onClick={() => setCalculatorMode('right-sidebar')}
          className="fixed bottom-24 right-4 bg-white shadow-lg rounded-full p-3 hover:shadow-xl transition-all z-30 border border-gray-200"
          title="Restore Calculator"
        >
          <Calculator className="h-5 w-5 text-blue-600" />
        </button>
      )}

      {/* Reference Sheet Modal */}
      {showReference && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-fit max-h-[70vh] flex flex-col m-4">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <BookMarked className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Reference Sheet</h2>
              </div>
              <button
                onClick={() => setShowReference(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close reference sheet"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            {/* Content - Display the reference sheet image */}
            <div className="overflow-auto">
              <img 
                src="https://res.cloudinary.com/dsoo2uoow/image/upload/v1756949011/Screenshot_2025-09-03_at_21.23.26_uqxmd4.png" 
                alt="Mathematics Reference Sheet"
                className="block"
                style={{ maxHeight: 'calc(70vh - 80px)', width: 'auto', maxWidth: '800px' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Module Completion Modal for Adaptive Exams */}
      {showModuleCompletion && isAdaptiveExam && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Module 1 Complete!
            </h2>
            <p className="text-lg text-gray-700 mb-4">
              Score: <span className="font-bold">{module1Score}/22</span>
            </p>
            
            {adaptivePath && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">Based on your performance, you'll now take:</p>
                <p className="text-lg font-semibold text-blue-700">
                  Module 2 - {adaptivePath === 'HARD' ? 'Advanced' : 'Standard'} Level
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              <span>Loading next module...</span>
            </div>
          </div>
        </div>
      )}

      {/* Screen reader announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      />

      {/* Abort Test Confirmation Modal */}
      {showAbortModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Exit Test?
                </h2>
                <p className="text-gray-600 text-sm">
                  Are you sure you want to exit the test? Your progress will not be saved.
                </p>
              </div>
            </div>

            {/* Warning Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-amber-900 font-medium mb-1">This action cannot be undone</p>
                  <ul className="text-amber-700 space-y-1">
                    <li>• Your answers will be lost</li>
                    <li>• You'll need to start over if you want to retake</li>
                    <li>• No score will be recorded</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowAbortModal(false)}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Continue Test
              </button>
              <button
                onClick={handleAbortTest}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Exit Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}