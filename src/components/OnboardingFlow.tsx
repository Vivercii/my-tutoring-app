'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, ChevronLeft, User, Target, Users, Calendar, CheckCircle } from 'lucide-react'
import AddStudentModal from './students/AddStudentModal'

interface OnboardingFlowProps {
  userId: string
  currentStep: number
  onStepComplete: (step: number) => void
  onComplete: () => void
}

interface Student {
  id: string
  name: string
  email: string
  gradeLevel?: string
}

export default function OnboardingFlow({ userId, currentStep, onStepComplete, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(currentStep)
  const [students, setStudents] = useState<Student[]>([])
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [goals, setGoals] = useState({
    program: '',
    targetScore: '',
    timeline: '',
    focusAreas: [] as string[]
  })

  const steps = [
    { id: 1, title: 'Add Student', icon: User, description: 'Tell us about your child' },
    { id: 2, title: 'Set Goals', icon: Target, description: 'Define academic objectives' },
    { id: 3, title: 'Match Tutor', icon: Users, description: "Find the perfect tutor" },
    { id: 4, title: 'Schedule', icon: Calendar, description: 'Book your first session' }
  ]

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
        if (data.length > 0 && step === 1) {
          // If students exist, move to next step
          handleNextStep()
        }
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }

  const handleNextStep = () => {
    onStepComplete(step)
    if (step < 4) {
      setStep(step + 1)
    } else {
      onComplete()
    }
  }

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleAddStudent = () => {
    setShowAddStudent(true)
  }

  const handleStudentAdded = () => {
    setShowAddStudent(false)
    fetchStudents()
    handleNextStep()
  }

  const handleGoalsSubmit = async () => {
    if (selectedStudent && goals.targetScore) {
      try {
        // Update student profile with goals
        const response = await fetch(`/api/students/${selectedStudent}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            program: goals.program,
            targetScore: goals.targetScore,
            academicGoals: `Timeline: ${goals.timeline}, Focus: ${goals.focusAreas.join(', ')}`
          })
        })
        
        if (response.ok) {
          handleNextStep()
        }
      } catch (error) {
        console.error('Failed to update goals:', error)
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((s, index) => (
            <div key={s.id} className="flex-1 flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step > s.id ? 'bg-green-500 border-green-500 text-white' :
                step === s.id ? 'bg-blue-600 border-blue-600 text-white' :
                'bg-white border-gray-300 text-gray-500'
              }`}>
                {step > s.id ? <CheckCircle className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 ${
                  step > s.id ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          {steps.map(s => (
            <div key={s.id} className="flex-1 text-center">
              <p className={`text-sm font-medium ${
                step === s.id ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {s.title}
              </p>
              <p className="text-xs text-gray-500 mt-1">{s.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {/* Step 1: Add Student */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Let's add your student</h2>
            <p className="text-gray-600 mb-6">
              We'll create a profile for your child to track their progress and match them with the perfect tutor.
            </p>
            
            {students.length > 0 ? (
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-3">You've already added:</p>
                <div className="space-y-2">
                  {students.map(student => (
                    <div key={student.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.gradeLevel || 'Grade not set'}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            
            <button
              onClick={handleAddStudent}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {students.length > 0 ? 'Add Another Student' : 'Add Your First Student'}
            </button>
            
            {students.length > 0 && (
              <button
                onClick={handleNextStep}
                className="w-full mt-3 py-3 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Continue with existing student(s)
              </button>
            )}
          </div>
        )}

        {/* Step 2: Set Goals */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Set Academic Goals</h2>
            <p className="text-gray-600 mb-6">
              Help us understand what you want to achieve so we can create a personalized plan.
            </p>
            
            {students.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Student
                </label>
                <select
                  value={selectedStudent || ''}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  <option value="">Choose a student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Which exam is your student preparing for?
                </label>
                <select
                  value={goals.program}
                  onChange={(e) => setGoals({ ...goals, program: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  <option value="">Select an exam...</option>
                  <option value="SAT">SAT</option>
                  <option value="ACT">ACT</option>
                  <option value="ISEE">ISEE</option>
                  <option value="SSAT">SSAT</option>
                  <option value="GRE">GRE</option>
                  <option value="DAT">DAT</option>
                  <option value="HSPT">HSPT</option>
                  <option value="ACADEMIC_SUPPORT">Academic Support (No specific exam)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Score / Goal
                </label>
                <input
                  type="text"
                  value={goals.targetScore}
                  onChange={(e) => setGoals({ ...goals, targetScore: e.target.value })}
                  placeholder="e.g., 1500+ SAT, 34+ ACT, or Grade A"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeline
                </label>
                <select
                  value={goals.timeline}
                  onChange={(e) => setGoals({ ...goals, timeline: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  <option value="">Select timeline</option>
                  <option value="3 months">3 months</option>
                  <option value="6 months">6 months</option>
                  <option value="1 year">1 year</option>
                  <option value="Ongoing">Ongoing support</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Focus Areas (select all that apply)
                </label>
                <div className="space-y-2">
                  {['Math', 'Reading/Writing', 'Science', 'Test Strategy', 'Time Management'].map(area => (
                    <label key={area} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={goals.focusAreas.includes(area)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setGoals({ ...goals, focusAreas: [...goals.focusAreas, area] })
                          } else {
                            setGoals({ ...goals, focusAreas: goals.focusAreas.filter(a => a !== area) })
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-gray-700">{area}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <button
              onClick={handleGoalsSubmit}
              disabled={!selectedStudent || !goals.program || !goals.targetScore}
              className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 3: Tutor Matching */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Finding the Perfect Tutor</h2>
            <p className="text-gray-600 mb-6">
              We'll match your student with a tutor based on their needs, learning style, and your preferences.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">How We Match</h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Subject expertise in your focus areas</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Experience with your student's grade level</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Proven track record of score improvements</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Personality fit for maximum engagement</span>
                </li>
              </ul>
            </div>
            
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                We'll notify you within 24 hours
              </p>
              <p className="text-gray-600">
                Our team will review your requirements and match you with 2-3 tutor options
              </p>
            </div>
            
            <button
              onClick={handleNextStep}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 4: Schedule */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">You're All Set!</h2>
            <p className="text-gray-600 mb-6">
              Here's what happens next:
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">
                  ✓
                </div>
                <div>
                  <p className="font-medium">Tutor assignment (within 24 hours)</p>
                  <p className="text-sm text-gray-600">We'll email you with your matched tutor options</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">
                  2
                </div>
                <div>
                  <p className="font-medium">Schedule your first session</p>
                  <p className="text-sm text-gray-600">Book directly through your dashboard</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">
                  3
                </div>
                <div>
                  <p className="font-medium">Get your calendar subscription</p>
                  <p className="text-sm text-gray-600">All sessions sync automatically to your phone</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-900 font-medium mb-1">💡 Pro Tip</p>
              <p className="text-green-700 text-sm">
                Most students see the best results with 2 sessions per week. You can adjust frequency anytime.
              </p>
            </div>
            
            <button
              onClick={onComplete}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {/* Navigation */}
        {step > 1 && step < 4 && (
          <div className="flex justify-between mt-6 pt-6 border-t">
            <button
              onClick={handlePreviousStep}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={handleNextStep}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              Skip for now
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddStudent && (
        <AddStudentModal
          onClose={() => setShowAddStudent(false)}
          onStudentAdded={handleStudentAdded}
        />
      )}
    </div>
  )
}