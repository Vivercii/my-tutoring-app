'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Download,
  Upload,
  Search,
  Filter,
  BookOpen,
  Video,
  Headphones,
  File,
  CheckCircle,
  Clock,
  Star,
  ChevronRight,
  FolderOpen,
  Brain,
  Calculator,
  PenTool,
  Target,
  Zap,
  Lock,
  Unlock,
  Eye,
  Play,
  Pause,
  RotateCw,
  Calendar,
  User
} from 'lucide-react'

interface Resource {
  id: string
  title: string
  description: string
  type: 'practice_test' | 'video' | 'worksheet' | 'guide' | 'flashcards' | 'audio'
  subject: 'math' | 'reading' | 'writing' | 'general'
  difficulty: 'easy' | 'medium' | 'hard'
  duration?: number // in minutes
  questions?: number
  fileSize?: string
  uploadedBy: string
  uploadedDate: string
  lastAccessed?: string
  completed: boolean
  score?: number
  attempts?: number
  locked: boolean
  premium?: boolean
}

interface StudyPlan {
  week: number
  focus: string
  resources: string[]
  goals: string[]
  completed: boolean
}

interface HomeworkAssignment {
  id: string
  title: string
  dueDate: string
  subject: string
  tutor: string
  status: 'pending' | 'submitted' | 'graded'
  grade?: number
  feedback?: string
  attachments: string[]
}

export default function ResourceCenterPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [resources, setResources] = useState<Resource[]>([])
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([])
  const [homework, setHomework] = useState<HomeworkAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role === 'PARENT') {
      fetchResources()
    }
  }, [status, session, studentId])

  const fetchResources = async () => {
    try {
      // Mock data - will be replaced with API calls
      const mockResources: Resource[] = [
        {
          id: '1',
          title: 'SAT Math Practice Test #1',
          description: 'Full-length math section with 58 questions',
          type: 'practice_test',
          subject: 'math',
          difficulty: 'medium',
          duration: 80,
          questions: 58,
          fileSize: '2.4 MB',
          uploadedBy: 'Kharis Yeboah',
          uploadedDate: '2025-07-01',
          lastAccessed: '2025-07-10',
          completed: true,
          score: 780,
          attempts: 2,
          locked: false
        },
        {
          id: '2',
          title: 'Reading Comprehension Strategies',
          description: 'Video lesson on approaching complex passages',
          type: 'video',
          subject: 'reading',
          difficulty: 'medium',
          duration: 45,
          fileSize: '256 MB',
          uploadedBy: 'Ulises Gonzalez',
          uploadedDate: '2025-06-15',
          lastAccessed: '2025-07-05',
          completed: true,
          locked: false
        },
        {
          id: '3',
          title: 'Advanced Algebra Worksheet',
          description: '25 challenging algebra problems with solutions',
          type: 'worksheet',
          subject: 'math',
          difficulty: 'hard',
          questions: 25,
          fileSize: '1.2 MB',
          uploadedBy: 'Kharis Yeboah',
          uploadedDate: '2025-07-05',
          completed: false,
          locked: false
        },
        {
          id: '4',
          title: 'Grammar Rules Quick Reference',
          description: 'Essential grammar rules for SAT Writing',
          type: 'guide',
          subject: 'writing',
          difficulty: 'easy',
          fileSize: '800 KB',
          uploadedBy: 'System',
          uploadedDate: '2025-06-01',
          completed: true,
          locked: false
        },
        {
          id: '5',
          title: 'SAT Vocabulary Flashcards - Set 1',
          description: '100 essential SAT vocabulary words',
          type: 'flashcards',
          subject: 'general',
          difficulty: 'medium',
          questions: 100,
          uploadedBy: 'System',
          uploadedDate: '2025-06-01',
          completed: false,
          attempts: 3,
          locked: false
        },
        {
          id: '6',
          title: 'Practice Test Audio Instructions',
          description: 'Audio guide for mock test procedures',
          type: 'audio',
          subject: 'general',
          difficulty: 'easy',
          duration: 10,
          fileSize: '15 MB',
          uploadedBy: 'System',
          uploadedDate: '2025-06-01',
          completed: true,
          locked: false
        }
      ]

      const mockStudyPlans: StudyPlan[] = [
        {
          week: 1,
          focus: 'Baseline Assessment & Math Fundamentals',
          resources: ['1', '3'],
          goals: ['Complete initial assessment', 'Review algebra basics'],
          completed: true
        },
        {
          week: 2,
          focus: 'Reading Comprehension Strategies',
          resources: ['2', '4'],
          goals: ['Master passage analysis', 'Improve reading speed'],
          completed: true
        },
        {
          week: 3,
          focus: 'Advanced Math & Problem Solving',
          resources: ['3', '5'],
          goals: ['Tackle complex equations', 'Time management practice'],
          completed: false
        }
      ]

      const mockHomework: HomeworkAssignment[] = [
        {
          id: 'hw1',
          title: 'Complete Practice Test Section 3',
          dueDate: '2025-07-20',
          subject: 'Math',
          tutor: 'Kharis Yeboah',
          status: 'pending',
          attachments: []
        },
        {
          id: 'hw2',
          title: 'Reading Comprehension Exercises',
          dueDate: '2025-07-18',
          subject: 'Reading',
          tutor: 'Ulises Gonzalez',
          status: 'submitted',
          attachments: ['reading_answers.pdf']
        },
        {
          id: 'hw3',
          title: 'Grammar Worksheet Set A',
          dueDate: '2025-07-15',
          subject: 'Writing',
          tutor: 'Ulises Gonzalez',
          status: 'graded',
          grade: 92,
          feedback: 'Excellent work! Pay attention to comma usage in complex sentences.',
          attachments: ['grammar_completed.pdf']
        }
      ]

      setResources(mockResources)
      setStudyPlans(mockStudyPlans)
      setHomework(mockHomework)
    } catch (error) {
      console.error('Failed to fetch resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          // Add file to homework attachments
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const getResourceIcon = (type: Resource['type']) => {
    switch (type) {
      case 'practice_test': return <PenTool className="h-5 w-5" />
      case 'video': return <Video className="h-5 w-5" />
      case 'worksheet': return <FileText className="h-5 w-5" />
      case 'guide': return <BookOpen className="h-5 w-5" />
      case 'flashcards': return <Brain className="h-5 w-5" />
      case 'audio': return <Headphones className="h-5 w-5" />
      default: return <File className="h-5 w-5" />
    }
  }

  const getDifficultyColor = (difficulty: Resource['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'hard': return 'text-red-600 bg-red-100'
    }
  }

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSubject = selectedSubject === 'all' || resource.subject === selectedSubject
    const matchesDifficulty = selectedDifficulty === 'all' || resource.difficulty === selectedDifficulty
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'practice' && resource.type === 'practice_test') ||
                      (activeTab === 'videos' && resource.type === 'video') ||
                      (activeTab === 'worksheets' && resource.type === 'worksheet')
    
    return matchesSearch && matchesSubject && matchesDifficulty && matchesTab
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <Link
              href={`/dashboard/students/${studentId}`}
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Student Details
            </Link>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-light mb-2">Resource Center</h1>
                <p className="text-gray-300">Practice materials, study guides, and homework</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Subjects</option>
              <option value="math">Math</option>
              <option value="reading">Reading</option>
              <option value="writing">Writing</option>
              <option value="general">General</option>
            </select>
            
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'practice', 'videos', 'worksheets', 'homework', 'study-plan'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'homework' ? (
          <div className="space-y-4">
            {homework.map((hw) => (
              <div key={hw.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{hw.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        hw.status === 'graded' ? 'bg-green-100 text-green-700' :
                        hw.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {hw.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-700 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {new Date(hw.dueDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {hw.subject}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {hw.tutor}
                      </span>
                    </div>
                    
                    {hw.status === 'graded' && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Grade</span>
                          <span className="text-lg font-bold text-gray-900">{hw.grade}%</span>
                        </div>
                        {hw.feedback && (
                          <p className="text-sm text-gray-700">{hw.feedback}</p>
                        )}
                      </div>
                    )}
                    
                    {hw.status === 'pending' && (
                      <div className="flex items-center gap-3">
                        <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                          <Upload className="h-4 w-4 inline mr-2" />
                          Upload Solution
                        </label>
                        
                        {isUploading && (
                          <div className="flex-1">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'study-plan' ? (
          <div className="space-y-6">
            {studyPlans.map((plan, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      plan.completed ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {plan.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <span className="font-bold text-blue-600">{plan.week}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Week {plan.week}</h3>
                      <p className="text-sm text-gray-700">{plan.focus}</p>
                    </div>
                  </div>
                  
                  {plan.completed && (
                    <span className="text-sm text-green-600 font-medium">Completed</span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Goals</h4>
                    <ul className="space-y-1">
                      {plan.goals.map((goal, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                          <Target className="h-3 w-3 text-gray-400" />
                          {goal}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Resources</h4>
                    <div className="space-y-1">
                      {plan.resources.map(resourceId => {
                        const resource = resources.find(r => r.id === resourceId)
                        if (!resource) return null
                        return (
                          <div key={resourceId} className="flex items-center gap-2 text-sm text-gray-700">
                            {getResourceIcon(resource.type)}
                            <span>{resource.title}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredResources.map((resource) => (
              <div key={resource.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      resource.type === 'video' ? 'bg-purple-100 text-purple-600' :
                      resource.type === 'practice_test' ? 'bg-blue-100 text-blue-600' :
                      resource.type === 'worksheet' ? 'bg-green-100 text-green-600' :
                      resource.type === 'guide' ? 'bg-orange-100 text-orange-600' :
                      resource.type === 'flashcards' ? 'bg-pink-100 text-pink-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {getResourceIcon(resource.type)}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{resource.title}</h3>
                      <p className="text-sm text-gray-700">{resource.description}</p>
                    </div>
                  </div>
                  
                  {resource.completed && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
                
                <div className="flex items-center gap-3 mb-3 text-xs">
                  <span className={`px-2 py-1 rounded-full font-medium ${getDifficultyColor(resource.difficulty)}`}>
                    {resource.difficulty}
                  </span>
                  {resource.duration && (
                    <span className="flex items-center gap-1 text-gray-700">
                      <Clock className="h-3 w-3" />
                      {resource.duration} min
                    </span>
                  )}
                  {resource.questions && (
                    <span className="flex items-center gap-1 text-gray-700">
                      <FileText className="h-3 w-3" />
                      {resource.questions} questions
                    </span>
                  )}
                  {resource.score && (
                    <span className="flex items-center gap-1 text-gray-700">
                      <Star className="h-3 w-3" />
                      Score: {resource.score}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-700">
                    By {resource.uploadedBy} • {resource.fileSize}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    {resource.type === 'practice_test' && !resource.completed && (
                      <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                        Start Test
                      </button>
                    )}
                    {resource.type === 'video' && (
                      <button className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">
                        <Play className="h-3 w-3 inline mr-1" />
                        Watch
                      </button>
                    )}
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Download className="h-4 w-4 text-gray-700" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}