'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface LogSessionModalProps {
  isOpen: boolean
  onClose: () => void
  studentId: string
  studentName: string
  onSuccess: () => void
}

export default function LogSessionModal({ 
  isOpen, 
  onClose, 
  studentId, 
  studentName,
  onSuccess 
}: LogSessionModalProps) {
  const [formData, setFormData] = useState({
    subject: '',
    tutorName: '',
    date: new Date().toISOString().split('T')[0],
    duration: 60,
    notes: '',
    score: '',
    rating: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [hoveredRating, setHoveredRating] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.subject.trim()) {
      setError('Please enter the subject')
      return
    }

    if (!formData.tutorName.trim()) {
      setError('Please enter the tutor name')
      return
    }

    if (formData.duration < 1) {
      setError('Duration must be at least 1 minute')
      return
    }

    if (formData.rating === 0) {
      setError('Please provide a rating')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          studentId,
          studentName
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to log session')
      }

      setFormData({
        subject: '',
        tutorName: '',
        date: new Date().toISOString().split('T')[0],
        duration: 60,
        notes: '',
        score: '',
        rating: 0
      })
      onSuccess()
      onClose()
    } catch (error: any) {
      setError(error.message || 'Failed to log session')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        subject: '',
        tutorName: '',
        date: new Date().toISOString().split('T')[0],
        duration: 60,
        notes: '',
        score: '',
        rating: 0
      })
      setError('')
      onClose()
    }
  }

  const StarRating = () => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setFormData({ ...formData, rating: star })}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="text-2xl focus:outline-none"
            disabled={isLoading}
          >
            <span className={
              star <= (hoveredRating || formData.rating)
                ? 'text-yellow-400'
                : 'text-gray-300'
            }>
              ★
            </span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log Tutoring Session for {studentName}</DialogTitle>
          <DialogDescription>
            Record the details of the completed tutoring session.
          </DialogDescription>
        </DialogHeader>
                
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="subject">
                  Subject <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Mathematics, English"
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tutorName">
                  Tutor Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tutorName"
                  value={formData.tutorName}
                  onChange={(e) => setFormData({ ...formData, tutorName: e.target.value })}
                  placeholder="Enter tutor's name"
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="date">
                  Date of Session <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  id="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="duration">
                  Duration (minutes) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  id="duration"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="score">Score / Result</Label>
                <Input
                  id="score"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                  placeholder="e.g., 85%, B+"
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-2">
                <Label>
                  Rating <span className="text-red-500">*</span>
                </Label>
                <StarRating />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Session Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes about the session..."
                disabled={isLoading}
                className="min-h-[100px]"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging Session...
                </>
              ) : (
                'Log Session'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}