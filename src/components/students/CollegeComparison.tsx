'use client'

import { useState } from 'react'
import { X, Plus, TrendingUp, TrendingDown, Minus, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  roomAndBoard?: number
  costOfAttendance?: number
  applicationFee?: number
  financialAidPercentage?: number
  ranking?: number
  totalEnrollment?: number
  averageGPA?: number
}

interface CollegeComparisonProps {
  colleges: College[]
  studentState?: string
}

export default function CollegeComparison({ colleges, studentState }: CollegeComparisonProps) {
  const [selectedColleges, setSelectedColleges] = useState<College[]>([])
  const maxComparisons = 4

  const addCollege = (collegeId: string) => {
    const college = colleges.find(c => c.id === collegeId)
    if (college && selectedColleges.length < maxComparisons && !selectedColleges.find(c => c.id === collegeId)) {
      setSelectedColleges([...selectedColleges, college])
    }
  }

  const removeCollege = (collegeId: string) => {
    setSelectedColleges(selectedColleges.filter(c => c.id !== collegeId))
  }

  const formatTuition = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getAcceptanceRate = (rate: string | number | undefined) => {
    if (!rate) return 'N/A'
    if (typeof rate === 'string') return rate
    return `${(rate * 100).toFixed(0)}%`
  }

  const getComparisonValue = (value: any, type: 'currency' | 'percent' | 'number' | 'text' = 'text') => {
    if (value === undefined || value === null) return 'N/A'
    
    switch (type) {
      case 'currency':
        return formatTuition(value)
      case 'percent':
        return typeof value === 'number' ? `${(value * 100).toFixed(0)}%` : value
      case 'number':
        return value.toLocaleString()
      default:
        return value
    }
  }

  const getComparisonColor = (value: number, values: number[], higherIsBetter: boolean = true) => {
    const validValues = values.filter(v => v !== undefined && v !== null)
    if (validValues.length === 0) return ''
    
    const max = Math.max(...validValues)
    const min = Math.min(...validValues)
    
    if (value === max) return higherIsBetter ? 'text-green-600' : 'text-red-600'
    if (value === min) return higherIsBetter ? 'text-red-600' : 'text-green-600'
    return 'text-yellow-600'
  }

  const exportComparison = () => {
    // Create CSV content
    const headers = ['Metric', ...selectedColleges.map(c => c.name)]
    const rows = [
      ['Location', ...selectedColleges.map(c => `${c.city}, ${c.state}`)],
      ['Type', ...selectedColleges.map(c => c.type || 'N/A')],
      ['Size', ...selectedColleges.map(c => c.size || 'N/A')],
      ['Setting', ...selectedColleges.map(c => c.setting || 'N/A')],
      ['Ranking', ...selectedColleges.map(c => c.ranking ? `#${c.ranking}` : 'N/A')],
      ['Acceptance Rate', ...selectedColleges.map(c => getAcceptanceRate(c.admissionRate))],
      ['SAT Range', ...selectedColleges.map(c => c.satTotalLow && c.satTotalHigh ? `${c.satTotalLow}-${c.satTotalHigh}` : 'N/A')],
      ['ACT Range', ...selectedColleges.map(c => c.actCompositeLow && c.actCompositeHigh ? `${c.actCompositeLow}-${c.actCompositeHigh}` : 'N/A')],
      ['In-State Tuition', ...selectedColleges.map(c => c.inStateTuition ? formatTuition(c.inStateTuition) : 'N/A')],
      ['Out-of-State Tuition', ...selectedColleges.map(c => c.outStateTuition ? formatTuition(c.outStateTuition) : 'N/A')],
      ['Total Enrollment', ...selectedColleges.map(c => c.totalEnrollment ? c.totalEnrollment.toLocaleString() : 'N/A')],
    ]

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `college-comparison-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>College Comparison Tool</CardTitle>
          {selectedColleges.length > 0 && (
            <Button onClick={exportComparison} size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* College Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Select onValueChange={addCollege} disabled={selectedColleges.length >= maxComparisons}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={
                  selectedColleges.length >= maxComparisons 
                    ? `Maximum ${maxComparisons} colleges` 
                    : "Add college to compare"
                } />
              </SelectTrigger>
              <SelectContent>
                {colleges
                  .filter(c => !selectedColleges.find(sc => sc.id === c.id))
                  .map(college => (
                    <SelectItem key={college.id} value={college.id}>
                      {college.name} - {college.city}, {college.state}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>

          {/* Selected Colleges */}
          <div className="flex gap-2 flex-wrap">
            {selectedColleges.map(college => (
              <Badge key={college.id} variant="secondary" className="px-3 py-1">
                {college.name}
                <button
                  onClick={() => removeCollege(college.id)}
                  className="ml-2 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        {selectedColleges.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Metric</th>
                  {selectedColleges.map(college => (
                    <th key={college.id} className="text-left p-2 font-medium">
                      {college.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Basic Info */}
                <tr className="border-b bg-gray-50 dark:bg-gray-900">
                  <td colSpan={selectedColleges.length + 1} className="p-2 font-semibold">
                    Basic Information
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Location</td>
                  {selectedColleges.map(college => (
                    <td key={college.id} className="p-2">
                      {college.city}, {college.state}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2">Type</td>
                  {selectedColleges.map(college => (
                    <td key={college.id} className="p-2">{college.type || 'N/A'}</td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2">Size</td>
                  {selectedColleges.map(college => (
                    <td key={college.id} className="p-2">{college.size || 'N/A'}</td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2">Setting</td>
                  {selectedColleges.map(college => (
                    <td key={college.id} className="p-2">{college.setting || 'N/A'}</td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2">Ranking</td>
                  {selectedColleges.map(college => (
                    <td key={college.id} className={`p-2 font-medium ${
                      college.ranking ? getComparisonColor(
                        college.ranking,
                        selectedColleges.map(c => c.ranking).filter(Boolean) as number[],
                        false
                      ) : ''
                    }`}>
                      {college.ranking ? `#${college.ranking}` : 'N/A'}
                    </td>
                  ))}
                </tr>

                {/* Admissions */}
                <tr className="border-b bg-gray-50 dark:bg-gray-900">
                  <td colSpan={selectedColleges.length + 1} className="p-2 font-semibold">
                    Admissions
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Acceptance Rate</td>
                  {selectedColleges.map(college => {
                    const rate = typeof college.admissionRate === 'number' ? college.admissionRate : null
                    return (
                      <td key={college.id} className={`p-2 font-medium ${
                        rate ? getComparisonColor(
                          rate,
                          selectedColleges.map(c => typeof c.admissionRate === 'number' ? c.admissionRate : null).filter(Boolean) as number[],
                          true
                        ) : ''
                      }`}>
                        {getAcceptanceRate(college.admissionRate)}
                      </td>
                    )
                  })}
                </tr>
                <tr className="border-b">
                  <td className="p-2">SAT Range</td>
                  {selectedColleges.map(college => (
                    <td key={college.id} className="p-2">
                      {college.satTotalLow && college.satTotalHigh 
                        ? `${college.satTotalLow}-${college.satTotalHigh}` 
                        : 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2">ACT Range</td>
                  {selectedColleges.map(college => (
                    <td key={college.id} className="p-2">
                      {college.actCompositeLow && college.actCompositeHigh 
                        ? `${college.actCompositeLow}-${college.actCompositeHigh}` 
                        : 'N/A'}
                    </td>
                  ))}
                </tr>

                {/* Costs */}
                <tr className="border-b bg-gray-50 dark:bg-gray-900">
                  <td colSpan={selectedColleges.length + 1} className="p-2 font-semibold">
                    Costs & Financial Aid
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">In-State Tuition</td>
                  {selectedColleges.map(college => (
                    <td key={college.id} className={`p-2 ${
                      college.inStateTuition ? getComparisonColor(
                        college.inStateTuition,
                        selectedColleges.map(c => c.inStateTuition).filter(Boolean) as number[],
                        false
                      ) : ''
                    }`}>
                      {getComparisonValue(college.inStateTuition, 'currency')}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2">Out-of-State Tuition</td>
                  {selectedColleges.map(college => (
                    <td key={college.id} className={`p-2 ${
                      college.outStateTuition ? getComparisonColor(
                        college.outStateTuition,
                        selectedColleges.map(c => c.outStateTuition).filter(Boolean) as number[],
                        false
                      ) : ''
                    }`}>
                      {getComparisonValue(college.outStateTuition, 'currency')}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2">Total Enrollment</td>
                  {selectedColleges.map(college => (
                    <td key={college.id} className="p-2">
                      {getComparisonValue(college.totalEnrollment, 'number')}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Select colleges above to start comparing (up to {maxComparisons})
          </div>
        )}
      </CardContent>
    </Card>
  )
}