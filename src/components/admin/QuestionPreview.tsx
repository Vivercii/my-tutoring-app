'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { Eye, Check, X, AlertCircle } from 'lucide-react'

const KatexRenderer = dynamic(() => import('@/components/KatexRenderer'), { 
  ssr: false,
  loading: () => <div className="animate-pulse h-6 bg-gray-700 rounded w-3/4" />
})

interface AnswerOption {
  text: string
  isCorrect: boolean
}

interface QuestionPreviewProps {
  questionText: string
  questionType: string
  options?: AnswerOption[]
  correctAnswer?: string
  explanation?: string
  program?: string
  subject?: string
  topic?: string
  difficulty?: string
  points?: number
  onClose?: () => void
  showMetadata?: boolean
}

export default function QuestionPreview({
  questionText,
  questionType,
  options = [],
  correctAnswer,
  explanation,
  program,
  subject,
  topic,
  difficulty,
  points = 1,
  onClose,
  showMetadata = true
}: QuestionPreviewProps) {
  const getDifficultyColor = (diff?: string) => {
    switch (diff?.toUpperCase()) {
      case 'EASY': return 'bg-green-900/50 text-green-400'
      case 'MEDIUM': return 'bg-yellow-900/50 text-yellow-400'
      case 'HARD': return 'bg-red-900/50 text-red-400'
      default: return 'bg-gray-700 text-gray-400'
    }
  }

  const getQuestionTypeLabel = (type?: string) => {
    if (!type) return 'Unknown'
    switch (type) {
      case 'MULTIPLE_CHOICE': return 'Multiple Choice'
      case 'SHORT_ANSWER': return 'Short Answer'
      case 'FREE_RESPONSE': return 'Free Response'
      case 'ESSAY': return 'Essay'
      default: return type
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-700/50 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-3">
          <Eye className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Question Preview</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Metadata */}
        {showMetadata && (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {program && (
              <span className="px-2 py-1 bg-gray-700 rounded text-gray-300">
                {program}
              </span>
            )}
            {subject && (
              <span className="px-2 py-1 bg-gray-700 rounded text-gray-300">
                {subject}
              </span>
            )}
            {topic && (
              <span className="px-2 py-1 bg-gray-700 rounded text-gray-300">
                {topic}
              </span>
            )}
            {difficulty && (
              <span className={`px-2 py-1 rounded ${getDifficultyColor(difficulty)}`}>
                {difficulty}
              </span>
            )}
            <span className="px-2 py-1 bg-blue-900/50 text-blue-400 rounded">
              {getQuestionTypeLabel(questionType)}
            </span>
            <span className="text-gray-400">
              {points} {points === 1 ? 'point' : 'points'}
            </span>
          </div>
        )}

        {/* Question Text */}
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
            Question
          </label>
          <div className="text-white prose prose-invert max-w-none">
            <KatexRenderer content={questionText} />
          </div>
        </div>

        {/* Options for Multiple Choice */}
        {questionType === 'MULTIPLE_CHOICE' && options.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 block">
              Answer Options
            </label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                    option.isCorrect 
                      ? 'bg-green-900/30 border border-green-700' 
                      : 'bg-gray-800 border border-gray-700'
                  }`}
                >
                  <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                    option.isCorrect 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <div className="flex-1">
                    <div className="text-white prose prose-invert max-w-none">
                      <KatexRenderer content={option.text} />
                    </div>
                    {option.isCorrect && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
                        <Check className="h-3 w-3" />
                        Correct Answer
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Answer Area for Other Types */}
        {questionType !== 'MULTIPLE_CHOICE' && (
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
              Answer Type
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">
                  Students will provide a {getQuestionTypeLabel(questionType).toLowerCase()} response
                </span>
              </div>
              {questionType === 'SHORT_ANSWER' && correctAnswer && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <label className="text-xs font-medium text-green-400 uppercase tracking-wider mb-2 block">
                    Correct Answer
                  </label>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-white prose prose-invert max-w-none">
                      <KatexRenderer content={correctAnswer} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Explanation */}
        {explanation && (
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
              Explanation (shown after answer)
            </label>
            <div className="text-gray-300 prose prose-invert max-w-none">
              <KatexRenderer content={explanation} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}