import { useState, useEffect, useRef, useCallback } from 'react'

export type Position = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right'
  | 'left-middle' 
  | 'right-middle'
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right'

interface DragState {
  isDragging: boolean
  currentX: number
  currentY: number
  startX: number
  startY: number
}

interface UseDraggableOptions {
  defaultPosition?: Position
  onPositionChange?: (position: Position) => void
  magneticRange?: number
  storageKey?: string
}

const POSITION_OFFSETS = {
  'top-left': { x: 20, y: 20 },
  'top-center': { x: '50%', y: 20 },
  'top-right': { x: -20, y: 20 },
  'left-middle': { x: 20, y: '50%' },
  'right-middle': { x: -20, y: '50%' },
  'bottom-left': { x: 20, y: -20 },
  'bottom-center': { x: '50%', y: -20 },
  'bottom-right': { x: -20, y: -20 },
}

export function useDraggable({
  defaultPosition = 'top-left',
  onPositionChange,
  magneticRange = 100,
  storageKey = 'sat-widget-position'
}: UseDraggableOptions = {}) {
  // Initialize position from localStorage if available
  const getInitialPosition = (): Position => {
    if (typeof window === 'undefined') return defaultPosition
    
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const data = JSON.parse(saved)
        if (data.position && typeof data.position === 'string') {
          return data.position as Position
        }
      }
    } catch (e) {
      console.error('Failed to load saved position', e)
    }
    return defaultPosition
  }
  
  const [position, setPosition] = useState<Position>(getInitialPosition)
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    currentX: 0,
    currentY: 0,
    startX: 0,
    startY: 0
  })
  const [nearestZone, setNearestZone] = useState<Position | null>(null)
  const elementRef = useRef<HTMLDivElement>(null)
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Save position to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          position,
          lastModified: Date.now()
        }))
        console.log('Saved position:', position, 'to', storageKey)
      } catch (e) {
        console.error('Failed to save position', e)
      }
    }
    onPositionChange?.(position)
  }, [position, storageKey, onPositionChange])

  // Calculate position coordinates
  const getPositionCoordinates = useCallback((pos: Position) => {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }
    
    const offset = POSITION_OFFSETS[pos]
    let x = 0, y = 0
    
    // Calculate X position
    if (offset.x === '50%') {
      x = viewport.width / 2
    } else if (typeof offset.x === 'number' && offset.x < 0) {
      x = viewport.width + offset.x
    } else {
      x = offset.x as number
    }
    
    // Calculate Y position
    if (offset.y === '50%') {
      y = viewport.height / 2
    } else if (typeof offset.y === 'number' && offset.y < 0) {
      y = viewport.height + offset.y
    } else {
      y = offset.y as number
    }
    
    return { x, y }
  }, [])

  // Find nearest snap zone
  const findNearestZone = useCallback((x: number, y: number): Position | null => {
    let nearest: Position | null = null
    let minDistance = magneticRange
    
    Object.keys(POSITION_OFFSETS).forEach((pos) => {
      const coords = getPositionCoordinates(pos as Position)
      const distance = Math.sqrt(
        Math.pow(x - coords.x, 2) + Math.pow(y - coords.y, 2)
      )
      
      if (distance < minDistance) {
        minDistance = distance
        nearest = pos as Position
      }
    })
    
    return nearest
  }, [magneticRange, getPositionCoordinates])

  // Handle drag start
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    setDragState({
      isDragging: true,
      currentX: clientX,
      currentY: clientY,
      startX: clientX,
      startY: clientY
    })
  }, [])

  // Handle drag move
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!dragState.isDragging) return
    
    setDragState(prev => ({
      ...prev,
      currentX: clientX,
      currentY: clientY
    }))
    
    // Find nearest snap zone
    const nearest = findNearestZone(clientX, clientY)
    setNearestZone(nearest)
  }, [dragState.isDragging, findNearestZone])

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!dragState.isDragging) return
    
    // Snap to nearest zone if within range
    if (nearestZone) {
      console.log('Snapping to position:', nearestZone)
      setPosition(nearestZone)
    }
    
    setDragState({
      isDragging: false,
      currentX: 0,
      currentY: 0,
      startX: 0,
      startY: 0
    })
    setNearestZone(null)
  }, [dragState.isDragging, nearestZone])

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    // Start drag timer for desktop (click and hold)
    dragTimeoutRef.current = setTimeout(() => {
      handleDragStart(e.clientX, e.clientY)
    }, 300)
  }, [handleDragStart])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleDragMove(e.clientX, e.clientY)
  }, [handleDragMove])

  const handleMouseUp = useCallback(() => {
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
    }
    handleDragEnd()
  }, [handleDragEnd])

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    
    // Start long press timer for mobile
    longPressTimerRef.current = setTimeout(() => {
      handleDragStart(touch.clientX, touch.clientY)
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 500)
  }, [handleDragStart])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!dragState.isDragging) {
      // Cancel long press if moved before timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
      return
    }
    
    e.preventDefault()
    const touch = e.touches[0]
    handleDragMove(touch.clientX, touch.clientY)
  }, [dragState.isDragging, handleDragMove])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
    }
    handleDragEnd()
  }, [handleDragEnd])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const positions: Position[] = [
      'top-left', 'top-center', 'top-right',
      'left-middle', 'right-middle',
      'bottom-left', 'bottom-center', 'bottom-right'
    ]
    
    const currentIndex = positions.indexOf(position)
    let newIndex = currentIndex
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        if (currentIndex >= 3) newIndex -= 3
        else if (currentIndex === 3) newIndex = 0 // left-middle to top-left
        else if (currentIndex === 4) newIndex = 2 // right-middle to top-right
        break
      case 'ArrowDown':
        e.preventDefault()
        if (currentIndex <= 4) newIndex += 3
        else if (currentIndex === 0) newIndex = 3 // top-left to left-middle
        else if (currentIndex === 2) newIndex = 4 // top-right to right-middle
        break
      case 'ArrowLeft':
        e.preventDefault()
        if ([1, 2, 4, 6, 7].includes(currentIndex)) newIndex--
        break
      case 'ArrowRight':
        e.preventDefault()
        if ([0, 1, 3, 5, 6].includes(currentIndex)) newIndex++
        break
      case 'r':
      case 'R':
        e.preventDefault()
        setPosition('top-left')
        return
      case 'Escape':
        e.preventDefault()
        if (dragState.isDragging) {
          handleDragEnd()
        }
        return
    }
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < positions.length) {
      setPosition(positions[newIndex])
    }
  }, [position, dragState.isDragging, handleDragEnd])

  // Set up global mouse/touch listeners when dragging
  useEffect(() => {
    if (dragState.isDragging) {
      // Mouse events
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      // Touch events
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
      
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'grabbing'
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
        document.body.style.userSelect = ''
        document.body.style.cursor = ''
      }
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  // Reset position function
  const resetPosition = useCallback(() => {
    setPosition(defaultPosition)
  }, [defaultPosition])

  // Get style for current position
  const getPositionStyle = useCallback(() => {
    if (dragState.isDragging) {
      // Follow cursor while dragging
      return {
        position: 'fixed' as const,
        left: dragState.currentX,
        top: dragState.currentY,
        transform: 'translate(-50%, -50%)',
        cursor: 'grabbing',
        zIndex: 9999
      }
    }
    
    // Snap to position
    const offset = POSITION_OFFSETS[position]
    const style: React.CSSProperties = {
      position: 'fixed',
      zIndex: 50,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
    
    // Set horizontal position
    if (position.includes('left')) {
      style.left = offset.x as number
    } else if (position.includes('right')) {
      style.right = Math.abs(offset.x as number)
    } else {
      style.left = '50%'
      style.transform = (style.transform || '') + ' translateX(-50%)'
    }
    
    // Set vertical position
    if (position.includes('top')) {
      style.top = offset.y as number
    } else if (position.includes('bottom')) {
      style.bottom = Math.abs(offset.y as number)
    } else {
      style.top = '50%'
      style.transform = (style.transform || '') + ' translateY(-50%)'
    }
    
    return style
  }, [dragState, position])

  return {
    position,
    isDragging: dragState.isDragging,
    nearestZone,
    elementRef,
    handlers: {
      onMouseDown: handleMouseDown,
      onTouchStart: handleTouchStart,
      onKeyDown: handleKeyDown,
      onDoubleClick: resetPosition
    },
    getPositionStyle,
    resetPosition,
    setPosition
  }
}