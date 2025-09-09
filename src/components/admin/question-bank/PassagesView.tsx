'use client'

import { useState } from 'react'
import { 
  Plus, Edit2, Trash2, Save, X, Search, FileText
} from 'lucide-react'
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { 
  ssr: false,
  loading: () => <div className="h-48 bg-gray-900 border border-gray-700 rounded-lg animate-pulse" />
})

interface Passage {
  id: string
  title: string
  content: string
  program: string
  _count?: { questions: number }
}

interface PassagesViewProps {
  passages: Passage[]
  loadingPassages: boolean
  passageSearch: string
  setPassageSearch: (search: string) => void
  passageProgram: string
  setPassageProgram: (program: string) => void
  showPassageForm: boolean
  setShowPassageForm: (show: boolean) => void
  editingPassage: Passage | null
  setEditingPassage: (passage: Passage | null) => void
  fetchPassages: () => void
}

export default function PassagesView({
  passages,
  loadingPassages,
  passageSearch,
  setPassageSearch,
  passageProgram,
  setPassageProgram,
  showPassageForm,
  setShowPassageForm,
  editingPassage,
  setEditingPassage,
  fetchPassages
}: PassagesViewProps) {
  const [passageFormData, setPassageFormData] = useState({
    title: '',
    content: '',
    program: 'SAT'
  })
  const [deletingPassageId, setDeletingPassageId] = useState<string | null>(null)

  const handleSavePassage = async () => {
    try {
      const url = editingPassage 
        ? `/api/admin/passages/${editingPassage.id}`
        : '/api/admin/passages'
      
      const response = await fetch(url, {
        method: editingPassage ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passageFormData),
      })

      if (response.ok) {
        fetchPassages()
        setShowPassageForm(false)
        resetPassageForm()
      }
    } catch (error) {
      console.error('Error saving passage:', error)
    }
  }

  const handleDeletePassage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this passage?')) return
    
    setDeletingPassageId(id)
    try {
      const response = await fetch(`/api/admin/passages/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchPassages()
      }
    } catch (error) {
      console.error('Error deleting passage:', error)
    } finally {
      setDeletingPassageId(null)
    }
  }

  const resetPassageForm = () => {
    setPassageFormData({
      title: '',
      content: '',
      program: 'SAT'
    })
    setEditingPassage(null)
  }

  return (
    <>
      {/* Passages Filters */}
      <div className="mb-6 bg-gray-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4">Filter Passages</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search passages..."
              value={passageSearch}
              onChange={(e) => setPassageSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <select
            value={passageProgram}
            onChange={(e) => setPassageProgram(e.target.value)}
            className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="">All Programs</option>
            <option value="SAT">SAT</option>
            <option value="ACT">ACT</option>
            <option value="AP">AP</option>
          </select>
        </div>
      </div>

      {/* Passages Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">
          Passages ({passages.length})
        </h2>
        <button
          onClick={() => setShowPassageForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Passage
        </button>
      </div>

      {/* Passages List */}
      {loadingPassages ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {passages.map((passage) => (
            <div key={passage.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-white">{passage.title}</h3>
                    <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">
                      {passage.program}
                    </span>
                    {passage._count?.questions && passage._count.questions > 0 && (
                      <span className="text-xs bg-purple-900 text-purple-300 px-2 py-1 rounded">
                        {passage._count.questions} question(s)
                      </span>
                    )}
                  </div>
                  <div 
                    className="text-gray-400 text-sm line-clamp-2"
                    dangerouslySetInnerHTML={{ 
                      __html: passage.content.substring(0, 200) + 
                              (passage.content.length > 200 ? '...' : '') 
                    }}
                  />
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => {
                      setEditingPassage(passage)
                      setPassageFormData({
                        title: passage.title,
                        content: passage.content,
                        program: passage.program
                      })
                      setShowPassageForm(true)
                    }}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePassage(passage.id)}
                    disabled={deletingPassageId === passage.id || (passage._count?.questions || 0) > 0}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={passage._count?.questions ? 'Cannot delete passage with linked questions' : 'Delete passage'}
                  >
                    {deletingPassageId === passage.id ? (
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

      {/* Passage Form Modal */}
      {showPassageForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingPassage ? 'Edit Passage' : 'Add New Passage'}
              </h2>
              <button
                onClick={() => {
                  setShowPassageForm(false)
                  resetPassageForm()
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={passageFormData.title}
                    onChange={(e) => setPassageFormData({ ...passageFormData, title: e.target.value })}
                    placeholder="Enter passage title..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Program
                  </label>
                  <select
                    value={passageFormData.program}
                    onChange={(e) => setPassageFormData({ ...passageFormData, program: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="SAT">SAT</option>
                    <option value="ACT">ACT</option>
                    <option value="AP">AP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Content
                </label>
                <RichTextEditor
                  value={passageFormData.content}
                  onChange={(value) => setPassageFormData({ ...passageFormData, content: value })}
                  placeholder="Enter passage content..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowPassageForm(false)
                    resetPassageForm()
                  }}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePassage}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingPassage ? 'Update' : 'Save'} Passage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}