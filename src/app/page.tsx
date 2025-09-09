'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { GraduationCap, BookOpen, Calendar } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <nav className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-semibold">UpstartPrep Tutoring</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Welcome to UpstartPrep Tutoring
          </h2>
          <p className="mt-4 text-xl text-muted-foreground">
            Your pathway to academic excellence with expert tutors
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <Link href="/signup">
              <Button size="lg" className="px-8">
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <GraduationCap className="h-8 w-8 mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Expert Tutors</h3>
              <p className="text-muted-foreground">
                Connect with qualified tutors in various subjects
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <BookOpen className="h-8 w-8 mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Track Progress</h3>
              <p className="text-muted-foreground">
                Monitor student progress and learning milestones
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Calendar className="h-8 w-8 mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Easy Scheduling</h3>
              <p className="text-muted-foreground">
                Schedule and manage tutoring sessions effortlessly
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}