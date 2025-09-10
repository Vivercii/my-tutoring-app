'use client'

import { useState, useEffect, useCallback } from 'react'
import { debounce } from 'lodash'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  MapPin, 
  Users, 
  DollarSign, 
  TrendingUp, 
  GraduationCap,
  Filter,
  ChevronLeft,
  ChevronRight,
  Star,
  Plus,
  Check
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface College {
  id: string
  name: string
  state?: string
  city?: string
  website?: string
  type?: string
  size?: string
  setting?: string
  admissionRate?: string | number
  satTotalLow?: number
  satTotalHigh?: number
  actCompositeLow?: number
  actCompositeHigh?: number
  inStateTuition?: number
  outStateTuition?: number
  ranking?: number
  totalEnrollment?: number
  averageGPA?: number
  isInMyList?: boolean
}

interface SearchFilters {
  type: string[]
  size: string[]
  state: string
  satRange: [number, number]
  actRange: [number, number]
  acceptanceRange: [number, number]
  tuitionRange: [number, number]
}

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' }
]

export default function CollegeSearch({ studentId }: { studentId: string }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [colleges, setColleges] = useState<College[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [listType, setListType] = useState<'DREAM' | 'TARGET' | 'SAFETY'>('TARGET')
  const [notes, setNotes] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  const [filters, setFilters] = useState<SearchFilters>({
    type: [],
    size: [],
    state: '',
    satRange: [400, 1600],
    actRange: [1, 36],
    acceptanceRange: [0, 100],
    tuitionRange: [0, 80000]
  })

  // Build query string from filters
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams()
    
    if (searchQuery) params.append('q', searchQuery)
    if (filters.state) params.append('state', filters.state)
    
    filters.type.forEach(t => params.append('type', t))
    filters.size.forEach(s => params.append('size', s))
    
    if (filters.satRange[0] > 400) params.append('minSAT', filters.satRange[0].toString())
    if (filters.satRange[1] < 1600) params.append('maxSAT', filters.satRange[1].toString())
    
    if (filters.actRange[0] > 1) params.append('minACT', filters.actRange[0].toString())
    if (filters.actRange[1] < 36) params.append('maxACT', filters.actRange[1].toString())
    
    if (filters.acceptanceRange[0] > 0) params.append('minAdmissionRate', (filters.acceptanceRange[0] / 100).toString())
    if (filters.acceptanceRange[1] < 100) params.append('maxAdmissionRate', (filters.acceptanceRange[1] / 100).toString())
    
    params.append('page', currentPage.toString())
    params.append('limit', '20')
    
    return params.toString()
  }, [searchQuery, filters, currentPage])

  // Search colleges
  const searchColleges = async () => {
    setLoading(true)
    try {
      const queryString = buildQueryString()
      const response = await fetch(`/api/colleges/search?${queryString}`)
      
      if (response.ok) {
        const data = await response.json()
        setColleges(data.colleges || [])
        setTotalCount(data.pagination?.totalCount || 0)
      }
    } catch (error) {
      console.error('Error searching colleges:', error)
    } finally {
      setLoading(false)
    }
  }

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(() => {
      searchColleges()
    }, 300),
    [buildQueryString]
  )

  // Trigger search on filter/query change
  useEffect(() => {
    debouncedSearch()
  }, [searchQuery, filters, currentPage])

  // Add to list
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
        setAddDialogOpen(false)
        setSelectedCollege(null)
        setNotes('')
        // Refresh search to update "isInMyList" status
        searchColleges()
      }
    } catch (error) {
      console.error('Error adding college:', error)
    }
  }

  // Format tuition display
  const formatTuition = (amount?: number) => {
    if (!amount) return 'N/A'
    return `$${amount.toLocaleString()}`
  }

  // Get acceptance rate color
  const getAcceptanceColor = (rate: string | number | undefined) => {
    if (!rate) return 'text-gray-600'
    const numRate = typeof rate === 'string' ? parseFloat(rate) : rate * 100
    if (numRate < 20) return 'text-red-600 font-semibold'
    if (numRate < 50) return 'text-orange-600'
    return 'text-green-600'
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Find Colleges
            </div>
            <div className="text-sm font-normal text-gray-600">
              {totalCount > 0 && `${totalCount.toLocaleString()} colleges found`}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Input
              placeholder="Search by college name, city, or state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>

          {/* Filters */}
          {showFilters && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* State Filter */}
                <div>
                  <Label>State</Label>
                  <Select value={filters.state} onValueChange={(value) => setFilters(f => ({ ...f, state: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All States" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All States</SelectItem>
                      {US_STATES.map(state => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Type Filter */}
                <div>
                  <Label>College Type</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={filters.type.includes('Private')}
                        onCheckedChange={(checked) => {
                          setFilters(f => ({
                            ...f,
                            type: checked 
                              ? [...f.type, 'Private']
                              : f.type.filter(t => t !== 'Private')
                          }))
                        }}
                      />
                      <Label className="font-normal">Private</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={filters.type.includes('Public')}
                        onCheckedChange={(checked) => {
                          setFilters(f => ({
                            ...f,
                            type: checked 
                              ? [...f.type, 'Public']
                              : f.type.filter(t => t !== 'Public')
                          }))
                        }}
                      />
                      <Label className="font-normal">Public</Label>
                    </div>
                  </div>
                </div>

                {/* Size Filter */}
                <div>
                  <Label>School Size</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={filters.size.includes('Small')}
                        onCheckedChange={(checked) => {
                          setFilters(f => ({
                            ...f,
                            size: checked 
                              ? [...f.size, 'Small']
                              : f.size.filter(s => s !== 'Small')
                          }))
                        }}
                      />
                      <Label className="font-normal">Small (&lt;2,000)</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={filters.size.includes('Medium')}
                        onCheckedChange={(checked) => {
                          setFilters(f => ({
                            ...f,
                            size: checked 
                              ? [...f.size, 'Medium']
                              : f.size.filter(s => s !== 'Medium')
                          }))
                        }}
                      />
                      <Label className="font-normal">Medium (2,000-10,000)</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={filters.size.includes('Large')}
                        onCheckedChange={(checked) => {
                          setFilters(f => ({
                            ...f,
                            size: checked 
                              ? [...f.size, 'Large']
                              : f.size.filter(s => s !== 'Large')
                          }))
                        }}
                      />
                      <Label className="font-normal">Large (&gt;10,000)</Label>
                    </div>
                  </div>
                </div>

                {/* SAT Range */}
                <div>
                  <Label>SAT Score Range: {filters.satRange[0]} - {filters.satRange[1]}</Label>
                  <Slider
                    value={filters.satRange}
                    onValueChange={(value) => setFilters(f => ({ ...f, satRange: value as [number, number] }))}
                    min={400}
                    max={1600}
                    step={10}
                    className="mt-2"
                  />
                </div>

                {/* ACT Range */}
                <div>
                  <Label>ACT Score Range: {filters.actRange[0]} - {filters.actRange[1]}</Label>
                  <Slider
                    value={filters.actRange}
                    onValueChange={(value) => setFilters(f => ({ ...f, actRange: value as [number, number] }))}
                    min={1}
                    max={36}
                    step={1}
                    className="mt-2"
                  />
                </div>

                {/* Acceptance Rate */}
                <div>
                  <Label>Acceptance Rate: {filters.acceptanceRange[0]}% - {filters.acceptanceRange[1]}%</Label>
                  <Slider
                    value={filters.acceptanceRange}
                    onValueChange={(value) => setFilters(f => ({ ...f, acceptanceRange: value as [number, number] }))}
                    min={0}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters({
                    type: [],
                    size: [],
                    state: '',
                    satRange: [400, 1600],
                    actRange: [1, 36],
                    acceptanceRange: [0, 100],
                    tuitionRange: [0, 80000]
                  })
                }}
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {colleges.map((college) => (
          <Card key={college.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* College Name and Basic Info */}
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        {college.ranking && (
                          <Badge variant="outline" className="font-normal">
                            #{college.ranking}
                          </Badge>
                        )}
                        {college.name}
                      </h3>
                      
                      {/* Location and Type */}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        {college.city && college.state && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {college.city}, {college.state}
                          </span>
                        )}
                        {college.type && (
                          <Badge variant="secondary">{college.type}</Badge>
                        )}
                        {college.size && (
                          <Badge variant="secondary">{college.size}</Badge>
                        )}
                        {college.totalEnrollment && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {college.totalEnrollment.toLocaleString()} students
                          </span>
                        )}
                      </div>

                      {/* Academic Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {/* Acceptance Rate */}
                        {college.admissionRate && (
                          <div>
                            <div className="text-xs text-gray-500 uppercase">Acceptance Rate</div>
                            <div className={`font-semibold ${getAcceptanceColor(college.admissionRate)}`}>
                              {typeof college.admissionRate === 'string' 
                                ? college.admissionRate 
                                : `${(college.admissionRate * 100).toFixed(1)}%`}
                            </div>
                          </div>
                        )}

                        {/* SAT Range */}
                        {college.satTotalLow && college.satTotalHigh && (
                          <div>
                            <div className="text-xs text-gray-500 uppercase">SAT Range</div>
                            <div className="font-semibold">{college.satTotalLow}-{college.satTotalHigh}</div>
                          </div>
                        )}

                        {/* ACT Range */}
                        {college.actCompositeLow && college.actCompositeHigh && (
                          <div>
                            <div className="text-xs text-gray-500 uppercase">ACT Range</div>
                            <div className="font-semibold">{college.actCompositeLow}-{college.actCompositeHigh}</div>
                          </div>
                        )}

                        {/* Tuition */}
                        {college.inStateTuition && (
                          <div>
                            <div className="text-xs text-gray-500 uppercase">
                              {college.type === 'Public' ? 'In-State Tuition' : 'Tuition'}
                            </div>
                            <div className="font-semibold">{formatTuition(college.inStateTuition)}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div>
                      {college.isInMyList ? (
                        <Button size="sm" variant="outline" disabled>
                          <Check className="h-4 w-4 mr-1" />
                          In List
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedCollege(college)
                            setAddDialogOpen(true)
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add to List
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalCount > 20 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {Math.ceil(totalCount / 20)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={currentPage >= Math.ceil(totalCount / 20)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Add to List Dialog */}
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
                  <SelectItem value="DREAM">Dream School</SelectItem>
                  <SelectItem value="TARGET">Target School</SelectItem>
                  <SelectItem value="SAFETY">Safety School</SelectItem>
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