'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  BookOpen, FileText, Home, ClipboardCheck, 
  Plus, Search, Filter, ChevronRight, ArrowLeft,
  Calendar, Users, Clock, CheckCircle, AlertCircle,
  Edit2, Copy, Trash2, MoreVertical, ChevronUp, ChevronDown
} from 'lucide-react'
import Link from 'next/link'

interface Module {
  id: string
  title: string | null
  order: number
  moduleType: string | null
  difficulty: string | null
  _count: {
    questions: number
  }
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
  program: string
  examType: string
  subProgram?: string
  examNumber?: number
  timeLimit?: number
  isPublished: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
  sections?: Section[]
  _count?: {
    sections: number
    assignments: number
  }
}

const programs = [
  { value: 'SAT', label: 'SAT', color: 'bg-blue-500' },
  { value: 'ACT', label: 'ACT', color: 'bg-green-500' },
  { value: 'ISEE', label: 'ISEE', subPrograms: ['Lower', 'Middle', 'Upper'], color: 'bg-purple-500' },
  { value: 'SSAT', label: 'SSAT', subPrograms: ['Elementary', 'Middle', 'Upper'], color: 'bg-orange-500' },
  { value: 'HSPT', label: 'HSPT', color: 'bg-red-500' }
]

const examTypes = [
  { value: 'PRACTICE_TEST', label: 'Practice Test', icon: FileText },
  { value: 'HOMEWORK', label: 'Homework', icon: Home },
  { value: 'QUIZ', label: 'Quiz', icon: ClipboardCheck },
  { value: 'DIAGNOSTIC', label: 'Diagnostic', icon: AlertCircle },
  { value: 'CUSTOM', label: 'Custom', icon: BookOpen }
]

export default function ExamsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProgram, setSelectedProgram] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showPublished, setShowPublished] = useState<'all' | 'published' | 'draft'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'type'>('recent')
  const [expandedExams, setExpandedExams] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      const response = await fetch('/api/admin/exams?details=true')
      if (response.ok) {
        const data = await response.json()
        setExams(data.exams || [])
      }
    } catch (error) {
      console.error('Failed to fetch exams:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredExams = exams.filter(exam => {
    if (selectedProgram !== 'all' && exam.program !== selectedProgram) return false
    if (selectedType !== 'all' && exam.examType !== selectedType) return false
    if (showPublished !== 'all') {
      if (showPublished === 'published' && !exam.isPublished) return false
      if (showPublished === 'draft' && exam.isPublished) return false
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return exam.title.toLowerCase().includes(query) ||
             exam.description?.toLowerCase().includes(query) ||
             exam.tags?.some(tag => tag.toLowerCase().includes(query))
    }
    return true
  })

  const sortedExams = [...filteredExams].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'type':
        return a.examType.localeCompare(b.examType)
      case 'recent':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    }
  })

  const groupedExams = sortedExams.reduce((acc, exam) => {
    const key = `${exam.program}-${exam.examType}`
    if (!acc[key]) {
      acc[key] = {
        program: exam.program,
        examType: exam.examType,
        exams: []
      }
    }
    acc[key].exams.push(exam)
    return acc
  }, {} as Record<string, { program: string; examType: string; exams: Exam[] }>)

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam?')) return
    
    try {
      const response = await fetch(`/api/admin/exams/${examId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        await fetchExams()
      }
    } catch (error) {
      console.error('Failed to delete exam:', error)
    }
  }

  const toggleExamExpansion = (examId: string) => {
    setExpandedExams(prev => {
      const newSet = new Set(prev)
      if (newSet.has(examId)) {
        newSet.delete(examId)
      } else {
        newSet.add(examId)
      }
      return newSet
    })
  }

  const getTotalQuestions = (exam: Exam) => {
    if (!exam.sections) return 0
    return exam.sections.reduce((total, section) => 
      total + section.modules.reduce((sectionTotal, module) => 
        sectionTotal + module._count.questions, 0), 0)
  }

  const handleDuplicateExam = async (examId: string) => {
    try {
      const response = await fetch(`/api/admin/exams/${examId}/duplicate`, {
        method: 'POST'
      })
      if (response.ok) {
        await fetchExams()
      }
    } catch (error) {
      console.error('Failed to duplicate exam:', error)
    }
  }

  const togglePublish = async (examId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/exams/${examId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !currentStatus })
      })
      if (response.ok) {
        await fetchExams()
      }
    } catch (error) {
      console.error('Failed to toggle publish status:', error)
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
                href="/admin/dashboard"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Exam Management</h1>
                <p className="text-gray-400 text-sm mt-1">Create and manage all your exams in one place</p>
              </div>
            </div>
            <Link
              href="/admin/exams/new"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create New Exam
            </Link>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exams by title, description, or tags..."
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Program Filter */}
          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
          >
            <option value="all">All Programs</option>
            {programs.map(prog => (
              <option key={prog.value} value={prog.value}>{prog.label}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
          >
            <option value="all">All Types</option>
            {examTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={showPublished}
            onChange={(e) => setShowPublished(e.target.value as any)}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
          >
            <option value="recent">Most Recent</option>
            <option value="title">Title A-Z</option>
            <option value="type">By Type</option>
          </select>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Total:</span>
            <span className="text-white font-semibold">{exams.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Published:</span>
            <span className="text-green-400 font-semibold">
              {exams.filter(e => e.isPublished).length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Drafts:</span>
            <span className="text-yellow-400 font-semibold">
              {exams.filter(e => !e.isPublished).length}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : sortedExams.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery || selectedProgram !== 'all' || selectedType !== 'all' 
                ? 'No exams found' 
                : 'No exams yet'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchQuery || selectedProgram !== 'all' || selectedType !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first exam to get started'}
            </p>
            <Link
              href="/admin/exams/new"
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create New Exam
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.values(groupedExams).map(group => {
              const programInfo = programs.find(p => p.value === group.program)
              const typeInfo = examTypes.find(t => t.value === group.examType)
              const Icon = typeInfo?.icon || FileText
              
              return (
                <div key={`${group.program}-${group.examType}`} className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-gray-700/50 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded ${programInfo?.color || 'bg-gray-500'}`} />
                      <Icon className="h-5 w-5 text-gray-400" />
                      <h3 className="text-lg font-semibold text-white">
                        {group.program} - {typeInfo?.label}
                      </h3>
                      <span className="text-sm text-gray-400">
                        ({group.exams.length})
                      </span>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-gray-700">
                    {group.exams.map(exam => {
                      const isExpanded = expandedExams.has(exam.id)
                      const totalQuestions = getTotalQuestions(exam)
                      
                      return (
                      <div key={exam.id}>
                        <div 
                          className="p-4 hover:bg-gray-700/30 transition-colors cursor-pointer"
                          onClick={() => toggleExamExpansion(exam.id)}
                        >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <Link
                                  href={`/admin/exams/${exam.id}`}
                                  className="text-white font-medium hover:text-red-400 transition-colors"
                                >
                                  {exam.title}
                                </Link>
                                {exam.description && (
                                  <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                                    {exam.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-xs">
                                  {exam.subProgram && (
                                    <span className="px-2 py-1 bg-gray-700 rounded text-gray-300">
                                      {exam.subProgram}
                                    </span>
                                  )}
                                  {exam.examNumber && (
                                    <span className="text-gray-400">
                                      #{exam.examNumber}
                                    </span>
                                  )}
                                  {exam.timeLimit && (
                                    <span className="flex items-center gap-1 text-gray-400">
                                      <Clock className="h-3 w-3" />
                                      {exam.timeLimit} min
                                    </span>
                                  )}
                                  {exam._count && (
                                    <>
                                      <span className="text-gray-400">
                                        {exam._count.sections} sections
                                      </span>
                                      <span className="text-gray-400">
                                        {exam._count.assignments} assignments
                                      </span>
                                    </>
                                  )}
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    exam.isPublished 
                                      ? 'bg-green-900/50 text-green-400' 
                                      : 'bg-yellow-900/50 text-yellow-400'
                                  }`}>
                                    {exam.isPublished ? 'Published' : 'Draft'}
                                  </span>
                                  {totalQuestions > 0 && (
                                    <span className="flex items-center gap-1 text-red-400 font-semibold">
                                      <BookOpen className="h-3 w-3" />
                                      {totalQuestions} questions
                                    </span>
                                  )}
                                  {exam.sections && exam.sections.length > 0 && (
                                    isExpanded ? (
                                      <ChevronUp className="h-4 w-4 text-gray-400" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-gray-400" />
                                    )
                                  )}
                                </div>
                                {exam.tags && exam.tags.length > 0 && (
                                  <div className="flex gap-2 mt-2">
                                    {exam.tags.map(tag => (
                                      <span key={tag} className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Link
                              href={`/admin/exams/${exam.id}`}
                              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDuplicateExam(exam.id)}
                              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                              title="Duplicate"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => togglePublish(exam.id, exam.isPublished)}
                              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                              title={exam.isPublished ? 'Unpublish' : 'Publish'}
                            >
                              {exam.isPublished ? (
                                <AlertCircle className="h-4 w-4" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteExam(exam.id)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        </div>
                        
                        {/* Expanded Content - Module Details */}
                        {isExpanded && exam.sections && (
                          <div className="bg-gray-900 border-t border-gray-700 p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-gray-300">Module Details</h4>
                              <span className="text-lg font-bold text-red-400">
                                {totalQuestions} Total Questions
                              </span>
                            </div>
                            {exam.sections.map(section => (
                              <div key={section.id} className="mb-4">
                                <h5 className="text-sm font-medium text-gray-400 mb-2">
                                  Section {section.order}: {section.title}
                                </h5>
                                <div className="space-y-2">
                                  {section.modules.map(module => (
                                    <div 
                                      key={module.id}
                                      className="flex items-center justify-between bg-gray-800 rounded p-3"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-300">
                                          {module.title || `Module ${module.order}`}
                                        </span>
                                        {module.moduleType && (
                                          <span className={`px-2 py-0.5 text-xs rounded ${
                                            module.moduleType === 'ROUTING' 
                                              ? 'bg-purple-900/50 text-purple-400'
                                              : module.moduleType === 'ADAPTIVE'
                                              ? 'bg-blue-900/50 text-blue-400'
                                              : 'bg-gray-700 text-gray-400'
                                          }`}>
                                            {module.moduleType}
                                          </span>
                                        )}
                                        {module.difficulty && (
                                          <span className={`px-2 py-0.5 text-xs rounded ${
                                            module.difficulty === 'HARD'
                                              ? 'bg-red-900/50 text-red-400'
                                              : 'bg-green-900/50 text-green-400'
                                          }`}>
                                            {module.difficulty}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm font-semibold text-white">
                                          {module._count.questions} questions
                                        </span>
                                        <Link
                                          href={`/admin/exams/${exam.id}/module/${module.id}`}
                                          onClick={(e) => e.stopPropagation()}
                                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                                        >
                                          View Questions
                                        </Link>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}