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
  Clock
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

interface MessagingModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function MessagingModal({ isOpen, onClose }: MessagingModalProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [recipientInfo, setRecipientInfo] = useState<{name: string, role: string} | null>(null)

  // Fetch messages
  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/messages')
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
        
        // Set recipient info based on first message
        if (data.messages.length > 0) {
          const firstMsg = data.messages[0]
          if (session?.user?.role === 'STUDENT') {
            setRecipientInfo({
              name: firstMsg.recipientName || 'Instructor',
              role: 'Instructor'
            })
          } else {
            setRecipientInfo({
              name: firstMsg.studentName,
              role: 'Student'
            })
          }
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

    setSending(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages([data.message, ...messages])
        setNewMessage('')
        scrollToBottom()
      }
    } catch (error) {
      console.error('Error sending message:', error)
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

  if (!isOpen) return null

  // Format timestamp
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-semibold">
              {recipientInfo?.name?.charAt(0) || 'T'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {session?.user?.role === 'STUDENT' ? 'Message Instructor' : recipientInfo?.name || 'Messages'}
              </h3>
              <p className="text-xs text-gray-500">
                {session?.user?.role === 'STUDENT' 
                  ? 'Your instructor and program coordinator can see this'
                  : recipientInfo?.role || 'Direct Message'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Search className="h-5 w-5 text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="h-5 w-5 text-gray-500" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No messages yet. Start a conversation!</p>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isOwn = message.senderEmail === session?.user?.email
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                      <div className="flex items-end space-x-2">
                        {!isOwn && (
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold">
                            {message.senderName.charAt(0)}
                          </div>
                        )}
                        <div>
                          {!isOwn && (
                            <p className="text-xs text-gray-500 mb-1">{message.senderName}</p>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              isOwn
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
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
                )
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Paperclip className="h-5 w-5 text-gray-500" />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Messages are visible to your instructor and program coordinator
          </p>
        </div>
      </div>
    </div>
  )
}