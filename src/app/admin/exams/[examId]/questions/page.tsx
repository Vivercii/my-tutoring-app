'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import { 
  ArrowLeft, Plus, Search, Filter, Check, X,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { useDebounce } from '@/hooks/useDebounce'

const KatexRenderer = dynamic(() => import('@/components/KatexRenderer'), { 
  ssr: false 
})

interface AnswerOption {
  id: string
  text: string
  isCorrect: boolean
}

interface Question {
  id: string
  questionCode?: string
  program: string
  subject: string
  topic?: string
  difficulty?: string
  questionText: string
  questionType: string
  points: number
  explanation?: string
  options?: AnswerOption[]
}

export default function AddQuestionsPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const examId = params.examId as string
  const moduleId = searchParams.get('moduleId')
  
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('')
  const [filterTopic, setFilterTopic] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [adding, setAdding] = useState(false)
  const [examInfo, setExamInfo] = useState<any>(null)
  
  const debouncedSearch = useDebounce(searchQuery, 300)

  const subjects = ['Math', 'Reading', 'Writing', 'Science', 'English']
  const difficulties = ['Easy', 'Medium', 'Hard']

  useEffect(() => {
    fetchExamInfo()
  }, [examId])

  useEffect(() => {
    fetchQuestions()
  }, [debouncedSearch, filterSubject, filterDifficulty, filterTopic, page, examInfo])

  const fetchExamInfo = async () => {
    try {
      const response = await fetch(`/api/admin/exams/${examId}`)
      if (response.ok) {
        const data = await response.json()
        setExamInfo(data)
      }
    } catch (error) {
      console.error('Failed to fetch exam info:', error)
    }
  }

  const fetchQuestions = async () => {
    if (!examInfo) return
    
    setLoading(true)
    try {
      const params = new URLSearchParams({
        program: examInfo.program,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filterSubject && { subject: filterSubject }),
        ...(filterDifficulty && { difficulty: filterDifficulty }),
        ...(filterTopic && { topic: filterTopic }),
        page: page.toString(),
        limit: '20'
      })
      
      const response = await fetch(`/api/admin/question-bank?${params}`)
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
        setTotalPages(data.totalPages || 1)
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedQuestions.size === questions.length) {
      setSelectedQuestions(new Set())
    } else {
      setSelectedQuestions(new Set(questions.map(q => q.id)))
    }
  }

  const handleToggleQuestion = (questionId: string) => {
    const newSelected = new Set(selectedQuestions)
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId)
    } else {
      newSelected.add(questionId)
    }
    setSelectedQuestions(newSelected)
  }

  const handleAddQuestions = async () => {
    if (!moduleId || selectedQuestions.size === 0) {
      alert(moduleId ? 'Please select questions to add' : 'Please select a module first')
      return
    }

    setAdding(true)
    try {
      // Find which section the module belongs to
      const section = examInfo.sections.find((s: any) => 
        s.modules.some((m: any) => m.id === moduleId)
      )
      
      if (!section) {
        alert('Module not found')
        return
      }

      const response = await fetch(
        `/api/admin/exams/${examId}/sections/${section.id}/modules/${moduleId}/questions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionIds: Array.from(selectedQuestions)
          })
        }
      )

      if (response.ok) {
        router.push(`/admin/exams/${examId}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add questions')
      }
    } catch (error) {
      console.error('Failed to add questions:', error)
      alert('Failed to add questions')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/admin/exams/${examId}`}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Add Questions</h1>
                <p className="text-gray-400 text-sm mt-1">
                  {examInfo?.title || 'Loading...'}
                  {moduleId && ' - Adding to module'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">
                {selectedQuestions.size} selected
              </span>
              <button
                onClick={handleAddQuestions}
                disabled={adding || selectedQuestions.size === 0 || !moduleId}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                {adding ? 'Adding...' : `Add ${selectedQuestions.size} Questions`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by code, text, or topic..."
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
          
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
          >
            <option value="">All Subjects</option>
            {subjects.map(subj => (
              <option key={subj} value={subj}>{subj}</option>
            ))}
          </select>
          
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
          >
            <option value="">All Difficulties</option>
            {difficulties.map(diff => (
              <option key={diff} value={diff}>{diff}</option>
            ))}
          </select>
          
          <input
            type="text"
            value={filterTopic}
            onChange={(e) => setFilterTopic(e.target.value)}
            placeholder="Filter by topic..."
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
          />
        </div>

        {!moduleId && (
          <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
            <p className="text-yellow-400 text-sm">
              ⚠️ Please select a module from the exam page first before adding questions
            </p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <p className="text-xl text-white mb-2">No questions found</p>
            <p className="text-gray-400">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                {selectedQuestions.size === questions.length ? 'Deselect All' : 'Select All'}
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 text-gray-400 hover:text-white disabled:text-gray-600"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-gray-400 text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 text-gray-400 hover:text-white disabled:text-gray-600"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {questions.map(question => (
                <div
                  key={question.id}
                  className={`bg-gray-800 rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedQuestions.has(question.id) 
                      ? 'ring-2 ring-red-600 bg-gray-700' 
                      : 'hover:bg-gray-700'
                  }`}
                  onClick={() => handleToggleQuestion(question.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedQuestions.has(question.id)
                        ? 'bg-red-600 border-red-600'
                        : 'border-gray-600'
                    }`}>
                      {selectedQuestions.has(question.id) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      {question.questionCode && (
                        <span className="inline-block px-2 py-0.5 bg-gray-700 rounded text-xs font-mono text-gray-300 mb-1">
                          {question.questionCode}
                        </span>
                      )}
                      <KatexRenderer 
                        content={question.questionText}
                        className="text-white text-sm"
                      />
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="text-gray-400">{question.subject}</span>
                        {question.topic && (
                          <span className="text-gray-400">{question.topic}</span>
                        )}
                        {question.difficulty && (
                          <span className={`px-2 py-0.5 rounded ${
                            question.difficulty === 'Easy' 
                              ? 'bg-green-900/50 text-green-400'
                              : question.difficulty === 'Medium'
                              ? 'bg-yellow-900/50 text-yellow-400'
                              : 'bg-red-900/50 text-red-400'
                          }`}>
                            {question.difficulty}
                          </span>
                        )}
                        <span className="text-gray-400">{question.points} pts</span>
                        <span className="text-gray-400">
                          {question.questionType.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}