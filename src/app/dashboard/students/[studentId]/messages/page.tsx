'use client'

import { useState, useEffect, use, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Send,
  Paperclip,
  Search,
  Phone,
  Video,
  MoreVertical,
  User,
  Users,
  Bell,
  BellOff,
  Star,
  Archive,
  Trash2,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Smile,
  Image as ImageIcon,
  File,
  Download
} from 'lucide-react'

interface Message {
  id: string
  sender: {
    id: string
    name: string
    role: 'parent' | 'student' | 'tutor' | 'admin'
    avatar?: string
  }
  content: string
  timestamp: string
  read: boolean
  delivered: boolean
  attachments?: Array<{
    name: string
    size: string
    type: 'image' | 'document' | 'video'
    url: string
  }>
  replyTo?: string
}

interface Conversation {
  id: string
  participants: Array<{
    id: string
    name: string
    role: string
    avatar?: string
    online?: boolean
  }>
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  pinned: boolean
  muted: boolean
  type: 'direct' | 'group'
  subject?: string
}

interface Announcement {
  id: string
  title: string
  content: string
  author: string
  date: string
  priority: 'low' | 'medium' | 'high'
  read: boolean
}

export default function MessagesPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [activeTab, setActiveTab] = useState('messages')
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role === 'PARENT') {
      fetchConversations()
    }
  }, [status, session, studentId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversations = async () => {
    try {
      // Mock data - will be replaced with API calls
      const mockConversations: Conversation[] = [
        {
          id: '1',
          participants: [
            { id: '1', name: 'Kharis Yeboah', role: 'Tutor (Math)', online: true },
            { id: '2', name: 'You', role: 'Parent', online: true }
          ],
          lastMessage: 'Great progress on quadratic equations today!',
          lastMessageTime: '2:30 PM',
          unreadCount: 2,
          pinned: true,
          muted: false,
          type: 'direct',
          subject: 'Math Tutoring'
        },
        {
          id: '2',
          participants: [
            { id: '3', name: 'Ulises Gonzalez', role: 'Tutor (Reading)', online: false },
            { id: '2', name: 'You', role: 'Parent', online: true }
          ],
          lastMessage: 'Homework for next session attached',
          lastMessageTime: 'Yesterday',
          unreadCount: 0,
          pinned: false,
          muted: false,
          type: 'direct',
          subject: 'Reading & Writing'
        },
        {
          id: '3',
          participants: [
            { id: '4', name: 'Admin Team', role: 'Support', online: true },
            { id: '2', name: 'You', role: 'Parent', online: true }
          ],
          lastMessage: 'Your next billing cycle starts on Aug 1',
          lastMessageTime: 'Jul 10',
          unreadCount: 0,
          pinned: false,
          muted: true,
          type: 'direct',
          subject: 'Account Support'
        },
        {
          id: '4',
          participants: [
            { id: '1', name: 'Kharis Yeboah', role: 'Tutor', online: true },
            { id: '3', name: 'Ulises Gonzalez', role: 'Tutor', online: false },
            { id: '5', name: 'Nana Wiafe', role: 'Student', online: true },
            { id: '2', name: 'You', role: 'Parent', online: true }
          ],
          lastMessage: 'Nana: Looking forward to the mock test!',
          lastMessageTime: '3 days ago',
          unreadCount: 5,
          pinned: false,
          muted: false,
          type: 'group',
          subject: 'Nana\'s Study Group'
        }
      ]

      const mockMessages: Message[] = [
        {
          id: '1',
          sender: {
            id: '1',
            name: 'Kharis Yeboah',
            role: 'tutor'
          },
          content: 'Hi! Just wanted to update you on Nana\'s progress today.',
          timestamp: '2:00 PM',
          read: true,
          delivered: true
        },
        {
          id: '2',
          sender: {
            id: '1',
            name: 'Kharis Yeboah',
            role: 'tutor'
          },
          content: 'We covered quadratic equations and she\'s really getting the hang of factoring. She solved 15 problems independently with 93% accuracy!',
          timestamp: '2:01 PM',
          read: true,
          delivered: true
        },
        {
          id: '3',
          sender: {
            id: '2',
            name: 'You',
            role: 'parent'
          },
          content: 'That\'s wonderful to hear! She mentioned she was struggling with that topic last week.',
          timestamp: '2:15 PM',
          read: true,
          delivered: true
        },
        {
          id: '4',
          sender: {
            id: '1',
            name: 'Kharis Yeboah',
            role: 'tutor'
          },
          content: 'Yes, the breakthrough came when we used visual representations. I\'m attaching some practice problems for her to work on before our next session.',
          timestamp: '2:20 PM',
          read: true,
          delivered: true,
          attachments: [
            {
              name: 'Quadratic_Practice_Set.pdf',
              size: '1.2 MB',
              type: 'document',
              url: '#'
            }
          ]
        },
        {
          id: '5',
          sender: {
            id: '1',
            name: 'Kharis Yeboah',
            role: 'tutor'
          },
          content: 'Great progress on quadratic equations today!',
          timestamp: '2:30 PM',
          read: false,
          delivered: true
        }
      ]

      const mockAnnouncements: Announcement[] = [
        {
          id: '1',
          title: 'August SAT Registration Deadline',
          content: 'Registration for the August 23rd SAT closes on July 25th. Make sure to register early!',
          author: 'Admin Team',
          date: '2025-07-15',
          priority: 'high',
          read: false
        },
        {
          id: '2',
          title: 'New Practice Materials Available',
          content: 'We\'ve added 50 new practice questions for SAT Math in the resource center.',
          author: 'Academic Team',
          date: '2025-07-12',
          priority: 'medium',
          read: true
        },
        {
          id: '3',
          title: 'Schedule Change Notice',
          content: 'Due to the holiday, all sessions on July 4th will be rescheduled.',
          author: 'Admin Team',
          date: '2025-06-28',
          priority: 'low',
          read: true
        }
      ]

      setConversations(mockConversations)
      setMessages(mockMessages)
      setAnnouncements(mockAnnouncements)
      
      // Select first conversation by default
      if (mockConversations.length > 0) {
        setSelectedConversation(mockConversations[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: String(Date.now()),
      sender: {
        id: '2',
        name: 'You',
        role: 'parent'
      },
      content: newMessage,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      read: false,
      delivered: false
    }

    setMessages([...messages, message])
    setNewMessage('')
    
    // Simulate delivery
    setTimeout(() => {
      setMessages(prev => prev.map(m => 
        m.id === message.id ? { ...m, delivered: true } : m
      ))
    }, 500)

    // Simulate typing indicator
    setTimeout(() => {
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        // Simulate reply
        const reply: Message = {
          id: String(Date.now() + 1),
          sender: {
            id: '1',
            name: 'Kharis Yeboah',
            role: 'tutor'
          },
          content: 'Thanks for your message! I\'ll review this and get back to you shortly.',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          read: false,
          delivered: true
        }
        setMessages(prev => [...prev, reply])
      }, 2000)
    }, 1000)
  }

  const selectedConv = conversations.find(c => c.id === selectedConversation)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white">
        <div className="px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <Link
              href={`/dashboard/students/${studentId}`}
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Student Details
            </Link>
            
            <h1 className="text-2xl font-light">Messages & Communication</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'messages'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Messages
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
              activeTab === 'announcements'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Announcements
            {announcements.filter(a => !a.read).length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {announcements.filter(a => !a.read).length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'messages' ? (
          <div className="bg-white rounded-lg border border-gray-200 h-[600px] flex">
            {/* Conversations List */}
            <div className="w-80 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                      selectedConversation === conv.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {conv.pinned && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                        <h4 className="font-medium text-gray-900 text-sm">
                          {conv.type === 'group' 
                            ? conv.subject 
                            : conv.participants.find(p => p.name !== 'You')?.name}
                        </h4>
                        {conv.muted && <BellOff className="h-3 w-3 text-gray-400" />}
                      </div>
                      <span className="text-xs text-gray-700">{conv.lastMessageTime}</span>
                    </div>
                    <p className="text-sm text-gray-700 truncate">{conv.lastMessage}</p>
                    {conv.unreadCount > 0 && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              {selectedConv && (
                <>
                  {/* Conversation Header */}
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        {selectedConv.type === 'group' ? (
                          <Users className="h-5 w-5 text-white" />
                        ) : (
                          <User className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {selectedConv.type === 'group' 
                            ? selectedConv.subject 
                            : selectedConv.participants.find(p => p.name !== 'You')?.name}
                        </h3>
                        <p className="text-xs text-gray-700">
                          {selectedConv.type === 'group'
                            ? `${selectedConv.participants.length} participants`
                            : selectedConv.participants.find(p => p.name !== 'You')?.role}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Phone className="h-4 w-4 text-gray-700" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Video className="h-4 w-4 text-gray-700" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <MoreVertical className="h-4 w-4 text-gray-700" />
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender.name === 'You' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-md ${message.sender.name === 'You' ? 'order-2' : ''}`}>
                          {message.sender.name !== 'You' && (
                            <p className="text-xs text-gray-700 mb-1">{message.sender.name}</p>
                          )}
                          <div className={`rounded-lg px-4 py-2 ${
                            message.sender.name === 'You' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            
                            {message.attachments && (
                              <div className="mt-2 space-y-2">
                                {message.attachments.map((attachment, i) => (
                                  <div key={i} className={`flex items-center gap-2 p-2 rounded ${
                                    message.sender.name === 'You' ? 'bg-blue-700' : 'bg-gray-200'
                                  }`}>
                                    <File className="h-4 w-4" />
                                    <span className="text-xs flex-1">{attachment.name}</span>
                                    <Download className="h-3 w-3 cursor-pointer" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-700">{message.timestamp}</span>
                            {message.sender.name === 'You' && (
                              <>
                                {message.delivered && message.read ? (
                                  <CheckCheck className="h-3 w-3 text-blue-600" />
                                ) : message.delivered ? (
                                  <CheckCheck className="h-3 w-3 text-gray-400" />
                                ) : (
                                  <Check className="h-3 w-3 text-gray-400" />
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isTyping && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-xs">typing...</span>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Paperclip className="h-4 w-4 text-gray-700" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <ImageIcon className="h-4 w-4 text-gray-700" />
                      </button>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Smile className="h-4 w-4 text-gray-700" />
                      </button>
                      <button
                        onClick={handleSendMessage}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          // Announcements Tab
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`bg-white rounded-lg border p-6 ${
                  !announcement.read ? 'border-blue-500' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      announcement.priority === 'high' ? 'bg-red-500' :
                      announcement.priority === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                    <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                    {!announcement.read && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">New</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-700">{new Date(announcement.date).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-700 mb-2">{announcement.content}</p>
                <p className="text-sm text-gray-700">— {announcement.author}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}