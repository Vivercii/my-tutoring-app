'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { 
  X, 
  Send, 
  Paperclip, 
  Search,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  ChevronLeft,
  Phone,
  Video,
  Info
} from 'lucide-react'

interface Message {
  id: string
  senderId: string
  senderEmail: string
  senderName: string
  senderRole: string
  content: string
  createdAt: string
  isRead: boolean
  isReadByInstructor: boolean
  isReadByCoordinator: boolean
}

interface MessagingSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function MessagingSidebar({ isOpen, onClose }: MessagingSidebarProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [recipientInfo, setRecipientInfo] = useState<{name: string, role: string} | null>(null)

  // Fetch messages
  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/messages')
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
        
        // Set recipient info based on first message or default
        if (data.messages.length > 0) {
          const firstMsg = data.messages[0]
          if (session?.user?.role === 'STUDENT') {
            setRecipientInfo({
              name: firstMsg.recipientName || 'Instructor',
              role: 'Instructor & Coordinator'
            })
          } else {
            setRecipientInfo({
              name: firstMsg.studentName,
              role: 'Student'
            })
          }
        } else if (session?.user?.role === 'STUDENT') {
          setRecipientInfo({
            name: 'Your Instructor',
            role: 'Instructor & Coordinator'
          })
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim()) return

    const messageToSend = newMessage
    setNewMessage('') // Clear immediately for better UX
    setSending(true)
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageToSend })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages([data.message, ...messages])
        scrollToBottom()
        
        // Log to console for debugging
        console.log('✉️ Message sent and saved to cloud:', data.message)
      } else {
        // Restore message if sending failed
        setNewMessage(messageToSend)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setNewMessage(messageToSend) // Restore on error
    } finally {
      setSending(false)
    }
  }

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Fetch messages on open
  useEffect(() => {
    if (isOpen) {
      fetchMessages()
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Auto-refresh messages every 10 seconds when open
  useEffect(() => {
    if (!isOpen) return
    
    const interval = setInterval(fetchMessages, 10000)
    return () => clearInterval(interval)
  }, [isOpen])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Format timestamp
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    } else if (days === 1) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  // Handle keyboard shortcuts
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 right-0 h-full bg-white shadow-2xl z-50 
        transition-transform duration-300 ease-in-out
        w-full sm:w-96 lg:w-[400px]
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-white border-b px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              
              <h3 className="font-semibold text-gray-900 flex-1 lg:ml-0 ml-2">
                Messages
              </h3>
              
              <div className="flex items-center space-x-1">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Phone className="h-4 w-4 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Video className="h-4 w-4 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Info className="h-4 w-4 text-gray-600" />
                </button>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden lg:block"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
            
            {/* Recipient info */}
            {recipientInfo && (
              <div className="flex items-center space-x-3 py-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {recipientInfo.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{recipientInfo.name}</p>
                  <p className="text-xs text-gray-500">{recipientInfo.role}</p>
                </div>
              </div>
            )}
          </div>

          {/* Info banner for students */}
          {session?.user?.role === 'STUDENT' && (
            <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
              <p className="text-xs text-blue-700 flex items-center">
                <Info className="h-3 w-3 mr-1" />
                Your messages are visible to your instructor and program coordinator
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Send className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">No messages yet</p>
                <p className="text-gray-400 text-xs mt-1">Start a conversation with your instructor</p>
              </div>
            ) : (
              <>
                {/* Group messages by date */}
                {messages.map((message, index) => {
                  const isOwn = message.senderEmail === session?.user?.email
                  const showDate = index === 0 || 
                    new Date(message.createdAt).toDateString() !== 
                    new Date(messages[index - 1].createdAt).toDateString()
                  
                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="flex items-center justify-center my-4">
                          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                            {new Date(message.createdAt).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      )}
                      
                      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] ${isOwn ? 'order-2' : 'order-1'}`}>
                          <div className="flex items-end space-x-2">
                            {!isOwn && (
                              <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                {message.senderName.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1">
                              {!isOwn && (
                                <p className="text-xs text-gray-500 mb-1 ml-1">
                                  {message.senderName}
                                  {message.senderRole === 'TUTOR' && 
                                    <span className="text-blue-500 ml-1">• Instructor</span>
                                  }
                                  {message.senderRole === 'PARENT' && message.senderEmail.includes('admin') && 
                                    <span className="text-purple-500 ml-1">• Coordinator</span>
                                  }
                                </p>
                              )}
                              <div
                                className={`rounded-2xl px-4 py-2 ${
                                  isOwn
                                    ? 'bg-blue-500 text-white rounded-br-sm'
                                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                              </div>
                              <div className="flex items-center space-x-1 mt-1 ml-1">
                                <span className="text-xs text-gray-400">
                                  {formatTime(message.createdAt)}
                                </span>
                                {isOwn && (
                                  <span className="text-xs text-gray-400">
                                    {message.isReadByInstructor && message.isReadByCoordinator ? (
                                      <CheckCheck className="h-3 w-3 text-blue-400 inline" />
                                    ) : message.isReadByInstructor || message.isReadByCoordinator ? (
                                      <Check className="h-3 w-3 text-gray-400 inline" />
                                    ) : (
                                      <Clock className="h-3 w-3 text-gray-400 inline" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t bg-white px-4 py-3">
            <div className="flex items-end space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors mb-1">
                <Paperclip className="h-5 w-5 text-gray-500" />
              </button>
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  className="w-full px-3 py-2 bg-gray-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px] max-h-32"
                  disabled={sending}
                  rows={1}
                  style={{ 
                    height: 'auto',
                    overflowY: newMessage.split('\n').length > 3 ? 'auto' : 'hidden' 
                  }}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-1"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              Messages are saved to the cloud automatically
            </p>
          </div>
        </div>
      </div>
    </>
  )
}