'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Calendar, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  AlertCircle,
  CheckCircle,
  XCircle,
  Bell,
  Laptop,
  X,
  GripVertical
} from 'lucide-react'
import {
  getNextSATDate,
  getUpcomingSATDates,
  getDaysUntil,
  getRegistrationStatus,
  formatTestDate,
  needsDeviceReminder,
  REGISTRATION_URL,
  SAT_DATES,
  type SATDate
} from '@/lib/satDates'
import { useDraggable, type Position } from '@/hooks/useDraggable'

export default function SATDatesWidget() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([])
  const [isHovering, setIsHovering] = useState(false)
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
  const pillRef = useRef<HTMLButtonElement>(null)
  
  const nextSAT = getNextSATDate()
  const upcomingDates = getUpcomingSATDates(8) // Get all upcoming dates
  
  // Initialize draggable functionality
  const {
    position,
    isDragging,
    nearestZone,
    elementRef,
    handlers,
    getPositionStyle,
    resetPosition
  } = useDraggable({
    defaultPosition: 'top-left',
    storageKey: 'sat-dates-widget-position'
  })
  
  // Helper function to get snap zone coordinates
  const getSnapZoneCoordinates = (pos: Position) => {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }
    
    let x = 0, y = 0
    
    // Calculate X position
    if (pos.includes('left')) {
      x = 20
    } else if (pos.includes('right')) {
      x = viewport.width - 20
    } else {
      x = viewport.width / 2
    }
    
    // Calculate Y position
    if (pos.includes('top')) {
      y = 20
    } else if (pos.includes('bottom')) {
      y = viewport.height - 20
    } else {
      y = viewport.height / 2
    }
    
    return { x, y }
  }
  
  // Helper function to get snap zone style
  const getSnapZoneStyle = (pos: Position): React.CSSProperties => {
    const coords = getSnapZoneCoordinates(pos)
    return {
      position: 'fixed' as const,
      left: coords.x,
      top: coords.y,
      transform: 'translate(-50%, -50%)',
      zIndex: 45
    }
  }
  
  useEffect(() => {
    // Check if we should show a notification
    if (nextSAT) {
      const status = getRegistrationStatus(nextSAT)
      const notificationKey = `${nextSAT.testDate.toISOString()}-${status.status}`
      
      // Show notification for certain statuses if not dismissed
      if (!dismissedNotifications.includes(notificationKey)) {
        if (status.status === 'closing' || needsDeviceReminder(nextSAT)) {
          setShowNotification(true)
        }
      }
    }
  }, [nextSAT, dismissedNotifications])
  
  if (!nextSAT) {
    return null // No upcoming SAT dates
  }
  
  const status = getRegistrationStatus(nextSAT)
  const daysUntilTest = getDaysUntil(nextSAT.testDate)
  
  const statusColors = {
    early: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    open: 'bg-green-500/20 text-green-400 border-green-500/30',
    closing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    late: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    closed: 'bg-red-500/20 text-red-400 border-red-500/30'
  }
  
  const pillStatusColors = {
    early: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    open: 'from-green-500/20 to-green-600/20 border-green-500/30',
    closing: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
    late: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
    closed: 'from-red-500/20 to-red-600/20 border-red-500/30'
  }
  
  const statusDotColors = {
    early: 'bg-blue-400',
    open: 'bg-green-400',
    closing: 'bg-yellow-400',
    late: 'bg-orange-400',
    closed: 'bg-red-400'
  }
  
  const dismissNotification = () => {
    if (nextSAT) {
      const notificationKey = `${nextSAT.testDate.toISOString()}-${status.status}`
      setDismissedNotifications([...dismissedNotifications, notificationKey])
      setShowNotification(false)
    }
  }
  
  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenuPos({ x: e.clientX, y: e.clientY })
    setShowContextMenu(true)
  }
  
  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false)
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showContextMenu])
  
  // Determine smart positioning for expanded widget
  const getExpandedPosition = (): React.CSSProperties => {
    const widgetWidth = 320 // w-80
    const widgetHeight = 400 // Approximate height
    
    let styles: React.CSSProperties = {
      position: 'fixed' as const,
      zIndex: 50
    }
    
    // Position based on where pill is located
    if (position.includes('left')) {
      styles.left = 20
    } else if (position.includes('right')) {
      styles.right = 20
    } else {
      // center - position to not overlap with pill
      styles.left = '50%'
      styles.transform = 'translateX(-50%)'
    }
    
    if (position.includes('top')) {
      styles.top = 80 // Below the pill
    } else if (position.includes('bottom')) {
      styles.bottom = 80 // Above the pill
    } else {
      // middle - position to not overlap
      styles.top = '50%'
      styles.transform = (styles.transform || '') + ' translateY(-50%)'
    }
    
    return styles
  }
  
  return (
    <>
      {/* Smart Notification Banner */}
      {showNotification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-[seasonal-float_3s_ease-in-out_infinite]">
          <div className="bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-lg px-6 py-3 flex items-center space-x-3 shadow-lg">
            <Bell className="h-5 w-5 text-yellow-400" />
            <div className="flex-1">
              {needsDeviceReminder(nextSAT) ? (
                <p className="text-sm text-white">
                  <strong>Device Request Deadline:</strong> Request a device from College Board by today for the {formatTestDate(nextSAT.testDate)} SAT
                </p>
              ) : status.status === 'closing' ? (
                <p className="text-sm text-white">
                  <strong>Registration Closing Soon:</strong> Only {status.daysUntilDeadline} days left to register for the {formatTestDate(nextSAT.testDate)} SAT
                </p>
              ) : null}
            </div>
            <button
              onClick={dismissNotification}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Visual feedback for dragging state */}
      {isDragging && (
        <div className="fixed inset-0 pointer-events-none z-40">
          {/* Show all snap positions as dots */}
          {(['top-left', 'top-center', 'top-right', 'left-middle', 'right-middle', 'bottom-left', 'bottom-center', 'bottom-right'] as Position[]).map((pos) => {
            const isActive = nearestZone === pos
            const coords = getSnapZoneCoordinates(pos)
            return (
              <div
                key={pos}
                className={`absolute w-3 h-3 rounded-full border-2 transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-500/50 border-blue-400 scale-150'
                    : 'bg-gray-500/20 border-gray-400/50'
                }`}
                style={{
                  left: coords.x - 6,
                  top: coords.y - 6,
                }}
              />
            )
          })}
        </div>
      )}
      
      {/* Ghost Preview at nearest snap zone */}
      {isDragging && nearestZone && (
        <div
          className="fixed pointer-events-none z-45"
          style={{
            ...getSnapZoneStyle(nearestZone),
            transition: 'all 0.2s ease-out'
          }}
        >
          <div className={`flex items-center space-x-3 px-4 py-2.5 bg-gradient-to-r ${pillStatusColors[status.status]} backdrop-blur-sm rounded-full border shadow-lg opacity-50 scale-95`}>
            <Calendar className="h-4 w-4 text-white" />
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-white">SAT in {daysUntilTest}d</span>
              <div className={`w-2 h-2 rounded-full ${statusDotColors[status.status]}`} />
            </div>
          </div>
        </div>
      )}
      
      {/* Context Menu */}
      {showContextMenu && (
        <div
          className="fixed bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 py-2 px-0 shadow-xl z-50"
          style={{
            left: contextMenuPos.x,
            top: contextMenuPos.y
          }}
        >
          <button
            onClick={() => {
              resetPosition()
              setShowContextMenu(false)
            }}
            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
          >
            Reset Position
          </button>
        </div>
      )}
      
      {/* Compact Time Pill */}
      {!isExpanded ? (
        <button
          ref={(el) => {
            pillRef.current = el
            if (elementRef) elementRef.current = el as any
          }}
          onClick={() => setIsExpanded(true)}
          onContextMenu={handleContextMenu}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          {...handlers}
          className={`fixed flex items-center space-x-3 px-4 py-2.5 bg-gradient-to-r ${pillStatusColors[status.status]} backdrop-blur-sm rounded-full border transition-all shadow-lg cursor-pointer select-none ${
            isDragging 
              ? 'opacity-80 scale-105 shadow-2xl cursor-grabbing' 
              : 'hover:scale-105 cursor-grab'
          }`}
          style={getPositionStyle()}
        >
          <Calendar className="h-4 w-4 text-white" />
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-white">SAT in {daysUntilTest}d</span>
            <div className={`w-2 h-2 rounded-full ${statusDotColors[status.status]} animate-pulse`} />
          </div>
          <div className="flex items-center space-x-1">
            <ChevronDown className="h-3 w-3 text-gray-400" />
            {(isHovering || isDragging) && (
              <GripVertical className="h-3 w-3 text-gray-400 opacity-70" />
            )}
          </div>
        </button>
      ) : (
        /* Expanded Widget */
        <div 
          className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden w-80 shadow-2xl"
          style={{
            ...getExpandedPosition(),
            animation: 'smooth-expand 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, smooth-fade-in 0.4s ease-out forwards'
          }}
        >
          {/* Header with Close Button */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">SAT Test Dates</h3>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Next Test Date */}
            <div className="mb-3">
              <p className="text-xl font-bold text-white">
                {formatTestDate(nextSAT.testDate)}
              </p>
              <p className="text-sm text-gray-400">
                in {daysUntilTest} day{daysUntilTest !== 1 ? 's' : ''}
              </p>
            </div>
            
            {/* Registration Status */}
            <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${statusColors[status.status]} mb-3`}>
              {status.status === 'early' && <Clock className="h-4 w-4" />}
              {status.status === 'open' && <CheckCircle className="h-4 w-4" />}
              {status.status === 'closing' && <AlertCircle className="h-4 w-4" />}
              {status.status === 'late' && <AlertCircle className="h-4 w-4" />}
              {status.status === 'closed' && <XCircle className="h-4 w-4" />}
              <span className="text-xs font-medium">{status.message}</span>
            </div>
            
            {/* Register Button */}
            {status.status !== 'closed' && (
              <a
                href={REGISTRATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium w-full"
              >
                <span>Register Now</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          
          {/* All Upcoming Dates */}
          <div className="p-4">
            <h4 className="text-xs font-semibold text-gray-400 mb-3">ALL 2025-2026 DATES</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
              {upcomingDates.map((date, index) => {
                const dateStatus = getRegistrationStatus(date)
                const daysUntil = getDaysUntil(date.testDate)
                const isNext = index === 0
                
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2.5 rounded-lg transition-colors ${
                      isNext ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-gray-800/30 hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {date.testDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {daysUntil} days
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`text-xs px-2 py-0.5 rounded-full ${statusColors[dateStatus.status]}`}>
                        {dateStatus.status === 'early' ? 'Soon' :
                         dateStatus.status === 'open' ? 'Open' :
                         dateStatus.status === 'closing' ? `${dateStatus.daysUntilDeadline}d left` :
                         dateStatus.status === 'late' ? 'Late' : 'Closed'}
                      </div>
                      {dateStatus.status !== 'closed' && (
                        <a
                          href={REGISTRATION_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Important Notes */}
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="space-y-1">
                <div className="flex items-start space-x-2">
                  <Laptop className="h-3 w-3 text-gray-400 mt-0.5" />
                  <p className="text-xs text-gray-400">
                    Device requests: 30+ days before test
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-3 w-3 text-orange-400 mt-0.5" />
                  <p className="text-xs text-gray-400">
                    Late registration has additional fees
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}