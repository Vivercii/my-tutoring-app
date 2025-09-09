'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Target, Trophy, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { format } from 'date-fns'

interface StudentOnboardingProps {
  studentId: string
  onComplete: () => void
}

export default function StudentOnboarding({ studentId, onComplete }: StudentOnboardingProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    // Step 1: Exam Information
    examType: '',
    examDate: '',
    currentScore: '',
    targetScore: '',
    
    // Step 2: Objectives (What)
    objectives: [
      { title: '', description: '' }
    ],
    
    // Step 3: Key Results (How)
    keyResults: [
      { title: '', targetValue: '', deadline: '' }
    ],
    
    // Step 4: Academic Profile
    school: '',
    gradeLevel: '',
    strengths: '',
    weaknesses: '',
    preferredSchedule: ''
  })

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const addObjective = () => {
    setFormData({
      ...formData,
      objectives: [...formData.objectives, { title: '', description: '' }]
    })
  }

  const addKeyResult = () => {
    setFormData({
      ...formData,
      keyResults: [...formData.keyResults, { title: '', targetValue: '', deadline: '' }]
    })
  }

  const updateObjective = (index: number, field: string, value: string) => {
    const newObjectives = [...formData.objectives]
    newObjectives[index] = { ...newObjectives[index], [field]: value }
    setFormData({ ...formData, objectives: newObjectives })
  }

  const updateKeyResult = (index: number, field: string, value: string) => {
    const newKeyResults = [...formData.keyResults]
    newKeyResults[index] = { ...newKeyResults[index], [field]: value }
    setFormData({ ...formData, keyResults: newKeyResults })
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Save student profile and goals
      const response = await fetch('/api/students/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          ...formData
        })
      })

      if (response.ok) {
        onComplete()
      } else {
        console.error('Failed to save onboarding data')
      }
    } catch (error) {
      console.error('Error during onboarding:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Step {currentStep} of 4</span>
            <span className="text-sm text-gray-600">{Math.round((currentStep / 4) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Exam Information */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Let's Plan Your Exam Journey
              </CardTitle>
              <CardDescription>
                Tell us about your upcoming exam and goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="examType">Which exam are you preparing for?</Label>
                <select
                  id="examType"
                  className="w-full p-2 border rounded-md"
                  value={formData.examType}
                  onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                >
                  <option value="">Select an exam</option>
                  <option value="SAT">SAT</option>
                  <option value="ACT">ACT</option>
                  <option value="ISEE">ISEE</option>
                  <option value="SSAT">SSAT</option>
                  <option value="GRE">GRE</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="examDate">When is your exam date?</Label>
                <Input
                  id="examDate"
                  type="date"
                  value={formData.examDate}
                  onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                />
                {formData.examDate && (
                  <p className="text-sm text-gray-600 mt-1">
                    That's {Math.ceil((new Date(formData.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days from now!
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentScore">Current Score (if known)</Label>
                  <Input
                    id="currentScore"
                    placeholder="e.g., 1200"
                    value={formData.currentScore}
                    onChange={(e) => setFormData({ ...formData, currentScore: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="targetScore">Target Score</Label>
                  <Input
                    id="targetScore"
                    placeholder="e.g., 1400"
                    value={formData.targetScore}
                    onChange={(e) => setFormData({ ...formData, targetScore: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Objectives */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Set Your Objectives (The "What")
              </CardTitle>
              <CardDescription>
                What do you want to achieve? Set 1-3 main objectives.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.objectives.map((objective, index) => (
                <div key={index} className="space-y-2 p-4 border rounded-lg">
                  <Label>Objective {index + 1}</Label>
                  <Input
                    placeholder="e.g., Improve Math Section Score"
                    value={objective.title}
                    onChange={(e) => updateObjective(index, 'title', e.target.value)}
                  />
                  <Textarea
                    placeholder="Describe this objective in more detail..."
                    value={objective.description}
                    onChange={(e) => updateObjective(index, 'description', e.target.value)}
                    rows={2}
                  />
                </div>
              ))}
              
              {formData.objectives.length < 3 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addObjective}
                  className="w-full"
                >
                  Add Another Objective
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Key Results */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Define Key Results (The "How")
              </CardTitle>
              <CardDescription>
                How will you measure success? Set specific, measurable results.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.keyResults.map((result, index) => (
                <div key={index} className="space-y-2 p-4 border rounded-lg">
                  <Label>Key Result {index + 1}</Label>
                  <Input
                    placeholder="e.g., Complete 20 practice tests"
                    value={result.title}
                    onChange={(e) => updateKeyResult(index, 'title', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Target (e.g., 90%)"
                      value={result.targetValue}
                      onChange={(e) => updateKeyResult(index, 'targetValue', e.target.value)}
                    />
                    <Input
                      type="date"
                      value={result.deadline}
                      onChange={(e) => updateKeyResult(index, 'deadline', e.target.value)}
                    />
                  </div>
                </div>
              ))}
              
              {formData.keyResults.length < 5 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addKeyResult}
                  className="w-full"
                >
                  Add Another Key Result
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Academic Profile */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                Complete Your Profile
              </CardTitle>
              <CardDescription>
                Help us understand your learning style and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="school">School Name</Label>
                  <Input
                    id="school"
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="gradeLevel">Grade Level</Label>
                  <Input
                    id="gradeLevel"
                    placeholder="e.g., 11th Grade"
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="strengths">Your Academic Strengths</Label>
                <Textarea
                  id="strengths"
                  placeholder="What subjects or skills do you excel at?"
                  value={formData.strengths}
                  onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="weaknesses">Areas for Improvement</Label>
                <Textarea
                  id="weaknesses"
                  placeholder="What areas would you like to strengthen?"
                  value={formData.weaknesses}
                  onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="preferredSchedule">Preferred Study Schedule</Label>
                <Textarea
                  id="preferredSchedule"
                  placeholder="When do you prefer to study? (e.g., Weekday evenings, Weekend mornings)"
                  value={formData.preferredSchedule}
                  onChange={(e) => setFormData({ ...formData, preferredSchedule: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {currentStep < 4 ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Complete Setup'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}