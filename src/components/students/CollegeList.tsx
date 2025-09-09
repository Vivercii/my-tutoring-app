'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { School, Target, Trophy, Plus, Search, TrendingUp, X, MapPin, DollarSign, Users, GraduationCap, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface College {
  id: string
  name: string
  state?: string
  city?: string
  admissionRate?: number
  satTotalLow?: number
  satTotalHigh?: number
  actCompositeLow?: number
  actCompositeHigh?: number
  inStateTuition?: number
  outStateTuition?: number
  ranking?: number
  type?: string
  size?: string
  setting?: string
}

interface StudentCollege {
  id: string
  college: College
  listType: 'DREAM' | 'TARGET' | 'SAFETY'
  status: string
  notes?: string
  applicationDeadline?: string
}

export default function CollegeList({ studentId }: { studentId: string }) {
  const [colleges, setColleges] = useState<StudentCollege[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<College[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [listType, setListType] = useState<'DREAM' | 'TARGET' | 'SAFETY'>('TARGET')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchMyColleges()
  }, [studentId])

  const fetchMyColleges = async () => {
    try {
      const response = await fetch('/api/colleges/my-list')
      if (response.ok) {
        const data = await response.json()
        setColleges(data)
      }
    } catch (error) {
      console.error('Error fetching colleges:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchColleges = async () => {
    if (!searchQuery.trim()) return
    
    setSearching(true)
    try {
      const response = await fetch(`/api/colleges/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data)
      }
    } catch (error) {
      console.error('Error searching colleges:', error)
    } finally {
      setSearching(false)
    }
  }

  const addToList = async () => {
    if (!selectedCollege) return

    try {
      const response = await fetch('/api/colleges/my-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collegeId: selectedCollege.id,
          listType,
          notes
        })
      })

      if (response.ok) {
        await fetchMyColleges()
        setAddDialogOpen(false)
        setSelectedCollege(null)
        setNotes('')
        setSearchResults([])
        setSearchQuery('')
      }
    } catch (error) {
      console.error('Error adding college:', error)
    }
  }

  const removeFromList = async (collegeId: string) => {
    try {
      const response = await fetch(`/api/colleges/my-list/${collegeId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchMyColleges()
      }
    } catch (error) {
      console.error('Error removing college:', error)
    }
  }

  const updateStatus = async (collegeId: string, status: string) => {
    try {
      const response = await fetch(`/api/colleges/my-list/${collegeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        await fetchMyColleges()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const getListIcon = (type: string) => {
    switch (type) {
      case 'DREAM': return <Trophy className="h-5 w-5 text-purple-500" />
      case 'TARGET': return <Target className="h-5 w-5 text-blue-500" />
      case 'SAFETY': return <School className="h-5 w-5 text-green-500" />
      default: return <School className="h-5 w-5" />
    }
  }

  const getListColor = (type: string) => {
    switch (type) {
      case 'DREAM': return 'bg-purple-50 border-purple-200'
      case 'TARGET': return 'bg-blue-50 border-blue-200'
      case 'SAFETY': return 'bg-green-50 border-green-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const dreamColleges = colleges.filter(c => c.listType === 'DREAM')
  const targetColleges = colleges.filter(c => c.listType === 'TARGET')
  const safetyColleges = colleges.filter(c => c.listType === 'SAFETY')

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Colleges
          </CardTitle>
          <CardDescription>
            Search and add colleges to your list
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search by college name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchColleges()}
              className="flex-1"
            />
            <Button onClick={searchColleges} disabled={searching}>
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
              {searchResults.map((college) => (
                <div
                  key={college.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedCollege(college)
                    setAddDialogOpen(true)
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{college.name}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        {college.city && college.state && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {college.city}, {college.state}
                          </span>
                        )}
                        {college.admissionRate && (
                          <span>{(college.admissionRate * 100).toFixed(1)}% acceptance</span>
                        )}
                        {college.ranking && (
                          <span>#{college.ranking} ranked</span>
                        )}
                      </div>
                      {(college.satTotalLow || college.actCompositeLow) && (
                        <div className="flex gap-4 mt-2 text-sm">
                          {college.satTotalLow && (
                            <Badge variant="outline">
                              SAT: {college.satTotalLow}-{college.satTotalHigh}
                            </Badge>
                          )}
                          {college.actCompositeLow && (
                            <Badge variant="outline">
                              ACT: {college.actCompositeLow}-{college.actCompositeHigh}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* College Lists */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({colleges.length})</TabsTrigger>
          <TabsTrigger value="dream">Dream ({dreamColleges.length})</TabsTrigger>
          <TabsTrigger value="target">Target ({targetColleges.length})</TabsTrigger>
          <TabsTrigger value="safety">Safety ({safetyColleges.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {colleges.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <School className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No colleges added yet</h3>
                <p className="text-gray-600 mb-4">Start building your college list by searching above</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {colleges.map((item) => (
                <CollegeCard
                  key={item.id}
                  college={item}
                  onRemove={() => removeFromList(item.college.id)}
                  onUpdateStatus={(status) => updateStatus(item.college.id, status)}
                  getListIcon={getListIcon}
                  getListColor={getListColor}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="dream" className="space-y-4">
          {dreamColleges.length === 0 ? (
            <EmptyListCard type="Dream" />
          ) : (
            <div className="grid gap-4">
              {dreamColleges.map((item) => (
                <CollegeCard
                  key={item.id}
                  college={item}
                  onRemove={() => removeFromList(item.college.id)}
                  onUpdateStatus={(status) => updateStatus(item.college.id, status)}
                  getListIcon={getListIcon}
                  getListColor={getListColor}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="target" className="space-y-4">
          {targetColleges.length === 0 ? (
            <EmptyListCard type="Target" />
          ) : (
            <div className="grid gap-4">
              {targetColleges.map((item) => (
                <CollegeCard
                  key={item.id}
                  college={item}
                  onRemove={() => removeFromList(item.college.id)}
                  onUpdateStatus={(status) => updateStatus(item.college.id, status)}
                  getListIcon={getListIcon}
                  getListColor={getListColor}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="safety" className="space-y-4">
          {safetyColleges.length === 0 ? (
            <EmptyListCard type="Safety" />
          ) : (
            <div className="grid gap-4">
              {safetyColleges.map((item) => (
                <CollegeCard
                  key={item.id}
                  college={item}
                  onRemove={() => removeFromList(item.college.id)}
                  onUpdateStatus={(status) => updateStatus(item.college.id, status)}
                  getListIcon={getListIcon}
                  getListColor={getListColor}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add College Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {selectedCollege?.name} to Your List</DialogTitle>
            <DialogDescription>
              Choose which list to add this college to and add any notes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>List Type</Label>
              <Select value={listType} onValueChange={(value: any) => setListType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DREAM">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-purple-500" />
                      Dream School
                    </div>
                  </SelectItem>
                  <SelectItem value="TARGET">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      Target School
                    </div>
                  </SelectItem>
                  <SelectItem value="SAFETY">
                    <div className="flex items-center gap-2">
                      <School className="h-4 w-4 text-green-500" />
                      Safety School
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Add any notes about this college..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addToList}>
                Add to List
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CollegeCard({ 
  college, 
  onRemove, 
  onUpdateStatus, 
  getListIcon, 
  getListColor 
}: {
  college: StudentCollege
  onRemove: () => void
  onUpdateStatus: (status: string) => void
  getListIcon: (type: string) => React.ReactNode
  getListColor: (type: string) => string
}) {
  return (
    <Card className={`border ${getListColor(college.listType)}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getListIcon(college.listType)}
              <h4 className="font-medium text-lg">{college.college.name}</h4>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
              {college.college.city && college.college.state && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {college.college.city}, {college.college.state}
                </div>
              )}
              {college.college.admissionRate && (
                <div>{(college.college.admissionRate * 100).toFixed(1)}% acceptance</div>
              )}
              {college.college.ranking && (
                <div>#{college.college.ranking} ranked</div>
              )}
              {college.college.type && (
                <div>{college.college.type}</div>
              )}
            </div>

            {(college.college.satTotalLow || college.college.actCompositeLow) && (
              <div className="flex gap-2 mb-3">
                {college.college.satTotalLow && (
                  <Badge variant="secondary">
                    SAT: {college.college.satTotalLow}-{college.college.satTotalHigh}
                  </Badge>
                )}
                {college.college.actCompositeLow && (
                  <Badge variant="secondary">
                    ACT: {college.college.actCompositeLow}-{college.college.actCompositeHigh}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Select value={college.status} onValueChange={onUpdateStatus}>
                <SelectTrigger className="w-40 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="ACCEPTED">Accepted</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="WAITLISTED">Waitlisted</SelectItem>
                  <SelectItem value="ENROLLED">Enrolled</SelectItem>
                </SelectContent>
              </Select>

              {college.notes && (
                <span className="text-sm text-gray-500 italic">
                  {college.notes}
                </span>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyListCard({ type }: { type: string }) {
  return (
    <Card>
      <CardContent className="text-center py-8">
        <div className="text-gray-400 mb-4">
          {type === 'Dream' && <Trophy className="h-12 w-12 mx-auto" />}
          {type === 'Target' && <Target className="h-12 w-12 mx-auto" />}
          {type === 'Safety' && <School className="h-12 w-12 mx-auto" />}
        </div>
        <h3 className="text-lg font-medium mb-2">No {type} schools yet</h3>
        <p className="text-gray-600">Search and add colleges to build your {type.toLowerCase()} school list</p>
      </CardContent>
    </Card>
  )
}