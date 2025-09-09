'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Save, Plus, X } from 'lucide-react'
import Link from 'next/link'

const programs = [
  { value: 'SAT', label: 'SAT' },
  { value: 'ACT', label: 'ACT' },
  { value: 'ISEE', label: 'ISEE' },
  { value: 'SSAT', label: 'SSAT' },
  { value: 'HSPT', label: 'HSPT' }
]

const examTypes = [
  { value: 'PRACTICE_TEST', label: 'Practice Test' },
  { value: 'HOMEWORK', label: 'Homework' },
  { value: 'QUIZ', label: 'Quiz' },
  { value: 'DIAGNOSTIC', label: 'Diagnostic' },
  { value: 'CUSTOM', label: 'Custom' }
]

const subProgramOptions: Record<string, string[]> = {
  ISEE: ['Lower', 'Middle', 'Upper'],
  SSAT: ['Elementary', 'Middle', 'Upper']
}

export default function NewExamPage() {
  const router = useRouter()
  const { data: session } = useSession()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [program, setProgram] = useState('SAT')
  const [examType, setExamType] = useState('PRACTICE_TEST')
  const [subProgram, setSubProgram] = useState('')
  const [examNumber, setExamNumber] = useState('')
  const [timeLimit, setTimeLimit] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title || !program || !examType) {
      alert('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          program,
          examType,
          subProgram: subProgram || undefined,
          examNumber: examNumber ? parseInt(examNumber) : undefined,
          timeLimit: timeLimit ? parseInt(timeLimit) : undefined,
          tags
        })
      })

      if (response.ok) {
        const exam = await response.json()
        router.push(`/admin/exams/${exam.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create exam')
      }
    } catch (error) {
      console.error('Failed to create exam:', error)
      alert('Failed to create exam')
    } finally {
      setSaving(false)
    }
  }

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const generateTitle = () => {
    const typeLabel = examTypes.find(t => t.value === examType)?.label || ''
    const number = examNumber ? ` ${examNumber}` : ''
    const sub = subProgram ? ` ${subProgram}` : ''
    return `${program}${sub} ${typeLabel}${number}`
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
                <h1 className="text-2xl font-bold text-white">Create New Exam</h1>
                <p className="text-gray-400 text-sm mt-1">Set up the basic exam structure</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !title}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Creating...' : 'Create Exam'}
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Exam Title *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., SAT Practice Test 1"
                    className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={() => setTitle(generateTitle())}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                  >
                    Auto Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description of the exam..."
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Exam Configuration */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Exam Configuration</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Program *
                </label>
                <select
                  value={program}
                  onChange={(e) => {
                    setProgram(e.target.value)
                    setSubProgram('')
                  }}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                >
                  {programs.map(prog => (
                    <option key={prog.value} value={prog.value}>{prog.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Exam Type *
                </label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                >
                  {examTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {subProgramOptions[program] && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Level
                  </label>
                  <select
                    value={subProgram}
                    onChange={(e) => setSubProgram(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="">Select level...</option>
                    {subProgramOptions[program].map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Exam Number
                </label>
                <input
                  type="number"
                  value={examNumber}
                  onChange={(e) => setExamNumber(e.target.value)}
                  placeholder="e.g., 1, 2, 3..."
                  min="1"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  placeholder="e.g., 180"
                  min="1"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Tags</h2>
            <p className="text-sm text-gray-400 mb-4">Add tags to help categorize and search for this exam</p>
            
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                placeholder="Type a tag and press Enter..."
                className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
              />
              <button
                onClick={addTag}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300 flex items-center gap-2"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Tips */}
          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
            <h3 className="text-blue-400 font-medium mb-2">Quick Tips</h3>
            <ul className="text-sm text-blue-300 space-y-1">
              <li>• After creating the exam, you'll be able to add sections and questions</li>
              <li>• Practice tests typically have multiple sections (e.g., Reading, Math)</li>
              <li>• Homework and quizzes usually have a single section</li>
              <li>• You can reuse questions from the question bank</li>
              <li>• Tags help organize exams when you have hundreds of them</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}