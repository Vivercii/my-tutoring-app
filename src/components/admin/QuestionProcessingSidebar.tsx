'use client'

import { useState, useEffect } from 'react'
import { 
  X, ChevronRight, ChevronLeft, Sparkles, Check, AlertCircle, 
  RefreshCw, Save, Copy, Edit2, Brain, BookOpen, Target,
  Zap, ChevronDown, ChevronUp, Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { 
  ssr: false,
  loading: () => <div className="h-32 bg-gray-900 border border-gray-700 rounded-lg animate-pulse" />
})

const QuestionPreview = dynamic(() => import('@/components/admin/QuestionPreview'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-900 border border-gray-700 rounded-lg animate-pulse" />
})

interface ParsedQuestion {
  id?: string
  questionText: string
  questionType: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER'
  options?: Array<{
    letter: string
    text: string
    isCorrect: boolean
  }>
  correctAnswer?: string
  explanation?: string
  program?: string
  subject?: string
  difficulty?: string
}

interface Classification {
  domainCode: string
  domainName: string
  skillName: string
  meanImportance: number
  confidence: number
  reasoning: string
}

interface QuestionProcessingSidebarProps {
  questions: ParsedQuestion[]
  onClose: () => void
  onQuestionsUpdated?: (questions: ParsedQuestion[]) => void
  onSaveQuestion?: (question: any) => void
  onBulkSave?: (questions: any[]) => void
}

export default function QuestionProcessingSidebar({
  questions,
  onClose,
  onQuestionsUpdated,
  onSaveQuestion,
  onBulkSave
}: QuestionProcessingSidebarProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [classification, setClassification] = useState<Classification | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [similarQuestions, setSimilarQuestions] = useState<ParsedQuestion[]>([])
  const [expandedSections, setExpandedSections] = useState({
    classification: true,
    variations: false,
    review: false
  })
  const [processedQuestions, setProcessedQuestions] = useState<Set<number>>(new Set())
  const [batchMode, setBatchMode] = useState(false)
  const [classificationHistory, setClassificationHistory] = useState<Map<number, Classification>>(new Map())

  const currentQuestion = questions[currentIndex]

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const classifyQuestion = async () => {
    if (!currentQuestion) return
    
    setProcessing(true)
    try {
      const response = await fetch('/api/admin/questions/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: currentQuestion.questionText,
          questionType: currentQuestion.questionType,
          correctAnswer: currentQuestion.correctAnswer
        })
      })

      if (response.ok) {
        const data = await response.json()
        setClassification(data.classification)
        setClassificationHistory(prev => new Map(prev).set(currentIndex, data.classification))
      }
    } catch (error) {
      console.error('Failed to classify question:', error)
    } finally {
      setProcessing(false)
    }
  }

  const generateSimilarQuestions = async () => {
    if (!currentQuestion) return
    
    setProcessing(true)
    try {
      const response = await fetch('/api/admin/questions/variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: currentQuestion.questionText,
          questionType: currentQuestion.questionType,
          options: currentQuestion.options?.map(opt => `${opt.letter}) ${opt.text}`),
          correctAnswer: currentQuestion.correctAnswer || currentQuestion.options?.find(o => o.isCorrect)?.letter,
          count: 3
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.variations) {
          const formattedVariations = data.variations.map((v: any, idx: number) => ({
            id: `var-${Date.now()}-${idx}`,
            questionText: v.questionText,
            questionType: currentQuestion.questionType,
            options: v.options?.map((opt: string, i: number) => ({
              letter: String.fromCharCode(65 + i),
              text: opt.replace(/^[A-D]\)\s*/, ''),
              isCorrect: opt.startsWith(v.correctAnswer?.charAt(0))
            })),
            correctAnswer: v.correctAnswer,
            explanation: v.explanation,
            program: currentQuestion.program,
            subject: currentQuestion.subject,
            difficulty: currentQuestion.difficulty
          }))
          setSimilarQuestions(formattedVariations)
          setExpandedSections(prev => ({ ...prev, variations: true }))
        }
      }
    } catch (error) {
      console.error('Failed to generate similar questions:', error)
    } finally {
      setProcessing(false)
    }
  }

  const saveQuestion = async () => {
    if (!currentQuestion || !classification) return
    
    setProcessing(true)
    try {
      const response = await fetch('/api/admin/questions/save-classified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: currentQuestion.questionText,
          questionType: currentQuestion.questionType,
          options: currentQuestion.options?.map(opt => ({
            text: opt.text,
            isCorrect: opt.isCorrect
          })),
          correctAnswer: currentQuestion.correctAnswer || currentQuestion.options?.find(o => o.isCorrect)?.letter,
          explanation: currentQuestion.explanation || '',
          program: currentQuestion.program || 'SAT',
          subject: currentQuestion.subject || 'Math',
          difficulty: currentQuestion.difficulty || 'MEDIUM',
          domainCode: classification.domainCode,
          skillName: classification.skillName,
          meanImportance: classification.meanImportance,
          topic: classification.skillName
        })
      })

      if (response.ok) {
        setProcessedQuestions(prev => new Set(prev).add(currentIndex))
        
        // Optional: Call parent callback if provided
        if (onSaveQuestion) {
          await onSaveQuestion({
            ...currentQuestion,
            domainCode: classification.domainCode,
            skillName: classification.skillName,
            meanImportance: classification.meanImportance
          })
        }
        
        // Move to next question
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(currentIndex + 1)
          setClassification(classificationHistory.get(currentIndex + 1) || null)
          setSimilarQuestions([])
        }
      } else {
        console.error('Failed to save question')
      }
    } catch (error) {
      console.error('Error saving question:', error)
    } finally {
      setProcessing(false)
    }
  }

  const processBatch = async () => {
    setBatchMode(true)
    setProcessing(true)
    
    try {
      // Classify all unprocessed questions
      const unprocessedQuestions = questions
        .filter((_, index) => !processedQuestions.has(index))
        .map(q => ({
          questionText: q.questionText,
          questionType: q.questionType,
          correctAnswer: q.correctAnswer
        }))

      const response = await fetch('/api/admin/questions/classify', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: unprocessedQuestions })
      })

      if (response.ok) {
        const data = await response.json()
        // Process results and save questions
        if (onBulkSave) {
          onBulkSave(data.results)
        }
      }
    } catch (error) {
      console.error('Batch processing failed:', error)
    } finally {
      setProcessing(false)
      setBatchMode(false)
    }
  }

  useEffect(() => {
    // Auto-classify when question changes
    if (currentQuestion && !classificationHistory.has(currentIndex)) {
      classifyQuestion()
    }
  }, [currentIndex])

  if (questions.length === 0) return null

  return (
    <div className="h-full bg-gray-900 border-l border-gray-700 shadow-2xl overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Question Processor</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Progress indicator */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-green-400">
                {processedQuestions.size} processed
              </span>
            </div>
            <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Question Preview */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400">Current Question</CardTitle>
            </CardHeader>
            <CardContent>
              {currentQuestion && (
                <QuestionPreview
                  questionText={currentQuestion.questionText}
                  questionType={currentQuestion.questionType}
                  options={currentQuestion.options?.map(opt => ({
                    text: opt.text,
                    isCorrect: opt.isCorrect
                  }))}
                  correctAnswer={currentQuestion.correctAnswer || currentQuestion.options?.find(o => o.isCorrect)?.letter}
                  explanation={currentQuestion.explanation}
                  program={currentQuestion.program || 'SAT'}
                  subject={currentQuestion.subject || 'Math'}
                  topic=""
                  difficulty={currentQuestion.difficulty || 'MEDIUM'}
                  points={1}
                />
              )}
            </CardContent>
          </Card>

          {/* AI Classification Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="pb-3 cursor-pointer"
              onClick={() => toggleSection('classification')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                  AI Classification
                </CardTitle>
                {expandedSections.classification ? <ChevronUp /> : <ChevronDown />}
              </div>
            </CardHeader>
            
            {expandedSections.classification && (
              <CardContent>
                {processing && !classification ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                  </div>
                ) : classification ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-400">Domain</label>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge className="bg-blue-600 text-white">
                            {classification.domainCode}
                          </Badge>
                          <span className="text-sm text-white">{classification.domainName}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Confidence</label>
                        <div className="mt-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  classification.confidence > 0.8 
                                    ? 'bg-green-500' 
                                    : classification.confidence > 0.6 
                                    ? 'bg-yellow-500' 
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${classification.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-white">
                              {Math.round(classification.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400">Skill</label>
                      <div className="mt-1">
                        {editMode ? (
                          <input 
                            type="text"
                            value={classification.skillName}
                            onChange={(e) => setClassification({
                              ...classification,
                              skillName: e.target.value
                            })}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                          />
                        ) : (
                          <p className="text-sm text-white">{classification.skillName}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400">Mean Importance</label>
                      <div className="mt-1 flex items-center gap-2">
                        <Target className={`h-4 w-4 ${
                          classification.meanImportance >= 3.5 ? 'text-red-500' :
                          classification.meanImportance >= 3.0 ? 'text-orange-500' :
                          classification.meanImportance >= 2.5 ? 'text-yellow-500' :
                          'text-gray-500'
                        }`} />
                        <span className="text-sm text-white font-semibold">
                          {classification.meanImportance.toFixed(2)} / 4.00
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400">AI Reasoning</label>
                      <div className="mt-1 p-3 bg-gray-900 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-300">{classification.reasoning}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditMode(!editMode)}
                        className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center justify-center gap-2 text-sm"
                      >
                        <Edit2 className="h-4 w-4" />
                        {editMode ? 'Save Edits' : 'Override'}
                      </button>
                      <button
                        onClick={classifyQuestion}
                        className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center gap-2 text-sm"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Re-classify
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={classifyQuestion}
                    className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center gap-2"
                  >
                    <Brain className="h-5 w-5" />
                    Classify Question
                  </button>
                )}
              </CardContent>
            )}
          </Card>

          {/* Generate Variations Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="pb-3 cursor-pointer"
              onClick={() => toggleSection('variations')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  AI Variations ({similarQuestions.length})
                </CardTitle>
                {expandedSections.variations ? <ChevronUp /> : <ChevronDown />}
              </div>
            </CardHeader>
            
            {expandedSections.variations && (
              <CardContent>
                <button
                  onClick={generateSimilarQuestions}
                  disabled={processing}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg flex items-center justify-center gap-2 mb-3"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Generate Similar Question
                </button>
                
                {similarQuestions.length > 0 && (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {similarQuestions.map((q, idx) => (
                      <div key={q.id || idx} className="border border-gray-700 rounded-lg overflow-hidden">
                        <div className="bg-gray-800 px-3 py-2 flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            Variation {idx + 1}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                // Copy this variation to replace current question
                                const newQuestions = [...questions]
                                newQuestions[currentIndex] = q
                                onQuestionsUpdated?.(newQuestions)
                                setSimilarQuestions([])
                              }}
                              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                              <Copy className="h-3 w-3" />
                              Use This
                            </button>
                            <button
                              onClick={() => {
                                onSaveQuestion?.({
                                  ...q,
                                  domainCode: classification?.domainCode,
                                  skillName: classification?.skillName
                                })
                              }}
                              className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
                            >
                              <Save className="h-3 w-3" />
                              Save
                            </button>
                          </div>
                        </div>
                        <div className="p-3">
                          <QuestionPreview
                            questionText={q.questionText}
                            questionType={q.questionType}
                            options={q.options?.map(opt => ({
                              text: opt.text,
                              isCorrect: opt.isCorrect
                            }))}
                            correctAnswer={q.correctAnswer}
                            explanation={q.explanation}
                            program={q.program || 'SAT'}
                            subject={q.subject || 'Math'}
                            topic=""
                            difficulty={q.difficulty || 'MEDIUM'}
                            points={1}
                            showMetadata={false}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-700 bg-gray-800 space-y-3">
          {/* Save Current Question */}
          {classification && !processedQuestions.has(currentIndex) && (
            <button
              onClick={saveQuestion}
              disabled={processing}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-lg flex items-center justify-center gap-2"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Current Question to Bank
                </>
              )}
            </button>
          )}
          
          {/* Save All Processed */}
          {processedQuestions.size > 0 && (
            <button
              onClick={async () => {
                setProcessing(true)
                try {
                  const questionsToSave = Array.from(processedQuestions).map(idx => ({
                    ...questions[idx],
                    ...(classificationHistory.get(idx) && {
                      domainCode: classificationHistory.get(idx)!.domainCode,
                      skillName: classificationHistory.get(idx)!.skillName,
                      meanImportance: classificationHistory.get(idx)!.meanImportance
                    })
                  }))
                  
                  const response = await fetch('/api/admin/questions/save-classified', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ questions: questionsToSave })
                  })
                  
                  if (response.ok) {
                    console.log('All questions saved successfully!')
                    onClose()
                  }
                } catch (error) {
                  console.error('Failed to save all questions:', error)
                } finally {
                  setProcessing(false)
                }
              }}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Save All {processedQuestions.size} Questions to Bank
            </button>
          )}
          
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            
            <button
              onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
              disabled={currentIndex >= questions.length - 1}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Save Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={saveQuestion}
              disabled={!classification || processedQuestions.has(currentIndex)}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg flex items-center justify-center gap-2"
            >
              {processedQuestions.has(currentIndex) ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save & Continue
                </>
              )}
            </button>
            
            <button
              onClick={processBatch}
              disabled={processing || processedQuestions.size === questions.length}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg flex items-center justify-center gap-2"
            >
              {batchMode ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Process All ({questions.length - processedQuestions.size})
            </button>
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-900 rounded-lg py-2">
              <p className="text-xs text-gray-400">Processed</p>
              <p className="text-lg font-bold text-green-400">{processedQuestions.size}</p>
            </div>
            <div className="bg-gray-900 rounded-lg py-2">
              <p className="text-xs text-gray-400">Variations</p>
              <p className="text-lg font-bold text-blue-400">{similarQuestions.length}</p>
            </div>
            <div className="bg-gray-900 rounded-lg py-2">
              <p className="text-xs text-gray-400">Remaining</p>
              <p className="text-lg font-bold text-yellow-400">{questions.length - processedQuestions.size}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}