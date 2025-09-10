'use client'

import { useState, useEffect, useCallback } from 'react'
import { debounce } from 'lodash'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
  Check,
  X,
  Building,
  BookOpen,
  Trophy,
  Target,
  Shield,
  Heart,
  ArrowUpDown,
  Grid3X3,
  List,
  Map as MapIcon,
  Info,
  ChevronDown
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

interface StudentProfile {
  satScore?: number
  actScore?: number
  gpa?: number
  state?: string
}

const US_STATES = [
  { code: 'all', name: 'All States' },
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

const REGIONS = [
  { value: 'all', label: 'All Regions' },
  { value: 'northeast', label: 'Northeast', states: ['CT', 'ME', 'MA', 'NH', 'RI', 'VT', 'NJ', 'NY', 'PA'] },
  { value: 'southeast', label: 'Southeast', states: ['AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV'] },
  { value: 'midwest', label: 'Midwest', states: ['IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI'] },
  { value: 'southwest', label: 'Southwest', states: ['AZ', 'NM', 'OK', 'TX'] },
  { value: 'west', label: 'West', states: ['AK', 'CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'OR', 'UT', 'WA', 'WY'] }
]

export default function CollegeExplorer({ studentId }: { studentId: string }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [colleges, setColleges] = useState<College[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [listType, setListType] = useState<'DREAM' | 'TARGET' | 'SAFETY'>('TARGET')
  const [notes, setNotes] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortBy, setSortBy] = useState('name')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  
  // Student profile for match calculation
  const [studentProfile] = useState<StudentProfile>({
    satScore: 1400,
    actScore: 31,
    gpa: 3.8,
    state: 'CA'
  })

  // Filters
  const [filters, setFilters] = useState({
    // Location
    state: 'all',
    region: 'all',
    
    // Admission
    acceptanceRates: [] as string[],
    testOptional: false,
    
    // Test Scores
    satRange: [400, 1600] as [number, number],
    actRange: [1, 36] as [number, number],
    gpaRange: [2.0, 4.0] as [number, number],
    
    // School Characteristics
    types: [] as string[],
    sizes: [] as string[],
    settings: [] as string[],
    
    // Cost
    tuitionRange: [0, 80000] as [number, number],
    
    // Academic
    studentFacultyRatio: [1, 30] as [number, number],
    graduationRate: [0, 100] as [number, number]
  })

  // Calculate match score
  const calculateMatchScore = (college: College): number => {
    let score = 50 // Base score
    
    // SAT match
    if (studentProfile.satScore && college.satTotalLow && college.satTotalHigh) {
      if (studentProfile.satScore >= college.satTotalLow && studentProfile.satScore <= college.satTotalHigh) {
        score += 20 // Perfect match
      } else if (studentProfile.satScore > college.satTotalHigh) {
        score += 15 // Above range (safety)
      } else if (studentProfile.satScore >= college.satTotalLow - 100) {
        score += 10 // Slightly below (reach)
      }
    }
    
    // ACT match
    if (studentProfile.actScore && college.actCompositeLow && college.actCompositeHigh) {
      if (studentProfile.actScore >= college.actCompositeLow && studentProfile.actScore <= college.actCompositeHigh) {
        score += 20
      } else if (studentProfile.actScore > college.actCompositeHigh) {
        score += 15
      } else if (studentProfile.actScore >= college.actCompositeLow - 2) {
        score += 10
      }
    }
    
    // Location bonus
    if (studentProfile.state === college.state) {
      score += 10
    }
    
    return Math.min(100, score)
  }

  // Determine match type
  const getMatchType = (college: College): 'reach' | 'match' | 'safety' => {
    if (!studentProfile.satScore && !studentProfile.actScore) return 'match'
    
    let scoreComparison = 0
    
    if (studentProfile.satScore && college.satTotalHigh) {
      if (studentProfile.satScore < college.satTotalLow! - 100) return 'reach'
      if (studentProfile.satScore > college.satTotalHigh + 100) return 'safety'
    }
    
    if (studentProfile.actScore && college.actCompositeHigh) {
      if (studentProfile.actScore < college.actCompositeLow! - 3) return 'reach'
      if (studentProfile.actScore > college.actCompositeHigh + 3) return 'safety'
    }
    
    return 'match'
  }

  // Build query string
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams()
    
    if (searchQuery) params.append('q', searchQuery)
    if (filters.state && filters.state !== 'all') params.append('state', filters.state)
    
    // Add region states if region selected
    if (filters.region && filters.region !== 'all') {
      const region = REGIONS.find(r => r.value === filters.region)
      if (region && region.states) {
        region.states.forEach(state => params.append('state', state))
      }
    }
    
    filters.types.forEach(t => params.append('type', t))
    filters.sizes.forEach(s => params.append('size', s))
    filters.settings.forEach(s => params.append('setting', s))
    
    if (filters.satRange[0] > 400) params.append('minSAT', filters.satRange[0].toString())
    if (filters.satRange[1] < 1600) params.append('maxSAT', filters.satRange[1].toString())
    
    if (filters.actRange[0] > 1) params.append('minACT', filters.actRange[0].toString())
    if (filters.actRange[1] < 36) params.append('maxACT', filters.actRange[1].toString())
    
    // Handle acceptance rate filters
    filters.acceptanceRates.forEach(range => {
      const [min, max] = range.split('-').map(Number)
      if (min !== undefined) params.append('minAdmissionRate', (min / 100).toString())
      if (max !== undefined) params.append('maxAdmissionRate', (max / 100).toString())
    })
    
    params.append('page', currentPage.toString())
    params.append('limit', '20')
    params.append('sortBy', sortBy)
    
    return params.toString()
  }, [searchQuery, filters, currentPage, sortBy])

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

  useEffect(() => {
    debouncedSearch()
  }, [searchQuery, filters, currentPage, sortBy])

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
        searchColleges()
      }
    } catch (error) {
      console.error('Error adding college:', error)
    }
  }

  // Format helpers
  const formatTuition = (amount?: number) => {
    if (!amount) return 'N/A'
    return `$${(amount / 1000).toFixed(0)}k`
  }

  const getAcceptanceColor = (rate: string | number | undefined) => {
    if (!rate) return ''
    const numRate = typeof rate === 'string' ? parseFloat(rate) : rate * 100
    if (numRate < 10) return 'text-red-600 font-bold'
    if (numRate < 25) return 'text-orange-600 font-semibold'
    if (numRate < 50) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getMatchBadge = (matchType: string) => {
    switch (matchType) {
      case 'reach':
        return <Badge variant="outline" className="border-purple-500 text-purple-700">Reach</Badge>
      case 'safety':
        return <Badge variant="outline" className="border-green-500 text-green-700">Safety</Badge>
      default:
        return <Badge variant="outline" className="border-blue-500 text-blue-700">Match</Badge>
    }
  }

  // Filter Section Component
  const FilterSection = ({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => (
    <Collapsible defaultOpen={defaultOpen} className="space-y-2">
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-gray-50 rounded px-2">
        <h3 className="font-medium text-sm">{title}</h3>
        <ChevronDown className="h-4 w-4" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 px-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )

  return (
    <div className="flex gap-6">
      {/* Filters Sidebar - Desktop */}
      <div className="hidden lg:block w-80 flex-shrink-0">
        <Card className="sticky top-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Filters</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilters({
                    state: 'all',
                    region: 'all',
                    acceptanceRates: [],
                    testOptional: false,
                    satRange: [400, 1600],
                    actRange: [1, 36],
                    gpaRange: [2.0, 4.0],
                    types: [],
                    sizes: [],
                    settings: [],
                    tuitionRange: [0, 80000],
                    studentFacultyRatio: [1, 30],
                    graduationRate: [0, 100]
                  })
                }}
              >
                Clear All
              </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-4">
                {/* Location */}
                <FilterSection title="Location">
                  <div className="space-y-2">
                    <Label className="text-xs">Region</Label>
                    <Select value={filters.region} onValueChange={v => setFilters(f => ({ ...f, region: v }))}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All Regions" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.map(region => (
                          <SelectItem key={region.value} value={region.value}>
                            {region.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Label className="text-xs">State</Label>
                    <Select value={filters.state} onValueChange={v => setFilters(f => ({ ...f, state: v }))}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All States" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map(state => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </FilterSection>

                <Separator />

                {/* Admission Difficulty */}
                <FilterSection title="Admission Difficulty">
                  <div className="space-y-2">
                    <Label className="text-xs">Acceptance Rate</Label>
                    {[
                      { value: '0-10', label: 'Most Selective (<10%)' },
                      { value: '10-25', label: 'Very Selective (10-25%)' },
                      { value: '25-50', label: 'Selective (25-50%)' },
                      { value: '50-75', label: 'Somewhat Selective (50-75%)' },
                      { value: '75-100', label: 'Less Selective (>75%)' }
                    ].map(option => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.acceptanceRates.includes(option.value)}
                          onCheckedChange={(checked) => {
                            setFilters(f => ({
                              ...f,
                              acceptanceRates: checked
                                ? [...f.acceptanceRates, option.value]
                                : f.acceptanceRates.filter(v => v !== option.value)
                            }))
                          }}
                        />
                        <Label className="text-xs font-normal cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}

                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        checked={filters.testOptional}
                        onCheckedChange={(checked) => setFilters(f => ({ ...f, testOptional: !!checked }))}
                      />
                      <Label className="text-xs font-normal cursor-pointer">
                        Test Optional
                      </Label>
                    </div>
                  </div>
                </FilterSection>

                <Separator />

                {/* Test Scores */}
                <FilterSection title="Test Scores & GPA">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">SAT Range: {filters.satRange[0]} - {filters.satRange[1]}</Label>
                      <Slider
                        value={filters.satRange}
                        onValueChange={(value) => setFilters(f => ({ ...f, satRange: value as [number, number] }))}
                        min={400}
                        max={1600}
                        step={50}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">ACT Range: {filters.actRange[0]} - {filters.actRange[1]}</Label>
                      <Slider
                        value={filters.actRange}
                        onValueChange={(value) => setFilters(f => ({ ...f, actRange: value as [number, number] }))}
                        min={1}
                        max={36}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">GPA Range: {filters.gpaRange[0].toFixed(1)} - {filters.gpaRange[1].toFixed(1)}</Label>
                      <Slider
                        value={filters.gpaRange}
                        onValueChange={(value) => setFilters(f => ({ ...f, gpaRange: value as [number, number] }))}
                        min={2.0}
                        max={4.0}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </FilterSection>

                <Separator />

                {/* School Characteristics */}
                <FilterSection title="School Characteristics">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs mb-2 block">Type</Label>
                      {['Private', 'Public'].map(type => (
                        <div key={type} className="flex items-center space-x-2 mb-1">
                          <Checkbox
                            checked={filters.types.includes(type)}
                            onCheckedChange={(checked) => {
                              setFilters(f => ({
                                ...f,
                                types: checked
                                  ? [...f.types, type]
                                  : f.types.filter(t => t !== type)
                              }))
                            }}
                          />
                          <Label className="text-xs font-normal cursor-pointer">{type}</Label>
                        </div>
                      ))}
                    </div>

                    <div>
                      <Label className="text-xs mb-2 block">Size</Label>
                      {[
                        { value: 'Small', label: 'Small (<2,000)' },
                        { value: 'Medium', label: 'Medium (2,000-15,000)' },
                        { value: 'Large', label: 'Large (>15,000)' }
                      ].map(size => (
                        <div key={size.value} className="flex items-center space-x-2 mb-1">
                          <Checkbox
                            checked={filters.sizes.includes(size.value)}
                            onCheckedChange={(checked) => {
                              setFilters(f => ({
                                ...f,
                                sizes: checked
                                  ? [...f.sizes, size.value]
                                  : f.sizes.filter(s => s !== size.value)
                              }))
                            }}
                          />
                          <Label className="text-xs font-normal cursor-pointer">{size.label}</Label>
                        </div>
                      ))}
                    </div>

                    <div>
                      <Label className="text-xs mb-2 block">Setting</Label>
                      {['Urban', 'Suburban', 'Rural'].map(setting => (
                        <div key={setting} className="flex items-center space-x-2 mb-1">
                          <Checkbox
                            checked={filters.settings.includes(setting)}
                            onCheckedChange={(checked) => {
                              setFilters(f => ({
                                ...f,
                                settings: checked
                                  ? [...f.settings, setting]
                                  : f.settings.filter(s => s !== setting)
                              }))
                            }}
                          />
                          <Label className="text-xs font-normal cursor-pointer">{setting}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </FilterSection>

                <Separator />

                {/* Cost */}
                <FilterSection title="Cost">
                  <div>
                    <Label className="text-xs">
                      Annual Tuition: ${(filters.tuitionRange[0] / 1000).toFixed(0)}k - ${(filters.tuitionRange[1] / 1000).toFixed(0)}k
                    </Label>
                    <Slider
                      value={filters.tuitionRange}
                      onValueChange={(value) => setFilters(f => ({ ...f, tuitionRange: value as [number, number] }))}
                      min={0}
                      max={80000}
                      step={5000}
                      className="mt-2"
                    />
                  </div>
                </FilterSection>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Search Bar and Controls */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search colleges by name, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                {/* Mobile Filter Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>

                {/* Sort Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setSortBy('name')}>Name</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('ranking')}>Ranking</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('admissionRate')}>Acceptance Rate</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('satTotalHigh')}>SAT Score</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* View Mode Toggle */}
                <div className="flex gap-1 border rounded-md">
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-r-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-l-none"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 text-sm text-gray-600">
              {loading ? (
                <span>Searching...</span>
              ) : (
                <span>{totalCount.toLocaleString()} colleges found</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {viewMode === 'list' ? (
          <div className="space-y-3">
            {colleges.map((college) => {
              const matchScore = calculateMatchScore(college)
              const matchType = getMatchType(college)
              
              return (
                <Card key={college.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {college.ranking && (
                                <Badge variant="secondary" className="font-normal">
                                  #{college.ranking}
                                </Badge>
                              )}
                              <h3 className="font-semibold text-lg">{college.name}</h3>
                              {getMatchBadge(matchType)}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {college.city}, {college.state}
                              </span>
                              {college.type && <Badge variant="outline">{college.type}</Badge>}
                              {college.size && <Badge variant="outline">{college.size}</Badge>}
                            </div>
                          </div>
                          
                          {/* Match Score */}
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">{matchScore}%</div>
                            <div className="text-xs text-gray-500">Match Score</div>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                          {college.admissionRate && (
                            <div>
                              <div className="text-xs text-gray-500">Acceptance</div>
                              <div className={`font-semibold ${getAcceptanceColor(college.admissionRate)}`}>
                                {typeof college.admissionRate === 'string' 
                                  ? college.admissionRate 
                                  : `${(college.admissionRate * 100).toFixed(0)}%`}
                              </div>
                            </div>
                          )}
                          
                          {college.satTotalLow && college.satTotalHigh && (
                            <div>
                              <div className="text-xs text-gray-500">SAT Range</div>
                              <div className="font-semibold">{college.satTotalLow}-{college.satTotalHigh}</div>
                            </div>
                          )}
                          
                          {college.actCompositeLow && college.actCompositeHigh && (
                            <div>
                              <div className="text-xs text-gray-500">ACT Range</div>
                              <div className="font-semibold">{college.actCompositeLow}-{college.actCompositeHigh}</div>
                            </div>
                          )}
                          
                          {college.totalEnrollment && (
                            <div>
                              <div className="text-xs text-gray-500">Students</div>
                              <div className="font-semibold">{college.totalEnrollment.toLocaleString()}</div>
                            </div>
                          )}
                          
                          {college.inStateTuition && (
                            <div>
                              <div className="text-xs text-gray-500">Tuition</div>
                              <div className="font-semibold">{formatTuition(college.inStateTuition)}</div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {college.isInMyList ? (
                            <Button size="sm" variant="secondary" disabled>
                              <Check className="h-3 w-3 mr-1" />
                              In My List
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedCollege(college)
                                setAddDialogOpen(true)
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add to List
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">
                            <Heart className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Info className="h-3 w-3 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {colleges.map((college) => {
              const matchScore = calculateMatchScore(college)
              const matchType = getMatchType(college)
              
              return (
                <Card key={college.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        {college.ranking && (
                          <Badge variant="secondary" className="font-normal mb-1">
                            #{college.ranking}
                          </Badge>
                        )}
                        <h3 className="font-semibold">{college.name}</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-blue-600">{matchScore}%</div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      <MapPin className="h-3 w-3 inline mr-1" />
                      {college.city}, {college.state}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {college.admissionRate && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Acceptance:</span>
                          <span className={getAcceptanceColor(college.admissionRate)}>
                            {typeof college.admissionRate === 'string' 
                              ? college.admissionRate 
                              : `${(college.admissionRate * 100).toFixed(0)}%`}
                          </span>
                        </div>
                      )}
                      {college.satTotalHigh && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">SAT:</span>
                          <span>{college.satTotalLow}-{college.satTotalHigh}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t flex justify-between items-center">
                      {getMatchBadge(matchType)}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedCollege(college)
                          setAddDialogOpen(true)
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalCount > 20 && (
          <div className="flex items-center justify-center gap-2 mt-6">
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
      </div>

      {/* Add to List Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {selectedCollege?.name} to Your List</DialogTitle>
            <DialogDescription>
              Choose which list to add this college to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={listType === 'DREAM' ? 'default' : 'outline'}
                onClick={() => setListType('DREAM')}
                className="flex flex-col items-center py-4"
              >
                <Trophy className="h-5 w-5 mb-1" />
                <span>Dream</span>
              </Button>
              <Button
                variant={listType === 'TARGET' ? 'default' : 'outline'}
                onClick={() => setListType('TARGET')}
                className="flex flex-col items-center py-4"
              >
                <Target className="h-5 w-5 mb-1" />
                <span>Target</span>
              </Button>
              <Button
                variant={listType === 'SAFETY' ? 'default' : 'outline'}
                onClick={() => setListType('SAFETY')}
                className="flex flex-col items-center py-4"
              >
                <Shield className="h-5 w-5 mb-1" />
                <span>Safety</span>
              </Button>
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Why are you interested in this college?"
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
                Add to My List
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Filters Dialog */}
      <Dialog open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <DialogContent className="max-w-full h-full max-h-screen">
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[calc(100vh-150px)]">
            {/* Copy filter sections here for mobile */}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}