'use client'

import { useState } from 'react'
import { 
  Plus, Edit2, Trash2, Save, X, Search, 
  FileText, Filter, Eye, Copy, AlertCircle
} from 'lucide-react'
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { 
  ssr: false,
  loading: () => <div className="h-48 bg-gray-900 border border-gray-700 rounded-lg animate-pulse" />
})

const QuestionPreview = dynamic(() => import('@/components/admin/QuestionPreview'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-900 border border-gray-700 rounded-lg animate-pulse" />
})

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

interface QuestionsViewProps {
  questions: Question[]
  totalQuestions: number
  loadingQuestions: boolean
  searchQuery: string
  setSearchQuery: (query: string) => void
  filterSubject: string
  setFilterSubject: (subject: string) => void
  filterDifficulty: string
  setFilterDifficulty: (difficulty: string) => void
  filterProgram: string
  setFilterProgram: (program: string) => void
  filterSkill: string
  setFilterSkill: (skill: string) => void
  showInternalOnly: boolean
  setShowInternalOnly: (show: boolean) => void
  selectedForDelete: string[]
  setSelectedForDelete: (ids: string[]) => void
  showQuestionForm: boolean
  setShowQuestionForm: (show: boolean) => void
  editingQuestion: Question | null
  setEditingQuestion: (question: Question | null) => void
  showQuestionPreview: boolean
  setShowQuestionPreview: (show: boolean) => void
  passages: Passage[]
  currentPage: number
  totalPages: number
  setCurrentPage: (page: number) => void
  fetchQuestions: () => void
  fetchPassages: () => void
}

export default function QuestionsView({
  questions,
  totalQuestions,
  loadingQuestions,
  searchQuery,
  setSearchQuery,
  filterSubject,
  setFilterSubject,
  filterDifficulty,
  setFilterDifficulty,
  filterProgram,
  setFilterProgram,
  filterSkill,
  setFilterSkill,
  showInternalOnly,
  setShowInternalOnly,
  selectedForDelete,
  setSelectedForDelete,
  showQuestionForm,
  setShowQuestionForm,
  editingQuestion,
  setEditingQuestion,
  showQuestionPreview,
  setShowQuestionPreview,
  passages,
  currentPage,
  totalPages,
  setCurrentPage,
  fetchQuestions,
  fetchPassages
}: QuestionsViewProps) {
  const [formData, setFormData] = useState({
    program: 'SAT',
    subject: 'Math',
    topic: '',
    difficulty: 'MEDIUM',
    questionText: '',
    questionType: 'MULTIPLE_CHOICE',
    points: 1,
    explanation: '',
    passageId: '',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ]
  })

  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSaveQuestion = async () => {
    try {
      const url = editingQuestion 
        ? `/api/admin/question-bank/${editingQuestion.id}`
        : '/api/admin/question-bank'
      
      const response = await fetch(url, {
        method: editingQuestion ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchQuestions()
        setShowQuestionForm(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error saving question:', error)
    }
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return
    
    setDeletingId(id)
    try {
      const response = await fetch(`/api/admin/question-bank/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchQuestions()
      }
    } catch (error) {
      console.error('Error deleting question:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedForDelete.length === 0) return
    
    try {
      const response = await fetch('/api/admin/questions/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds: selectedForDelete })
      })
      
      if (response.ok) {
        fetchQuestions()
        setSelectedForDelete([])
        setShowDeleteConfirm(false)
      }
    } catch (error) {
      console.error('Error deleting questions:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      program: 'SAT',
      subject: 'Math',
      topic: '',
      difficulty: 'MEDIUM',
      questionText: '',
      questionType: 'MULTIPLE_CHOICE',
      points: 1,
      explanation: '',
      passageId: '',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ]
    })
    setEditingQuestion(null)
  }

  const internalQuestions = questions.filter(q => 
    q.metadata?.status === 'INTERNAL_DRAFT' || 
    q.metadata?.tags?.includes('internal')
  )

  const displayQuestions = showInternalOnly ? internalQuestions : questions

  return (
    <>
      {/* Questions Filters */}
      <div className="mb-6 bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Filter Questions</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded">
              {internalQuestions.length} internal
            </span>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showInternalOnly}
                onChange={(e) => setShowInternalOnly(e.target.checked)}
                className="rounded border-gray-600 bg-gray-700 text-red-600"
              />
              <span className="text-gray-300">Internal Only</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <select
            value={filterProgram}
            onChange={(e) => setFilterProgram(e.target.value)}
            className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="">All Programs</option>
            <option value="SAT">SAT</option>
            <option value="ACT">ACT</option>
            <option value="AP">AP</option>
          </select>

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="">All Subjects</option>
            <option value="Math">Math</option>
            <option value="Reading">Reading</option>
            <option value="Writing">Writing</option>
          </select>

          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          <select
            value={filterSkill}
            onChange={(e) => setFilterSkill(e.target.value)}
            className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="">All Skills</option>
            <option value="Linear equations in one variable">Linear equations in one variable</option>
            <option value="Linear equations in two variables">Linear equations in two variables</option>
            <option value="Linear functions">Linear functions</option>
            <option value="Systems of two linear equations in two variables">Systems of two linear equations in two variables</option>
            <option value="Linear inequalities in one or two variables">Linear inequalities in one or two variables</option>
            <option value="Equivalent expressions">Equivalent expressions</option>
            <option value="Nonlinear equations in one variable and systems of equations in two variables">Nonlinear equations in one variable and systems of equations in two variables</option>
            <option value="Nonlinear functions">Nonlinear functions</option>
            <option value="Ratios, rates, proportional relationships, and units">Ratios, rates, proportional relationships, and units</option>
            <option value="Percentages">Percentages</option>
            <option value="One-variable data: distributions and measures of center and spread">One-variable data: distributions and measures of center and spread</option>
            <option value="Two-variable data: models and scatterplots">Two-variable data: models and scatterplots</option>
            <option value="Probability and conditional probability">Probability and conditional probability</option>
            <option value="Inference from sample statistics and margin of error">Inference from sample statistics and margin of error</option>
            <option value="Evaluating statistical claims: observational studies and experiments">Evaluating statistical claims: observational studies and experiments</option>
            <option value="Area and volume">Area and volume</option>
            <option value="Lines, angles, and triangles">Lines, angles, and triangles</option>
            <option value="Right triangles and trigonometry">Right triangles and trigonometry</option>
            <option value="Circles">Circles</option>
          </select>
        </div>

        {/* Bulk Delete UI */}
        {showInternalOnly && selectedForDelete.length > 0 && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-400">
                {selectedForDelete.length} questions selected for deletion
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedForDelete([])}
                  className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete Selected
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Bulk Delete</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete {selectedForDelete.length} internal questions? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete {selectedForDelete.length} Questions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">
          Questions ({totalQuestions})
        </h2>
        <button
          onClick={() => setShowQuestionForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Question
        </button>
      </div>

      {/* Questions List */}
      {loadingQuestions ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {displayQuestions.map((question) => (
            <div key={question.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {showInternalOnly && (
                      <input
                        type="checkbox"
                        checked={selectedForDelete.includes(question.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedForDelete([...selectedForDelete, question.id])
                          } else {
                            setSelectedForDelete(selectedForDelete.filter(id => id !== question.id))
                          }
                        }}
                        className="rounded border-gray-600 bg-gray-700 text-red-600"
                      />
                    )}
                    {question.questionCode && (
                      <span className="text-xs font-mono bg-gray-700 text-gray-300 px-2 py-1 rounded">
                        {question.questionCode}
                      </span>
                    )}
                    <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">
                      {question.program}
                    </span>
                    <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded">
                      {question.subject}
                    </span>
                    {question.difficulty && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        question.difficulty === 'EASY' ? 'bg-green-900 text-green-300' :
                        question.difficulty === 'MEDIUM' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-red-900 text-red-300'
                      }`}>
                        {question.difficulty}
                      </span>
                    )}
                    {question.metadata?.status === 'INTERNAL_DRAFT' && (
                      <span className="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-1 rounded flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Internal
                      </span>
                    )}
                    {question._count?.examQuestions && question._count.examQuestions > 0 && (
                      <span className="text-xs bg-purple-900 text-purple-300 px-2 py-1 rounded">
                        Used in {question._count.examQuestions} exam(s)
                      </span>
                    )}
                  </div>
                  <div 
                    className="text-gray-300 mb-2"
                    dangerouslySetInnerHTML={{ 
                      __html: question.questionText.substring(0, 200) + 
                              (question.questionText.length > 200 ? '...' : '') 
                    }}
                  />
                  {question.topic && (
                    <p className="text-xs text-gray-500">Topic: {question.topic}</p>
                  )}
                  {question.passage && (
                    <p className="text-xs text-blue-400 mt-1">
                      <FileText className="inline h-3 w-3 mr-1" />
                      Linked to passage: {question.passage.title}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => {
                      setPreviewQuestion(question)
                      setShowQuestionPreview(true)
                    }}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingQuestion(question)
                      setFormData({
                        program: question.program,
                        subject: question.subject,
                        topic: question.topic || '',
                        difficulty: question.difficulty || 'MEDIUM',
                        questionText: question.questionText,
                        questionType: question.questionType,
                        points: question.points,
                        explanation: question.explanation || '',
                        passageId: question.passageId || '',
                        options: question.options || []
                      })
                      setShowQuestionForm(true)
                    }}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    disabled={deletingId === question.id}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingId === question.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg ${
                    currentPage === page
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
          
          <span className="text-gray-400 ml-4">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}

      {/* Question Form Modal */}
      {showQuestionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </h2>
              <button
                onClick={() => {
                  setShowQuestionForm(false)
                  resetForm()
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Form fields */}
              <div className="grid grid-cols-3 gap-4">
                <select
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300"
                >
                  <option value="SAT">SAT</option>
                  <option value="ACT">ACT</option>
                  <option value="AP">AP</option>
                </select>

                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300"
                >
                  <option value="Math">Math</option>
                  <option value="Reading">Reading</option>
                  <option value="Writing">Writing</option>
                </select>

                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Question Text
                </label>
                <RichTextEditor
                  value={formData.questionText}
                  onChange={(value) => setFormData({ ...formData, questionText: value })}
                  placeholder="Enter question text..."
                />
              </div>

              {formData.questionType === 'MULTIPLE_CHOICE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Answer Options
                  </label>
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={option.isCorrect}
                        onChange={(e) => {
                          const newOptions = [...formData.options]
                          newOptions[index].isCorrect = e.target.checked
                          setFormData({ ...formData, options: newOptions })
                        }}
                        className="mt-3 rounded border-gray-600 bg-gray-700 text-red-600"
                      />
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => {
                          const newOptions = [...formData.options]
                          newOptions[index].text = e.target.value
                          setFormData({ ...formData, options: newOptions })
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowQuestionForm(false)
                    resetForm()
                  }}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveQuestion}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingQuestion ? 'Update' : 'Save'} Question
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Preview Modal */}
      {showQuestionPreview && previewQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Question Preview</h2>
              <button
                onClick={() => {
                  setShowQuestionPreview(false)
                  setPreviewQuestion(null)
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <QuestionPreview 
              questionText={previewQuestion.questionText}
              questionType={previewQuestion.questionType}
              options={previewQuestion.options}
              explanation={previewQuestion.explanation}
              program={previewQuestion.program}
              subject={previewQuestion.subject}
              topic={previewQuestion.topic}
              difficulty={previewQuestion.difficulty}
              points={previewQuestion.points}
            />
          </div>
        </div>
      )}
    </>
  )
}