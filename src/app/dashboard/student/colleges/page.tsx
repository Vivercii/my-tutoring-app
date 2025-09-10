'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, GraduationCap, Search, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CollegeList from '@/components/students/CollegeList'
import CollegeSearch from '@/components/students/CollegeSearch'

export default function CollegesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('search')

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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Colleges
            </TabsTrigger>
            <TabsTrigger value="my-list" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              My List
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="search" className="mt-6">
            <CollegeSearch studentId={session.user.id} />
          </TabsContent>
          
          <TabsContent value="my-list" className="mt-6">
            <CollegeList studentId={session.user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}