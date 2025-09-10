'use client'

import { useState, useEffect } from 'react'
import { format, differenceInDays, addDays } from 'date-fns'
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  FileText,
  DollarSign,
  Send,
  Award,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Application {
  id: string
  collegeId: string
  collegeName: string
  applicationDeadline: Date
  decisionDate?: Date
  status: 'not-started' | 'in-progress' | 'submitted' | 'accepted' | 'rejected' | 'waitlisted' | 'deferred'
  type: 'early-decision' | 'early-action' | 'regular' | 'rolling'
  documents: {
    transcript: boolean
    essay: boolean
    recommendations: number
    testScores: boolean
    financialAid: boolean
    portfolio?: boolean
  }
  notes?: string
  applicationFee?: number
  feeWaived?: boolean
}

interface ApplicationTrackerProps {
  studentId: string
  colleges: any[]
}

export default function ApplicationTracker({ studentId, colleges }: ApplicationTrackerProps) {
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedCollege, setSelectedCollege] = useState<string>('')
  const [editingApp, setEditingApp] = useState<Application | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Mock data - replace with API call
  useEffect(() => {
    // Fetch applications from API
    const mockApplications: Application[] = [
      {
        id: '1',
        collegeId: '1',
        collegeName: 'MIT',
        applicationDeadline: addDays(new Date(), 30),
        status: 'in-progress',
        type: 'early-action',
        documents: {
          transcript: true,
          essay: false,
          recommendations: 1,
          testScores: true,
          financialAid: false,
        },
        applicationFee: 75,
      },
      {
        id: '2',
        collegeId: '2',
        collegeName: 'Harvard',
        applicationDeadline: addDays(new Date(), 45),
        status: 'not-started',
        type: 'regular',
        documents: {
          transcript: false,
          essay: false,
          recommendations: 0,
          testScores: false,
          financialAid: false,
        },
        applicationFee: 85,
      },
    ]
    setApplications(mockApplications)
  }, [studentId])

  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case 'submitted': return 'bg-green-100 text-green-800'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800'
      case 'not-started': return 'bg-gray-100 text-gray-800'
      case 'accepted': return 'bg-emerald-100 text-emerald-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'waitlisted': return 'bg-orange-100 text-orange-800'
      case 'deferred': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Application['status']) => {
    switch (status) {
      case 'submitted': return <Send className="h-4 w-4" />
      case 'in-progress': return <Clock className="h-4 w-4" />
      case 'not-started': return <AlertCircle className="h-4 w-4" />
      case 'accepted': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      case 'waitlisted': return <AlertTriangle className="h-4 w-4" />
      case 'deferred': return <Calendar className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getDeadlineUrgency = (deadline: Date) => {
    const days = differenceInDays(deadline, new Date())
    if (days < 0) return { color: 'text-red-600', label: 'Overdue' }
    if (days <= 7) return { color: 'text-red-500', label: `${days} days left` }
    if (days <= 30) return { color: 'text-yellow-500', label: `${days} days left` }
    return { color: 'text-gray-500', label: `${days} days left` }
  }

  const calculateProgress = (docs: Application['documents']) => {
    const totalItems = 5 + (docs.portfolio ? 1 : 0)
    const completedItems = 
      (docs.transcript ? 1 : 0) +
      (docs.essay ? 1 : 0) +
      (docs.recommendations >= 2 ? 1 : 0) +
      (docs.testScores ? 1 : 0) +
      (docs.financialAid ? 1 : 0) +
      (docs.portfolio ? 1 : 0)
    return (completedItems / totalItems) * 100
  }

  const addApplication = () => {
    if (!selectedCollege) return
    
    const college = colleges.find(c => c.id === selectedCollege)
    if (!college) return

    const newApp: Application = {
      id: Date.now().toString(),
      collegeId: college.id,
      collegeName: college.name,
      applicationDeadline: addDays(new Date(), 60),
      status: 'not-started',
      type: 'regular',
      documents: {
        transcript: false,
        essay: false,
        recommendations: 0,
        testScores: false,
        financialAid: false,
      },
    }

    setApplications([...applications, newApp])
    setSelectedCollege('')
    setDialogOpen(false)
  }

  const updateDocumentStatus = (appId: string, field: keyof Application['documents'], value: any) => {
    setApplications(applications.map(app => {
      if (app.id === appId) {
        return {
          ...app,
          documents: {
            ...app.documents,
            [field]: value
          }
        }
      }
      return app
    }))
  }

  const updateApplicationStatus = (appId: string, status: Application['status']) => {
    setApplications(applications.map(app => 
      app.id === appId ? { ...app, status } : app
    ))
  }

  // Sort applications by deadline
  const sortedApplications = [...applications].sort((a, b) => 
    differenceInDays(a.applicationDeadline, b.applicationDeadline)
  )

  // Get upcoming deadlines
  const upcomingDeadlines = sortedApplications
    .filter(app => app.status !== 'submitted' && differenceInDays(app.applicationDeadline, new Date()) <= 30)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold">{applications.length}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Submitted</p>
                <p className="text-2xl font-bold text-green-600">
                  {applications.filter(a => a.status === 'submitted').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {applications.filter(a => a.status === 'in-progress').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Decisions</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {applications.filter(a => ['accepted', 'rejected', 'waitlisted'].includes(a.status)).length}
                </p>
              </div>
              <Award className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingDeadlines.map(app => {
                const urgency = getDeadlineUrgency(app.applicationDeadline)
                return (
                  <div key={app.id} className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                    <div>
                      <p className="font-medium">{app.collegeName}</p>
                      <p className="text-sm text-gray-600">
                        {format(app.applicationDeadline, 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <Badge className={urgency.color}>
                      {urgency.label}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>My Applications</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  Add Application
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Application</DialogTitle>
                  <DialogDescription>
                    Select a college to track its application
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>College</Label>
                    <Select value={selectedCollege} onValueChange={setSelectedCollege}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a college" />
                      </SelectTrigger>
                      <SelectContent>
                        {colleges
                          .filter(c => !applications.find(a => a.collegeId === c.id))
                          .map(college => (
                            <SelectItem key={college.id} value={college.id}>
                              {college.name}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={addApplication} className="w-full">
                    Add Application
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedApplications.map(app => {
              const progress = calculateProgress(app.documents)
              const urgency = getDeadlineUrgency(app.applicationDeadline)
              
              return (
                <Card key={app.id} className="p-4">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{app.collegeName}</h3>
                        <div className="flex items-center gap-4 mt-1">
                          <Badge className={getStatusColor(app.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(app.status)}
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1).replace('-', ' ')}
                            </span>
                          </Badge>
                          <Badge variant="outline">{app.type.replace('-', ' ')}</Badge>
                          <span className={`text-sm ${urgency.color}`}>
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {format(app.applicationDeadline, 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                      <Select
                        value={app.status}
                        onValueChange={(value) => updateApplicationStatus(app.id, value as Application['status'])}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not-started">Not Started</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="waitlisted">Waitlisted</SelectItem>
                          <SelectItem value="deferred">Deferred</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Application Progress</span>
                        <span className="text-sm font-medium">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {/* Document Checklist */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={app.documents.transcript}
                          onCheckedChange={(checked) => 
                            updateDocumentStatus(app.id, 'transcript', checked)
                          }
                        />
                        <label className="text-sm">Transcript</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={app.documents.essay}
                          onCheckedChange={(checked) => 
                            updateDocumentStatus(app.id, 'essay', checked)
                          }
                        />
                        <label className="text-sm">Essay</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={app.documents.testScores}
                          onCheckedChange={(checked) => 
                            updateDocumentStatus(app.id, 'testScores', checked)
                          }
                        />
                        <label className="text-sm">Test Scores</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={app.documents.financialAid}
                          onCheckedChange={(checked) => 
                            updateDocumentStatus(app.id, 'financialAid', checked)
                          }
                        />
                        <label className="text-sm">Financial Aid</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={app.documents.recommendations >= 2}
                          onCheckedChange={(checked) => 
                            updateDocumentStatus(app.id, 'recommendations', checked ? 2 : 0)
                          }
                        />
                        <label className="text-sm">Recommendations (2)</label>
                      </div>
                      {app.applicationFee && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={app.feeWaived || false}
                            onCheckedChange={(checked) => 
                              setApplications(applications.map(a => 
                                a.id === app.id ? { ...a, feeWaived: checked as boolean } : a
                              ))
                            }
                          />
                          <label className="text-sm">
                            Fee ${app.applicationFee} {app.feeWaived && '(Waived)'}
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}