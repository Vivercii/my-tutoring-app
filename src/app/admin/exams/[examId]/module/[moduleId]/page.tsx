'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, CheckCircle, XCircle, Eye, EyeOff, 
  Copy, Search, Filter, ChevronDown, ChevronUp,
  BookOpen, Hash, Clock, AlertCircle, Code, FileText
} from 'lucide-react'

interface AnswerOption {
  id: string
  text: string
  isCorrect: boolean
}

interface Question {
  id: string
  questionCode: string | null
  questionText: string
  questionType: string
  points: number
  difficulty: string | null
  explanation: string | null
  options: AnswerOption[]
}

interface ExamQuestion {
  id: string
  order: number
  question: Question
}

interface Module {
  id: string
  title: string | null
  order: number
  moduleType: string | null
  difficulty: string | null
  timeLimit: number | null
  questions: ExamQuestion[]
}

interface Section {
  id: string
  title: string
  order: number
}

interface Exam {
  id: string
  title: string
  description: string | null
  program: string
}

interface ModuleData {
  module: Module
  section: Section
  exam: Exam
}

export default function ModuleQuestionsPage() {
  const params = useParams()
  const router = useRouter()
  const examId = params.examId as string
  const moduleId = params.moduleId as string
  
  const [moduleData, setModuleData] = useState<ModuleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAnswers, setShowAnswers] = useState(true)
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set())
  const [renderMode, setRenderMode] = useState<'html' | 'raw'>('html')

  useEffect(() => {
    fetchModuleData()
  }, [examId, moduleId])

  const fetchModuleData = async () => {
    try {
      const response = await fetch(`/api/admin/exams/${examId}/modules/${moduleId}`)
      if (response.ok) {
        const data = await response.json()
        setModuleData(data)
        // Auto-expand all questions by default
        const allQuestionIds = new Set(data.module.questions.map((q: ExamQuestion) => q.id))
        setExpandedQuestions(allQuestionIds)
      }
    } catch (error) {
      console.error('Failed to fetch module data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleQuestionExpansion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const toggleAllExpansion = () => {
    if (expandedQuestions.size === moduleData?.module.questions.length) {
      setExpandedQuestions(new Set())
    } else {
      const allQuestionIds = new Set(moduleData?.module.questions.map(q => q.id))
      setExpandedQuestions(allQuestionIds)
    }
  }

  const filteredQuestions = moduleData?.module.questions.filter(examQuestion => {
    if (!searchTerm) return true
    const question = examQuestion.question
    return question.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
           question.questionCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           question.explanation?.toLowerCase().includes(searchTerm.toLowerCase())
  }) || []

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'MULTIPLE_CHOICE': return 'bg-blue-100 text-blue-700'
      case 'SHORT_ANSWER': return 'bg-green-100 text-green-700'
      case 'FREE_RESPONSE': return 'bg-purple-100 text-purple-700'
      case 'ESSAY': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'hard': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!moduleData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Module Not Found</h2>
          <p className="text-gray-600">This module could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <nav className="text-sm text-gray-500 mb-1">
                  <Link href="/admin/exams" className="hover:text-gray-700">
                    Exams
                  </Link>
                  <span className="mx-2">/</span>
                  <Link href={`/admin/exams/${examId}`} className="hover:text-gray-700">
                    {moduleData.exam.title}
                  </Link>
                  <span className="mx-2">/</span>
                  <span className="text-gray-900">
                    {moduleData.module.title || `Module ${moduleData.module.order}`}
                  </span>
                </nav>
                <h1 className="text-2xl font-bold text-gray-900">
                  {moduleData.module.title || `Module ${moduleData.module.order}`} Questions
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-gray-600">
                    Section: {moduleData.section.title}
                  </span>
                  {moduleData.module.moduleType && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      moduleData.module.moduleType === 'ROUTING' 
                        ? 'bg-purple-100 text-purple-700'
                        : moduleData.module.moduleType === 'ADAPTIVE'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {moduleData.module.moduleType}
                    </span>
                  )}
                  {moduleData.module.difficulty && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      moduleData.module.difficulty === 'HARD'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {moduleData.module.difficulty}
                    </span>
                  )}
                  {moduleData.module.timeLimit && (
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {moduleData.module.timeLimit} min
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowAnswers(!showAnswers)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  showAnswers
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showAnswers ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {showAnswers ? 'Hide' : 'Show'} Answers
              </button>
              
              <button
                onClick={() => setRenderMode(renderMode === 'html' ? 'raw' : 'html')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  renderMode === 'html'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={renderMode === 'html' ? 'View as HTML' : 'View as formatted text'}
              >
                {renderMode === 'html' ? <FileText className="h-4 w-4" /> : <Code className="h-4 w-4" />}
                {renderMode === 'html' ? 'Formatted' : 'Raw HTML'}
              </button>
              
              <button
                onClick={toggleAllExpansion}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                {expandedQuestions.size === moduleData?.module.questions.length ? 'Collapse All' : 'Expand All'}
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-600">
              Showing {filteredQuestions.length} of {moduleData.module.questions.length} questions
            </span>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-4">
          {filteredQuestions.map((examQuestion) => {
            const question = examQuestion.question
            const isExpanded = expandedQuestions.has(examQuestion.id)
            const correctAnswer = question.options.find(opt => opt.isCorrect)
            
            return (
              <div key={examQuestion.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Question Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleQuestionExpansion(examQuestion.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                          <Hash className="h-4 w-4" />
                          Question {examQuestion.order}
                        </span>
                        {question.questionCode && (
                          <span className="text-xs text-gray-500">
                            Code: {question.questionCode}
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getQuestionTypeColor(question.questionType)}`}>
                          {question.questionType.replace('_', ' ')}
                        </span>
                        {question.difficulty && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty}
                          </span>
                        )}
                        <span className="text-xs text-gray-600">
                          {question.points} point{question.points !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      {!isExpanded && (
                        <div className="space-y-2">
                          {renderMode === 'html' ? (
                            <div 
                              className="text-gray-800 line-clamp-3 prose-question"
                              dangerouslySetInnerHTML={{ __html: question.questionText }}
                            />
                          ) : (
                            <pre className="text-gray-800 text-sm font-mono whitespace-pre-wrap line-clamp-3 bg-gray-100 p-2 rounded">
                              {question.questionText}
                            </pre>
                          )}
                          {/* Preview of answer choices */}
                          {question.options.length > 0 && (
                            <div className="mt-2 space-y-1 bg-gray-50 p-2 rounded">
                              {question.options.slice(0, 4).map((option, index) => (
                                <div key={option.id} className="flex items-start gap-2 text-sm">
                                  <span className="font-semibold text-gray-700 min-w-[20px]">
                                    {String.fromCharCode(65 + index)}.
                                  </span>
                                  {renderMode === 'html' ? (
                                    <div 
                                      className="line-clamp-2 flex-1 text-gray-600"
                                      dangerouslySetInnerHTML={{ __html: option.text }}
                                    />
                                  ) : (
                                    <pre className="line-clamp-2 flex-1 text-gray-600 font-mono text-xs">
                                      {option.text}
                                    </pre>
                                  )}
                                  {showAnswers && option.isCorrect && (
                                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {showAnswers && correctAnswer && !isExpanded && (
                        <div className="mt-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-700 font-medium">
                            Correct: {correctAnswer.text.substring(0, 50)}...
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          copyToClipboard(question.questionText)
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Copy question"
                      >
                        <Copy className="h-4 w-4 text-gray-500" />
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    {/* Full Question Text */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Question:</h4>
                      {renderMode === 'html' ? (
                        <div 
                          className="text-gray-800 prose-question bg-white p-4 rounded-lg border border-gray-200"
                          dangerouslySetInnerHTML={{ __html: question.questionText }}
                        />
                      ) : (
                        <pre className="text-gray-800 text-sm font-mono whitespace-pre-wrap bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                          {question.questionText}
                        </pre>
                      )}
                    </div>
                    
                    {/* Answer Options */}
                    {question.options.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Answer Choices:</h4>
                        <div className="space-y-2">
                          {question.options.map((option, index) => (
                            <div 
                              key={option.id}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                showAnswers && option.isCorrect
                                  ? 'bg-green-50 border-green-400 shadow-sm'
                                  : 'bg-white border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <span className="font-bold text-gray-700 text-lg min-w-[30px]">
                                  {String.fromCharCode(65 + index)}.
                                </span>
                                <div className="flex-1">
                                  {renderMode === 'html' ? (
                                    <div 
                                      className="prose-question text-gray-800"
                                      dangerouslySetInnerHTML={{ __html: option.text }} 
                                    />
                                  ) : (
                                    <pre className="text-gray-800 text-sm font-mono whitespace-pre-wrap bg-gray-50 p-2 rounded">
                                      {option.text}
                                    </pre>
                                  )}
                                </div>
                                {showAnswers && option.isCorrect && (
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="text-green-600 font-semibold text-sm">Correct</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Explanation */}
                    {showAnswers && question.explanation && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Explanation:</h4>
                        {renderMode === 'html' ? (
                          <div 
                            className="prose-question text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-200"
                            dangerouslySetInnerHTML={{ __html: question.explanation }}
                          />
                        ) : (
                          <pre className="text-gray-800 text-sm font-mono whitespace-pre-wrap bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                            {question.explanation}
                          </pre>
                        )}
                      </div>
                    )}
                    
                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>ID: {question.id}</span>
                      {question.questionCode && (
                        <span>Code: {question.questionCode}</span>
                      )}
                      <span>Type: {question.questionType}</span>
                      <span>Points: {question.points}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Empty State */}
        {filteredQuestions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No questions found
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? `No questions match "${searchTerm}"`
                : 'This module has no questions yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}