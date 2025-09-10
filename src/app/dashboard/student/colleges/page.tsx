'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, GraduationCap, Search, BookOpen, BarChart, GitCompare, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CollegeList from '@/components/students/CollegeList'
import CollegeExplorer from '@/components/students/CollegeExplorer'
import CollegeComparison from '@/components/students/CollegeComparison'
import ApplicationTracker from '@/components/students/ApplicationTracker'
import CollegeDataViz from '@/components/students/CollegeDataViz'

export default function CollegesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('search')
  const [colleges, setColleges] = useState<any[]>([])
  const [selectedCollege, setSelectedCollege] = useState<any>(null)

  useEffect(() => {
    // Fetch all colleges for comparison tool
    const fetchColleges = async () => {
      try {
        const response = await fetch('/api/colleges/search?limit=100')
        if (response.ok) {
          const data = await response.json()
          setColleges(data.colleges || [])
        }
      } catch (error) {
        console.error('Error fetching colleges:', error)
      }
    }
    fetchColleges()
  }, [])

  if (!session?.user?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Black to match app design */}
      <div className="bg-black text-white">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/dashboard/student')}
                  className="text-white hover:text-gray-300"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-8 w-8" />
                <h1 className="text-4xl font-light">College Explorer</h1>
              </div>
              <p className="text-gray-300 mt-2">
                Search for colleges and build your application list
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden md:inline">Search</span>
            </TabsTrigger>
            <TabsTrigger value="my-list" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden md:inline">My List</span>
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex items-center gap-2">
              <GitCompare className="h-4 w-4" />
              <span className="hidden md:inline">Compare</span>
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden md:inline">Applications</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              <span className="hidden md:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="search" className="mt-6">
            <CollegeExplorer studentId={session.user.id} />
          </TabsContent>
          
          <TabsContent value="my-list" className="mt-6">
            <CollegeList studentId={session.user.id} />
          </TabsContent>
          
          <TabsContent value="compare" className="mt-6">
            <CollegeComparison colleges={colleges} />
          </TabsContent>
          
          <TabsContent value="applications" className="mt-6">
            <ApplicationTracker studentId={session.user.id} colleges={colleges} />
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-6">
            {selectedCollege ? (
              <CollegeDataViz 
                college={selectedCollege}
                studentProfile={{
                  satScore: 1400, // This should come from student profile
                  actScore: 32,
                  gpa: 3.8
                }}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Select a college from the search or list to view analytics</p>
                <Button 
                  className="mt-4"
                  onClick={() => setActiveTab('search')}
                >
                  Go to Search
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}