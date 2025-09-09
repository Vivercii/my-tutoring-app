'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  ArrowLeft, FileText, BookOpen, FileSpreadsheet, BarChart3
} from 'lucide-react'

// Import the separated view components
import QuestionsView from '@/components/admin/question-bank/QuestionsView'
import PassagesView from '@/components/admin/question-bank/PassagesView'
import BulkImportView from '@/components/admin/question-bank/BulkImportView'
import HeatmapView from '@/components/admin/question-bank/HeatmapView'

interface AnswerOption {
  id?: string
  text: string
  isCorrect: boolean
}

interface Passage {
  id: string
  title: string
  content: string
  program: string
  _count?: { questions: number }
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
  passageId?: string
  passage?: Passage
  options?: AnswerOption[]
  metadata?: any
  _count?: { examQuestions: number }
}

export default function QuestionBankPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'questions' | 'passages' | 'bulk-import' | 'heatmap'>('questions')
  
  // Questions state
  const [questions, setQuestions] = useState<Question[]>([])
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [loadingQuestions, setLoadingQuestions] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('')
  const [filterProgram, setFilterProgram] = useState('')
  const [filterSkill, setFilterSkill] = useState('')
  const [showInternalOnly, setShowInternalOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedForDelete, setSelectedForDelete] = useState<string[]>([])
  
  // Passages state
  const [passages, setPassages] = useState<Passage[]>([])
  const [loadingPassages, setLoadingPassages] = useState(false)
  const [passageSearch, setPassageSearch] = useState('')
  const [passageProgram, setPassageProgram] = useState('')
  
  // Form states
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [showPassageForm, setShowPassageForm] = useState(false)
  const [showQuestionPreview, setShowQuestionPreview] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [editingPassage, setEditingPassage] = useState<Passage | null>(null)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterSubject, filterDifficulty, filterProgram, filterSkill, showInternalOnly])

  useEffect(() => {
    if (activeTab === 'questions') {
      fetchQuestions()
    } else if (activeTab === 'passages') {
      fetchPassages()
    }
  }, [activeTab, searchQuery, filterSubject, filterDifficulty, filterProgram, filterSkill, passageSearch, passageProgram, showInternalOnly, currentPage])

  const fetchQuestions = async () => {
    setLoadingQuestions(true)
    try {
      // Use different endpoint for internal questions
      if (showInternalOnly) {
        const response = await fetch('/api/admin/questions/bulk-delete?internal=true')
        if (response.ok) {
          const data = await response.json()
          setQuestions(data.questions)
          setTotalQuestions(data.total)
          setTotalPages(data.totalPages)
        }
      } else {
        const params = new URLSearchParams({
          ...(searchQuery && { search: searchQuery }),
          ...(filterSubject && { subject: filterSubject }),
          ...(filterDifficulty && { difficulty: filterDifficulty }),
          ...(filterProgram && { program: filterProgram }),
          ...(filterSkill && { skill: filterSkill }),
          page: currentPage.toString(),
          internal: 'false' // Explicitly request non-internal questions
        })
        
        const response = await fetch(`/api/admin/question-bank?${params}`)
        if (response.ok) {
          const data = await response.json()
          setQuestions(data.questions)
          setTotalQuestions(data.total)
          setTotalPages(data.totalPages)
        }
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error)
    } finally {
      setLoadingQuestions(false)
    }
  }

  const fetchPassages = async () => {
    setLoadingPassages(true)
    try {
      const params = new URLSearchParams({
        ...(passageSearch && { search: passageSearch }),
        ...(passageProgram && { program: passageProgram })
      })
      
      const response = await fetch(`/api/admin/passages?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPassages(data.passages)
      }
    } catch (error) {
      console.error('Failed to fetch passages:', error)
    } finally {
      setLoadingPassages(false)
    }
  }

  // Render the appropriate tab content based on activeTab
  const renderTabContent = () => {
    if (activeTab === 'questions') {
      return (
        <QuestionsView
          questions={questions}
          totalQuestions={totalQuestions}
          loadingQuestions={loadingQuestions}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterSubject={filterSubject}
          setFilterSubject={setFilterSubject}
          filterDifficulty={filterDifficulty}
          setFilterDifficulty={setFilterDifficulty}
          filterProgram={filterProgram}
          setFilterProgram={setFilterProgram}
          filterSkill={filterSkill}
          setFilterSkill={setFilterSkill}
          showInternalOnly={showInternalOnly}
          setShowInternalOnly={setShowInternalOnly}
          selectedForDelete={selectedForDelete}
          setSelectedForDelete={setSelectedForDelete}
          showQuestionForm={showQuestionForm}
          setShowQuestionForm={setShowQuestionForm}
          editingQuestion={editingQuestion}
          setEditingQuestion={setEditingQuestion}
          showQuestionPreview={showQuestionPreview}
          setShowQuestionPreview={setShowQuestionPreview}
          passages={passages}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          fetchQuestions={fetchQuestions}
          fetchPassages={fetchPassages}
        />
      )
    }
    
    if (activeTab === 'passages') {
      return (
        <PassagesView
          passages={passages}
          loadingPassages={loadingPassages}
          passageSearch={passageSearch}
          setPassageSearch={setPassageSearch}
          passageProgram={passageProgram}
          setPassageProgram={setPassageProgram}
          showPassageForm={showPassageForm}
          setShowPassageForm={setShowPassageForm}
          editingPassage={editingPassage}
          setEditingPassage={setEditingPassage}
          fetchPassages={fetchPassages}
        />
      )
    }
    
    if (activeTab === 'bulk-import') {
      return <BulkImportView />
    }
    
    if (activeTab === 'heatmap') {
      return <HeatmapView />
    }
    
    return null
  }

  if (!session?.user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">You need admin privileges to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </button>
          <h1 className="text-3xl font-bold text-white">Question Bank</h1>
          <p className="text-gray-400 mt-2">Manage questions, passages, and bulk imports</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-800 mb-6">
          <nav className="-mb-px flex gap-8">
            <button
              onClick={() => setActiveTab('questions')}
              className={`py-3 px-1 border-b-2 transition-colors ${
                activeTab === 'questions' 
                  ? 'border-red-600 text-white' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Questions
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('passages')}
              className={`py-3 px-1 border-b-2 transition-colors ${
                activeTab === 'passages' 
                  ? 'border-red-600 text-white' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Passages
              </div>
            </button>

            <button
              onClick={() => setActiveTab('bulk-import')}
              className={`py-3 px-1 border-b-2 transition-colors ${
                activeTab === 'bulk-import' 
                  ? 'border-red-600 text-white' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Bulk Import
              </div>
            </button>

            <button
              onClick={() => setActiveTab('heatmap')}
              className={`py-3 px-1 border-b-2 transition-colors ${
                activeTab === 'heatmap' 
                  ? 'border-red-600 text-white' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Heatmap
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content - Clean conditional rendering */}
        <div className="tab-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}