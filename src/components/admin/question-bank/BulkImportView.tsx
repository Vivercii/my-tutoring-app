'use client'

import { useState, useRef } from 'react'
import { 
  Upload, FileSpreadsheet, ChevronRight, CheckCircle, 
  Sparkles, BookOpen, FileUp
} from 'lucide-react'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import dynamic from 'next/dynamic'
import { 
  parseRobustImportData, 
  convertToQuestionBankFormat,
  type ParsedQuestion,
  type BulkImportResult
} from '@/lib/utils/robust-import-parser'

const QuestionProcessingSidebar = dynamic(() => import('@/components/admin/QuestionProcessingSidebar'), {
  ssr: false,
  loading: () => <div className="h-full bg-gray-900 border-l border-gray-700 animate-pulse" />
})

interface BulkImportViewProps {
  // No props needed as this is self-contained
}

export default function BulkImportView({}: BulkImportViewProps) {
  const [importData, setImportData] = useState('')
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([])
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null)
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [classificationProgress, setClassificationProgress] = useState<{
    current: number
    total: number
    status: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      const content = e.target?.result as string
      setImportData(content)
      
      // Automatically parse the CSV content
      const result = await parseRobustImportData(content)
      setImportResult(result)
      
      if (result.success && result.questions.length > 0) {
        // convertToQuestionBankFormat expects an array and defaults
        const bankQuestions = convertToQuestionBankFormat(result.questions, {
          program: 'SAT',
          subject: 'Math',
          difficulty: 'MEDIUM'
        })
        setParsedQuestions(bankQuestions)
        // Auto-select the first question for preview
        setSelectedPreviewIndex(0)
      }
    }
    reader.readAsText(file)
  }

  const handleParseData = async () => {
    const result = await parseRobustImportData(importData)
    setImportResult(result)
    
    if (result.success && result.questions.length > 0) {
      // convertToQuestionBankFormat expects an array and defaults
      const bankQuestions = convertToQuestionBankFormat(result.questions, {
        program: 'SAT',
        subject: 'Math',
        difficulty: 'MEDIUM'
      })
      setParsedQuestions(bankQuestions)
      // Auto-select the first question for preview
      setSelectedPreviewIndex(0)
    }
  }

  const handleImportAll = async () => {
    if (!parsedQuestions.length) return
    
    console.log('[BULK-IMPORT] Starting import with questions:', parsedQuestions.length)
    console.log('[BULK-IMPORT] First question sample:', parsedQuestions[0])
    
    setIsImporting(true)
    setClassificationProgress({
      current: 0,
      total: parsedQuestions.length,
      status: 'Initializing AI classification...'
    })
    
    try {
      console.log('[BULK-IMPORT] Sending request to batch-classify-and-save endpoint...')
      
      const response = await fetch('/api/admin/questions/batch-classify-and-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: parsedQuestions })
      })
      
      console.log('[BULK-IMPORT] Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[BULK-IMPORT] Error response:', errorText)
        throw new Error(`Server error: ${response.status} - ${errorText}`)
      }
      
      const result = await response.json()
      console.log('[BULK-IMPORT] Response data:', result)
      
      if (result.success) {
        setClassificationProgress({
          current: result.summary.succeeded,
          total: result.summary.total,
          status: `Successfully imported ${result.summary.succeeded} questions! (${result.summary.failed} failed)`
        })
        
        // Show detailed results if there were failures
        if (result.summary.failed > 0) {
          console.warn('[BULK-IMPORT] Some questions failed:', result.results.filter((r: any) => !r.success))
        }
        
        // Clear the form after successful import
        setTimeout(() => {
          setImportData('')
          setParsedQuestions([])
          setImportResult(null)
          setClassificationProgress(null)
        }, 5000)
      } else {
        const errorMsg = result.error || 'Import failed. Please try again.'
        console.error('[BULK-IMPORT] Import failed:', errorMsg)
        setClassificationProgress({
          current: 0,
          total: parsedQuestions.length,
          status: `Import failed: ${errorMsg}`
        })
      }
    } catch (error) {
      console.error('[BULK-IMPORT] Error importing questions:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setClassificationProgress({
        current: 0,
        total: parsedQuestions.length,
        status: `Error: ${errorMessage}`
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <>
      {/* Import Interface */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <FileSpreadsheet className="h-6 w-6 text-red-600" />
          <h2 className="text-xl font-bold text-white">Bulk Import Questions</h2>
        </div>
        
        <div className="space-y-4">
          {/* File Upload Section */}
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.tsv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <FileUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-300 mb-2">Upload a CSV or TXT file with questions</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Choose File
            </button>
            <p className="text-xs text-gray-500 mt-2">Supports CSV, TSV, and TXT formats</p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gray-800 px-3 text-sm text-gray-400">OR</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Paste Questions (supports various formats - numbered lists, Q: format, mixed content, Excel copy, etc.)
            </label>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="1. What is 2 + 2?\nA) 3\nB) 4\nC) 5\nD) 6\nAnswer: B\n\n2. What is the capital of France?..."
              className="w-full h-64 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-red-600 resize-none"
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleParseData}
              disabled={!importData.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Upload className="h-4 w-4" />
              Parse Questions
            </button>
            
            {parsedQuestions.length > 0 && (
              <button
                onClick={handleImportAll}
                disabled={isImporting}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                <Sparkles className="h-4 w-4" />
                AI Classify & Import All ({parsedQuestions.length})
              </button>
            )}
          </div>
        </div>

        {/* Classification Progress */}
        {classificationProgress && (
          <div className="mt-4 p-4 bg-gray-900 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{classificationProgress.status}</span>
              <span className="text-sm text-gray-400">
                {classificationProgress.current} / {classificationProgress.total}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(classificationProgress.current / classificationProgress.total) * 100}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Import Result Summary */}
        {importResult && (
          <div className={`mt-4 p-4 rounded-lg ${
            importResult.success ? 'bg-green-900/20 border border-green-700' : 'bg-red-900/20 border border-red-700'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {importResult.success ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-green-400 font-semibold">
                    Successfully parsed {importResult.questions.length} question(s)
                  </span>
                </>
              ) : (
                <span className="text-red-400">Parsing failed</span>
              )}
            </div>
            
            {importResult.errors.length > 0 && (
              <div className="mt-2 space-y-1">
                <span className="text-xs text-red-400">Errors:</span>
                {importResult.errors.slice(0, 3).map((error, i) => (
                  <p key={i} className="text-xs text-red-300">• {error}</p>
                ))}
                {importResult.errors.length > 3 && (
                  <p className="text-xs text-red-300">... and {importResult.errors.length - 3} more</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Question Processing Interface */}
      {parsedQuestions.length > 0 && (
        <div className="mt-6">
          <ResizablePanelGroup 
            direction="horizontal" 
            className="h-[800px] rounded-lg border border-gray-700"
          >
            {/* Question List Panel */}
            <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
              <div className="h-full flex flex-col bg-gray-900">
                <div className="bg-gray-800 p-4 border-b border-gray-700">
                  <h3 className="font-semibold text-white mb-1">Questions ({parsedQuestions.length})</h3>
                  <div className="text-xs text-gray-400">Click to process • Drag border to resize</div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {parsedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPreviewIndex(index)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedPreviewIndex === index
                          ? 'bg-blue-900/20 border-blue-500'
                          : 'bg-gray-800 border-gray-700 hover:bg-gray-700/50 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-gray-400">Q{index + 1}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              question.questionType === 'MULTIPLE_CHOICE' 
                                ? 'bg-blue-900/50 text-blue-400' 
                                : 'bg-green-900/50 text-green-400'
                            }`}>
                              {question.questionType === 'MULTIPLE_CHOICE' ? 'MC' : 'SA'}
                            </span>
                            {question.correctAnswer && (
                              <span className="text-xs text-green-400/70">
                                ✓ {question.correctAnswer}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 line-clamp-2">
                            {question.questionText.replace(/<[^>]*>/g, '').substring(0, 80)}...
                          </div>
                        </div>
                        <ChevronRight className={`h-4 w-4 flex-shrink-0 transition-transform ${
                          selectedPreviewIndex === index ? 'text-blue-400 rotate-90' : 'text-gray-600'
                        }`} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </ResizablePanel>

            {/* Resize Handle */}
            <ResizableHandle withHandle />

            {/* Processing Panel */}
            <ResizablePanel defaultSize={70}>
              <div className="h-full bg-gray-900">
                {selectedPreviewIndex !== null && parsedQuestions[selectedPreviewIndex] ? (
                  <QuestionProcessingSidebar
                    questions={[{
                      ...parsedQuestions[selectedPreviewIndex],
                      id: selectedPreviewIndex.toString(),
                    }]}
                    onClose={() => setSelectedPreviewIndex(null)}
                    onQuestionsUpdated={(updatedQuestions) => {
                      if (updatedQuestions[0]) {
                        const newQuestions = [...parsedQuestions]
                        newQuestions[selectedPreviewIndex] = updatedQuestions[0]
                        setParsedQuestions(newQuestions)
                      }
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Select a Question to Process</h3>
                      <p className="text-sm text-gray-400">Choose a question from the list to classify and generate variations with AI</p>
                      <div className="mt-4 text-xs text-gray-600">
                        💡 Tip: Drag the divider to resize panels
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}
    </>
  )
}