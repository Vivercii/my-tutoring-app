'use client'

import React from 'react'
import {
  Users, Home, GraduationCap, BookOpen, AlertCircle, Eye, ChevronDown, ChevronUp,
  Edit, UserCog, UserX, UserCheck, ShieldOff, ShieldCheck, Shield
} from 'lucide-react'

interface UserTableRowProps {
  user: any
  activeTab: 'parents' | 'students' | 'tutors' | 'staff'
  expandedUserId: string | null
  setExpandedUserId: (id: string | null) => void
  setSelectedUser: (user: any) => void
  startEditUser: (user: any) => void
  openAssignTutorModal: (user: any) => void
  handleToggleActive: (id: string, isActive: boolean) => void
  handleToggleAdmin: (id: string, isAdmin: boolean) => void
  actionLoading: string | null
  session: any
  formatDate: (date: string | null) => string
}

export function UserTableRow({
  user,
  activeTab,
  expandedUserId,
  setExpandedUserId,
  setSelectedUser,
  startEditUser,
  openAssignTutorModal,
  handleToggleActive,
  handleToggleAdmin,
  actionLoading,
  session,
  formatDate
}: UserTableRowProps) {
  
  const renderStudentRow = () => (
    <>
      {/* User Info */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-white">
            {user.name || 'Unnamed Student'}
          </div>
          <div className="text-sm text-gray-400">{user.email}</div>
          {user.inviteKey && (
            <div className="text-xs text-gray-500 font-mono mt-1">
              {user.inviteKey}
            </div>
          )}
        </div>
      </td>
      
      {/* Program */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-2 py-1 text-xs bg-purple-900/50 text-purple-300 rounded">
          {user.studentProfile?.program?.replace('_', ' ') || 'Not Set'}
        </span>
      </td>
      
      {/* Linked Parents */}
      <td className="px-6 py-4">
        {user.studentProfile?.parents?.length > 0 ? (
          <div className="space-y-1">
            {user.studentProfile.parents.map((parent: any, idx: number) => (
              <div key={idx} className="flex items-center space-x-2">
                <Home className="h-3 w-3 text-blue-400" />
                <span className="text-sm text-white">
                  {parent.parent?.name || 'Unknown'}
                </span>
                {parent.isPrimary && (
                  <span className="text-xs px-1 py-0.5 bg-green-900/50 text-green-300 rounded">
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <span className="text-gray-500 text-sm">No parent linked</span>
        )}
      </td>
      
      {/* Assigned Tutors */}
      <td className="px-6 py-4">
        {user.assignedTutors?.length > 0 ? (
          <div className="space-y-1">
            {user.assignedTutors.map((tutor: any, idx: number) => (
              <div key={idx} className="flex items-center space-x-2">
                <GraduationCap className="h-3 w-3 text-yellow-400" />
                <span className="text-sm text-white">
                  {tutor.tutor.name || 'Unknown'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-3 w-3 text-gray-500" />
            <span className="text-sm text-gray-500">No tutor assigned</span>
          </div>
        )}
      </td>
    </>
  )
  
  const renderParentRow = () => (
    <>
      {/* User Info */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-white">
            {user.name || 'Unnamed Parent'}
          </div>
          <div className="text-sm text-gray-400">{user.email}</div>
        </div>
      </td>
      
      {/* Students */}
      <td className="px-6 py-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-white">
              {user.studentCount} {user.studentCount === 1 ? 'Student' : 'Students'}
            </span>
          </div>
          {user.studentCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpandedUserId(expandedUserId === user.id ? null : user.id)
              }}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center mt-1"
            >
              <Eye className="h-3 w-3 mr-1" />
              View Details
              {expandedUserId === user.id ? (
                <ChevronUp className="h-3 w-3 ml-1" />
              ) : (
                <ChevronDown className="h-3 w-3 ml-1" />
              )}
            </button>
          )}
        </div>
      </td>
      
      {/* Last Login */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-400">
          {formatDate(user.lastLoginAt)}
        </div>
      </td>
    </>
  )
  
  const renderTutorRow = () => (
    <>
      {/* User Info */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-white">
            {user.name || 'Unnamed Tutor'}
          </div>
          <div className="text-sm text-gray-400">{user.email}</div>
        </div>
      </td>
      
      {/* Students Assigned */}
      <td className="px-6 py-4">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-white">
              {user.taughtStudentsCount || 0} {user.taughtStudentsCount === 1 ? 'Student' : 'Students'}
            </span>
          </div>
          {user.taughtStudentsCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpandedUserId(expandedUserId === user.id ? null : user.id)
              }}
              className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center mt-1"
            >
              <Eye className="h-3 w-3 mr-1" />
              View Students
              {expandedUserId === user.id ? (
                <ChevronUp className="h-3 w-3 ml-1" />
              ) : (
                <ChevronDown className="h-3 w-3 ml-1" />
              )}
            </button>
          )}
        </div>
      </td>
      
      {/* Last Login */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-400">
          {formatDate(user.lastLoginAt)}
        </div>
      </td>
    </>
  )
  
  const renderStaffRow = () => (
    <>
      {/* User Info */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-white">
            {user.name || 'Unnamed Staff'}
          </div>
          <div className="text-sm text-gray-400">{user.email}</div>
        </div>
      </td>
      
      {/* Role */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          {user.isAdmin ? (
            <>
              <Shield className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-purple-300">Administrator</span>
            </>
          ) : user.role === 'PROGRAM_COORDINATOR' ? (
            <span className="text-sm text-orange-300">Program Coordinator</span>
          ) : (
            <span className="text-sm text-gray-400">{user.role}</span>
          )}
        </div>
      </td>
      
      {/* Last Login */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-400">
          {formatDate(user.lastLoginAt)}
        </div>
      </td>
    </>
  )
  
  return (
    <tr 
      className="hover:bg-gray-700/50 transition-colors cursor-pointer"
      onClick={() => setSelectedUser(user)}
    >
      {activeTab === 'students' && renderStudentRow()}
      {activeTab === 'parents' && renderParentRow()}
      {activeTab === 'tutors' && renderTutorRow()}
      {activeTab === 'staff' && renderStaffRow()}
      
      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          user.isActive 
            ? 'bg-green-900/50 text-green-300' 
            : 'bg-red-900/50 text-red-300'
        }`}>
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      
      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              startEditUser(user)
            }}
            className="p-1.5 rounded text-blue-400 hover:bg-blue-900/50 transition-colors"
            title="Edit User"
          >
            <Edit className="h-4 w-4" />
          </button>
          {activeTab === 'students' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                openAssignTutorModal(user)
              }}
              className="p-1.5 rounded text-yellow-400 hover:bg-yellow-900/50 transition-colors"
              title="Assign Tutor"
            >
              <UserCog className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleToggleActive(user.id, user.isActive)
            }}
            disabled={actionLoading === user.id}
            className={`p-1.5 rounded transition-colors ${
              user.isActive 
                ? 'text-red-400 hover:bg-red-900/50' 
                : 'text-green-400 hover:bg-green-900/50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={user.isActive ? 'Deactivate' : 'Activate'}
          >
            {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          </button>
          {activeTab === 'staff' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleToggleAdmin(user.id, user.isAdmin)
              }}
              disabled={actionLoading === user.id || user.id === session?.user?.id}
              className={`p-1.5 rounded transition-colors ${
                user.isAdmin 
                  ? 'text-purple-400 hover:bg-purple-900/50' 
                  : 'text-gray-400 hover:bg-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={user.isAdmin ? 'Remove Admin' : 'Make Admin'}
            >
              {user.isAdmin ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}