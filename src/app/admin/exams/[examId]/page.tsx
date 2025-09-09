'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import { 
  ArrowLeft, Save, Plus, Trash2, Edit2, Copy, 
  ChevronDown, ChevronRight, Clock, Hash, 
  FileText, CheckCircle, AlertCircle, MoreVertical,
  GripVertical, X
} from 'lucide-react'
import Link from 'next/link'

const KatexRenderer = dynamic(() => import('@/components/KatexRenderer'), { 
  ssr: false 
})

interface AnswerOption {
  id: string
  text: string
  isCorrect: boolean
}

interface QuestionBankItem {
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

interface ExamQuestion {
  id: string
  order: number
  question: QuestionBankItem
}

interface ExamModule {
  id: string
  title?: string
  order: number
  timeLimit?: number
  questions: ExamQuestion[]
}

interface ExamSection {
  id: string
  title: string
  order: number
  modules: ExamModule[]
}

interface Exam {
  id: string
  title: string
  description?: string
  program: string
  examType?: string
  subProgram?: string
  examNumber?: number
  timeLimit?: number
  isPublished?: boolean
  tags?: string[]
  sections: ExamSection[]
}

export default function ExamDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const examId = params.examId as string
  
  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [editingExam, setEditingExam] = useState(false)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editingModule, setEditingModule] = useState<string | null>(null)
  
  // Form states
  const [examTitle, setExamTitle] = useState('')
  const [examDescription, setExamDescription] = useState('')
  const [sectionTitles, setSectionTitles] = useState<Record<string, string>>({})
  const [moduleTitles, setModuleTitles] = useState<Record<string, string>>({})
  const [moduleTimeLimits, setModuleTimeLimits] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchExam()
  }, [examId])

  const fetchExam = async () => {
    try {
      const response = await fetch(`/api/admin/exams/${examId}`)
      if (response.ok) {
        const data = await response.json()
        setExam(data)
        setExamTitle(data.title)
        setExamDescription(data.description || '')
        
        // Initialize section and module titles
        const secTitles: Record<string, string> = {}
        const modTitles: Record<string, string> = {}
        const modTimes: Record<string, string> = {}
        
        data.sections?.forEach((section: ExamSection) => {
          secTitles[section.id] = section.title
          section.modules?.forEach((module: ExamModule) => {
            modTitles[module.id] = module.title || ''
            modTimes[module.id] = module.timeLimit?.toString() || ''
          })
        })
        
        setSectionTitles(secTitles)
        setModuleTitles(modTitles)
        setModuleTimeLimits(modTimes)
        
        // Expand first section by default
        if (data.sections?.length > 0) {
          setExpandedSections(new Set([data.sections[0].id]))
          if (data.sections[0].modules?.length > 0) {
            setExpandedModules(new Set([data.sections[0].modules[0].id]))
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch exam:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  const saveExamDetails = async () => {
    try {
      const response = await fetch(`/api/admin/exams/${examId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: examTitle,
          description: examDescription
        })
      })
      if (response.ok) {
        await fetchExam()
        setEditingExam(false)
      }
    } catch (error) {
      console.error('Failed to save exam:', error)
    }
  }

  const saveSectionTitle = async (sectionId: string) => {
    try {
      const response = await fetch(`/api/admin/exams/${examId}/sections/${sectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: sectionTitles[sectionId]
        })
      })
      if (response.ok) {
        await fetchExam()
        setEditingSection(null)
      }
    } catch (error) {
      console.error('Failed to save section:', error)
    }
  }

  const saveModuleDetails = async (moduleId: string) => {
    try {
      const section = exam?.sections.find(s => 
        s.modules.some(m => m.id === moduleId)
      )
      if (!section) return

      const response = await fetch(
        `/api/admin/exams/${examId}/sections/${section.id}/modules/${moduleId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: moduleTitles[moduleId] || null,
            timeLimit: moduleTimeLimits[moduleId] ? parseInt(moduleTimeLimits[moduleId]) : null
          })
        }
      )
      if (response.ok) {
        await fetchExam()
        setEditingModule(null)
      }
    } catch (error) {
      console.error('Failed to save module:', error)
    }
  }

  const addSection = async () => {
    const title = prompt('Enter section title (e.g., "Reading and Writing", "Math"):')
    if (!title) return

    try {
      const response = await fetch(`/api/admin/exams/${examId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      })
      if (response.ok) {
        await fetchExam()
      }
    } catch (error) {
      console.error('Failed to add section:', error)
    }
  }

  const addModule = async (sectionId: string) => {
    try {
      const response = await fetch(`/api/admin/exams/${examId}/sections/${sectionId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      if (response.ok) {
        await fetchExam()
      }
    } catch (error) {
      console.error('Failed to add module:', error)
    }
  }

  const deleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure? This will delete all modules and questions in this section.')) return

    try {
      const response = await fetch(`/api/admin/exams/${examId}/sections/${sectionId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        await fetchExam()
      }
    } catch (error) {
      console.error('Failed to delete section:', error)
    }
  }

  const deleteModule = async (sectionId: string, moduleId: string) => {
    if (!confirm('Are you sure? This will remove all questions from this module.')) return

    try {
      const response = await fetch(
        `/api/admin/exams/${examId}/sections/${sectionId}/modules/${moduleId}`,
        { method: 'DELETE' }
      )
      if (response.ok) {
        await fetchExam()
      }
    } catch (error) {
      console.error('Failed to delete module:', error)
    }
  }

  const removeQuestion = async (moduleId: string, questionId: string) => {
    if (!confirm('Remove this question from the exam?')) return

    const section = exam?.sections.find(s => 
      s.modules.some(m => m.id === moduleId)
    )
    if (!section) return

    try {
      const response = await fetch(
        `/api/admin/exams/${examId}/sections/${section.id}/modules/${moduleId}/questions/${questionId}`,
        { method: 'DELETE' }
      )
      if (response.ok) {
        await fetchExam()
      }
    } catch (error) {
      console.error('Failed to remove question:', error)
    }
  }

  const getTotalQuestions = () => {
    return exam?.sections.reduce((total, section) => 
      total + section.modules.reduce((secTotal, module) => 
        secTotal + (module.questions?.length || 0), 0
      ), 0
    ) || 0
  }

  const getTotalPoints = () => {
    return exam?.sections.reduce((total, section) => 
      total + section.modules.reduce((secTotal, module) => 
        secTotal + (module.questions?.reduce((modTotal, q) => 
          modTotal + (q.question.points || 1), 0
        ) || 0), 0
      ), 0
    ) || 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Exam not found</h2>
          <Link href="/admin/exams" className="text-red-400 hover:text-red-300">
            Back to exams
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/exams"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                {editingExam ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      className="text-2xl font-bold bg-gray-700 text-white px-3 py-1 rounded"
                    />
                    <input
                      type="text"
                      value={examDescription}
                      onChange={(e) => setExamDescription(e.target.value)}
                      placeholder="Description (optional)"
                      className="block text-sm bg-gray-700 text-gray-300 px-3 py-1 rounded w-full"
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-white">{exam.title}</h1>
                    {exam.description && (
                      <p className="text-gray-400 text-sm mt-1">{exam.description}</p>
                    )}
                  </>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="px-2 py-1 bg-gray-700 rounded text-gray-300">
                    {exam.program}
                  </span>
                  {exam.examType && (
                    <span className="px-2 py-1 bg-gray-700 rounded text-gray-300">
                      {exam.examType.replace('_', ' ')}
                    </span>
                  )}
                  {exam.subProgram && (
                    <span className="px-2 py-1 bg-gray-700 rounded text-gray-300">
                      {exam.subProgram}
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded ${
                    exam.isPublished 
                      ? 'bg-green-900/50 text-green-400' 
                      : 'bg-yellow-900/50 text-yellow-400'
                  }`}>
                    {exam.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {editingExam ? (
                <>
                  <button
                    onClick={() => setEditingExam(false)}
                    className="px-4 py-2 text-gray-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveExamDetails}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditingExam(true)}
                    className="text-gray-400 hover:text-white p-2"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <Link
                    href={`/admin/exams/${examId}/questions`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Add Questions
                  </Link>
                  <button
                    onClick={addSection}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Section
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-gray-400" />
            <span className="text-gray-400">Sections:</span>
            <span className="text-white font-semibold">{exam.sections.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <span className="text-gray-400">Questions:</span>
            <span className="text-white font-semibold">{getTotalQuestions()}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-gray-400" />
            <span className="text-gray-400">Total Points:</span>
            <span className="text-white font-semibold">{getTotalPoints()}</span>
          </div>
          {exam.timeLimit && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-400">Time Limit:</span>
              <span className="text-white font-semibold">{exam.timeLimit} min</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {exam.sections.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No sections yet</h3>
            <p className="text-gray-400 mb-6">Add sections to structure your exam</p>
            <button
              onClick={addSection}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add First Section
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {exam.sections.sort((a, b) => a.order - b.order).map((section, sectionIndex) => (
              <div key={section.id} className="bg-gray-800 rounded-lg overflow-hidden">
                {/* Section Header */}
                <div className="px-4 py-3 bg-gray-700/50 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="text-gray-400 hover:text-white"
                      >
                        {expandedSections.has(section.id) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Section {sectionIndex + 1}:</span>
                        {editingSection === section.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={sectionTitles[section.id]}
                              onChange={(e) => setSectionTitles({
                                ...sectionTitles,
                                [section.id]: e.target.value
                              })}
                              className="px-2 py-1 bg-gray-600 text-white rounded text-sm"
                            />
                            <button
                              onClick={() => saveSectionTitle(section.id)}
                              className="text-green-400 hover:text-green-300"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingSection(null)}
                              className="text-gray-400 hover:text-white"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                            <button
                              onClick={() => setEditingSection(section.id)}
                              className="text-gray-400 hover:text-white"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                      <span className="text-sm text-gray-400">
                        ({section.modules.length} modules, {
                          section.modules.reduce((sum, m) => sum + (m.questions?.length || 0), 0)
                        } questions)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => addModule(section.id)}
                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Add Module
                      </button>
                      <button
                        onClick={() => deleteSection(section.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section Content */}
                {expandedSections.has(section.id) && (
                  <div className="p-4 space-y-3">
                    {section.modules.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <p>No modules in this section</p>
                        <button
                          onClick={() => addModule(section.id)}
                          className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                        >
                          Add first module
                        </button>
                      </div>
                    ) : (
                      section.modules.sort((a, b) => a.order - b.order).map((module, moduleIndex) => (
                        <div key={module.id} className="bg-gray-700/30 rounded-lg p-3">
                          {/* Module Header */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleModule(module.id)}
                                className="text-gray-400 hover:text-white"
                              >
                                {expandedModules.has(module.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                              <span className="text-gray-400 text-sm">
                                Module {moduleIndex + 1}
                              </span>
                              {editingModule === module.id ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={moduleTitles[module.id]}
                                    onChange={(e) => setModuleTitles({
                                      ...moduleTitles,
                                      [module.id]: e.target.value
                                    })}
                                    placeholder="Module title (optional)"
                                    className="px-2 py-1 bg-gray-600 text-white rounded text-sm"
                                  />
                                  <input
                                    type="number"
                                    value={moduleTimeLimits[module.id]}
                                    onChange={(e) => setModuleTimeLimits({
                                      ...moduleTimeLimits,
                                      [module.id]: e.target.value
                                    })}
                                    placeholder="Time (min)"
                                    className="w-20 px-2 py-1 bg-gray-600 text-white rounded text-sm"
                                  />
                                  <button
                                    onClick={() => saveModuleDetails(module.id)}
                                    className="text-green-400 hover:text-green-300"
                                  >
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditingModule(null)}
                                    className="text-gray-400 hover:text-white"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  {module.title && (
                                    <span className="text-white font-medium">{module.title}</span>
                                  )}
                                  {module.timeLimit && (
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {module.timeLimit} min
                                    </span>
                                  )}
                                  <button
                                    onClick={() => setEditingModule(module.id)}
                                    className="text-gray-400 hover:text-white"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                </>
                              )}
                              <span className="text-xs text-gray-400">
                                ({module.questions?.length || 0} questions)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/admin/exams/${examId}/questions?moduleId=${module.id}`}
                                className="text-blue-400 hover:text-blue-300 text-sm"
                              >
                                Add Questions
                              </Link>
                              <button
                                onClick={() => deleteModule(section.id, module.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          {/* Module Questions */}
                          {expandedModules.has(module.id) && (
                            <div className="mt-3 space-y-2">
                              {module.questions?.length === 0 ? (
                                <div className="text-center py-4 text-gray-400 text-sm">
                                  No questions in this module
                                </div>
                              ) : (
                                module.questions?.sort((a, b) => a.order - b.order).map((examQuestion, qIndex) => (
                                  <div key={examQuestion.id} className="bg-gray-800 rounded p-3">
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-start gap-3 flex-1">
                                        <span className="text-gray-400 text-sm mt-1">
                                          {qIndex + 1}.
                                        </span>
                                        <div className="flex-1">
                                          {examQuestion.question.questionCode && (
                                            <span className="inline-block px-2 py-0.5 bg-gray-700 rounded text-xs font-mono text-gray-300 mb-1">
                                              {examQuestion.question.questionCode}
                                            </span>
                                          )}
                                          <KatexRenderer 
                                            content={examQuestion.question.questionText}
                                            className="text-white text-sm"
                                          />
                                          <div className="flex items-center gap-4 mt-2">
                                            <span className="text-xs text-gray-400">
                                              {examQuestion.question.questionType.replace('_', ' ')}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                              {examQuestion.question.points} pts
                                            </span>
                                            {examQuestion.question.difficulty && (
                                              <span className={`text-xs px-2 py-0.5 rounded ${
                                                examQuestion.question.difficulty === 'Easy' 
                                                  ? 'bg-green-900/50 text-green-400'
                                                  : examQuestion.question.difficulty === 'Medium'
                                                  ? 'bg-yellow-900/50 text-yellow-400'
                                                  : 'bg-red-900/50 text-red-400'
                                              }`}>
                                                {examQuestion.question.difficulty}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => removeQuestion(module.id, examQuestion.id)}
                                        className="text-red-400 hover:text-red-300 ml-3"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}