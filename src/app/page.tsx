"use client";
import { useState, useEffect, useMemo } from 'react';
import Image from "next/image";

// Mock Database - Comprehensive Student and Platform Data
const mockDatabase = {
  currentStudent: {
    id: "STU-8416",
    name: "Alex Johnson",
    email: "alex.johnson@email.com",
    avatar: "/api/placeholder/150/150",
    phone: "(555) 123-4567",
    joinDate: "2024-09-15",
    grade: "11th Grade",
    school: "Lincoln High School",
    parentName: "Sarah Johnson",
    parentEmail: "sarah.johnson@email.com",
    parentPhone: "(555) 123-4568",
    profileComplete: 87,
    balance: 680, // minutes
    totalSpent: 2450,
    sessionsCompleted: 24,
    profileViews: 1847,
    averageRating: 4.8,
    streak: 12, // days
    timezone: "EST",
    preferences: {
      subjects: ["Python", "JavaScript", "React", "Data Science"],
      sessionLength: 60,
      preferredTimes: ["4:00 PM", "5:00 PM", "6:00 PM"],
      learningStyle: "Visual"
    }
  },

  tutors: [
    {
      id: "TUT-001",
      name: "Dr. Emily Chen",
      avatar: "/api/placeholder/100/100",
      specialties: ["Python", "Machine Learning", "Data Science"],
      rating: 4.9,
      sessions: 847,
      hourlyRate: 85,
      bio: "PhD in Computer Science with 8 years of industry experience at Google and Meta.",
      availability: ["Mon", "Wed", "Fri"],
      nextAvailable: "Today at 3:00 PM"
    },
    {
      id: "TUT-002",
      name: "Marcus Williams",
      avatar: "/api/placeholder/100/100",
      specialties: ["JavaScript", "React", "Node.js"],
      rating: 4.8,
      sessions: 623,
      hourlyRate: 75,
      bio: "Senior Full-Stack Developer with expertise in modern web technologies.",
      availability: ["Tue", "Thu", "Sat"],
      nextAvailable: "Tomorrow at 4:00 PM"
    },
    {
      id: "TUT-003",
      name: "Sofia Rodriguez",
      avatar: "/api/placeholder/100/100",
      specialties: ["Java", "Algorithms", "Computer Science"],
      rating: 4.9,
      sessions: 534,
      hourlyRate: 80,
      bio: "Computer Science professor and competitive programming coach.",
      availability: ["Mon", "Wed", "Fri", "Sun"],
      nextAvailable: "Today at 6:00 PM"
    }
  ],

  sessions: [
    {
      id: "SES-001",
      tutorId: "TUT-001",
      tutorName: "Dr. Emily Chen",
      subject: "Python Fundamentals",
      topic: "Object-Oriented Programming",
      date: "2025-07-31",
      time: "4:30 PM",
      duration: 60,
      status: "scheduled",
      type: "video",
      price: 85,
      notes: "Focus on inheritance and polymorphism concepts"
    },
    {
      id: "SES-002",
      tutorId: "TUT-002",
      tutorName: "Marcus Williams",
      subject: "React Development",
      topic: "State Management with Redux",
      date: "2025-08-02",
      time: "5:00 PM",
      duration: 90,
      status: "scheduled",
      type: "video",
      price: 112.50,
      notes: "Building a shopping cart application"
    },
    {
      id: "SES-003",
      tutorId: "TUT-001",
      tutorName: "Dr. Emily Chen",
      subject: "Data Science",
      topic: "Pandas and Data Analysis",
      date: "2025-07-29",
      time: "3:00 PM",
      duration: 60,
      status: "completed",
      type: "video",
      price: 85,
      rating: 5,
      feedback: "Excellent session! Emily explained complex concepts very clearly."
    }
  ],

  notifications: [
    {
      id: "NOT-001",
      type: "session",
      title: "Session Reminder",
      message: "Your Python session with Dr. Emily Chen starts in 1 hour",
      time: "1 hour ago",
      read: false,
      priority: "high"
    },
    {
      id: "NOT-002",
      type: "payment",
      title: "Payment Processed",
      message: "Your payment of $85 for the last session has been processed",
      time: "3 hours ago",
      read: false,
      priority: "medium"
    },
    {
      id: "NOT-003",
      type: "tutor",
      title: "New Message",
      message: "Marcus Williams sent you homework materials for tomorrow's session",
      time: "5 hours ago",
      read: true,
      priority: "medium"
    },
    {
      id: "NOT-004",
      type: "system",
      title: "Profile Update",
      message: "Complete your profile to unlock advanced matching features",
      time: "1 day ago",
      read: true,
      priority: "low"
    }
  ],

  messages: [
    {
      id: "MSG-001",
      from: "Dr. Emily Chen",
      fromId: "TUT-001",
      subject: "Pre-session Materials",
      message: "Hi Alex! I've prepared some Python exercises for our session tomorrow. Please review the attached notebook before we meet.",
      time: "2 hours ago",
      read: false,
      attachments: ["python_exercises.ipynb"]
    },
    {
      id: "MSG-002",
      from: "Marcus Williams",
      fromId: "TUT-002",
      subject: "React Project Update",
      message: "Great progress on your React project! I've added some additional resources to help with the Redux implementation.",
      time: "1 day ago",
      read: true,
      attachments: ["redux_guide.pdf", "example_code.zip"]
    }
  ],

  achievements: [
    {
      id: "ACH-001",
      title: "Python Pioneer",
      description: "Completed 10 Python sessions",
      icon: "🐍",
      unlocked: true,
      unlockedDate: "2025-07-20"
    },
    {
      id: "ACH-002",
      title: "Consistent Learner",
      description: "Maintained a 7-day learning streak",
      icon: "🔥",
      unlocked: true,
      unlockedDate: "2025-07-25"
    },
    {
      id: "ACH-003",
      title: "Code Master",
      description: "Complete 50 coding sessions",
      icon: "👑",
      unlocked: false,
      progress: 24,
      total: 50
    }
  ],

  learningPaths: [
    {
      id: "PATH-001",
      title: "Full-Stack Web Development",
      description: "Master front-end and back-end development",
      progress: 65,
      totalSessions: 20,
      completedSessions: 13,
      estimatedCompletion: "3 months",
      difficulty: "Intermediate",
      subjects: ["HTML/CSS", "JavaScript", "React", "Node.js", "Databases"]
    },
    {
      id: "PATH-002",
      title: "Data Science with Python",
      description: "Learn data analysis, visualization, and machine learning",
      progress: 35,
      totalSessions: 15,
      completedSessions: 5,
      estimatedCompletion: "4 months",
      difficulty: "Advanced",
      subjects: ["Python", "Pandas", "NumPy", "Matplotlib", "Scikit-learn"]
    }
  ],

  recentActivity: [
    {
      type: "session",
      description: "Completed Python session with Dr. Emily Chen",
      time: "2 hours ago",
      icon: "📚"
    },
    {
      type: "achievement",
      description: "Unlocked 'Consistent Learner' achievement",
      time: "1 day ago",
      icon: "🏆"
    },
    {
      type: "payment",
      description: "Added 300 minutes to account balance",
      time: "3 days ago",
      icon: "💳"
    }
  ]
};

// Utility functions for data processing
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled': return 'text-blue-600 bg-blue-100';
    case 'completed': return 'text-green-600 bg-green-100';
    case 'cancelled': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'border-l-red-500';
    case 'medium': return 'border-l-yellow-500';
    case 'low': return 'border-l-green-500';
    default: return 'border-l-gray-500';
  }
};

// Main Component
export default function Home() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [notifications, setNotifications] = useState(mockDatabase.notifications);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<string | null>(null);
  const [sessionFilter, setSessionFilter] = useState('all');

  const student = mockDatabase.currentStudent;
  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Filtered data based on search and filters
  const filteredTutors = useMemo(() => {
    return mockDatabase.tutors.filter(tutor =>
      tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.specialties.some(specialty =>
        specialty.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery]);

  const filteredSessions = useMemo(() => {
    let sessions = mockDatabase.sessions;
    if (sessionFilter !== 'all') {
      sessions = sessions.filter(session => session.status === sessionFilter);
    }
    return sessions;
  }, [sessionFilter]);

  // Notification handlers
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Dashboard Component
  const DashboardContent = () => (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome back, {student.name.split(' ')[0]}! 👋</h2>
            <p className="text-blue-100 text-lg">You have {filteredSessions.filter(s => s.status === 'scheduled').length} upcoming sessions</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{student.streak} days</div>
            <div className="text-blue-200">Learning streak 🔥</div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Session Balance</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{student.balance}</p>
              <p className="text-gray-500 text-xs">minutes remaining</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xl">⏱️</span>
            </div>
          </div>
          <button className="w-full mt-4 bg-green-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-green-700 transition-colors">
            Add More Time
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Sessions Completed</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{student.sessionsCompleted}</p>
              <p className="text-gray-500 text-xs">total sessions</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xl">📚</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Average Rating</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{student.averageRating}</p>
              <p className="text-gray-500 text-xs">out of 5.0</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 text-xl">⭐</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Spent</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{formatCurrency(student.totalSpent)}</p>
              <p className="text-gray-500 text-xs">lifetime</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 text-xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Sessions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Upcoming Sessions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {filteredSessions.filter(s => s.status === 'scheduled').map((session) => (
                <div key={session.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-xl">📚</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{session.subject}</h4>
                    <p className="text-sm text-gray-600">{session.topic}</p>
                    <p className="text-sm text-blue-600">with {session.tutorName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">{session.time}</p>
                    <p className="text-sm text-gray-500">{formatDate(session.date)}</p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Recent Activity & Achievements */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {mockDatabase.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm">
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {mockDatabase.achievements.map((achievement) => (
                  <div key={achievement.id} className={`flex items-center gap-3 p-3 rounded-lg ${achievement.unlocked ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{achievement.title}</h4>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                      {!achievement.unlocked && achievement.progress && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{width: `${(achievement.progress / achievement.total!) * 100}%`}}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{achievement.progress}/{achievement.total}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Sessions Component
  const SessionsContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Sessions</h2>
        <div className="flex gap-4">
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Sessions</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            Book New Session
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-900">Session</th>
                <th className="text-left p-4 font-semibold text-gray-900">Tutor</th>
                <th className="text-left p-4 font-semibold text-gray-900">Date & Time</th>
                <th className="text-left p-4 font-semibold text-gray-900">Duration</th>
                <th className="text-left p-4 font-semibold text-gray-900">Status</th>
                <th className="text-left p-4 font-semibold text-gray-900">Price</th>
                <th className="text-left p-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => (
                <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-gray-900">{session.subject}</div>
                      <div className="text-sm text-gray-500">{session.topic}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{session.tutorName}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{formatDate(session.date)}</div>
                    <div className="text-sm text-gray-500">{session.time}</div>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-900">{session.duration} min</span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-gray-900">{formatCurrency(session.price)}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {session.status === 'scheduled' && (
                        <>
                          <button className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors">
                            Join
                          </button>
                          <button className="px-3 py-1 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300 transition-colors">
                            Reschedule
                          </button>
                        </>
                      )}
                      {session.status === 'completed' && (
                        <button className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors">
                          Review
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Tutors Component
  const TutorsContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Find Tutors</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search tutors or subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTutors.map((tutor) => (
          <div key={tutor.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-xl font-bold">
                    {tutor.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{tutor.name}</h3>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">⭐</span>
                    <span className="text-sm font-medium text-gray-700">{tutor.rating}</span>
                    <span className="text-sm text-gray-500">({tutor.sessions} sessions)</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{tutor.bio}</p>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Specialties</h4>
                <div className="flex flex-wrap gap-2">
                  {tutor.specialties.map((specialty, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(tutor.hourlyRate)}</span>
                  <span className="text-sm text-gray-500">/hour</span>
                </div>
                <div className="text-sm text-green-600">
                  {tutor.nextAvailable}
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  Book Session
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  Message
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Messages Component
  const MessagesContent = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Messages</h2>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="divide-y divide-gray-200">
          {mockDatabase.messages.map((message) => (
            <div key={message.id} className={`p-6 hover:bg-gray-50 cursor-pointer ${!message.read ? 'bg-blue-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">
                        {message.from.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{message.from}</h3>
                      <p className="text-sm text-gray-500">{message.time}</p>
                    </div>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">{message.subject}</h4>
                  <p className="text-gray-700 text-sm">{message.message}</p>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-900 mb-2">Attachments:</p>
                      <div className="flex flex-wrap gap-2">
                        {message.attachments.map((attachment, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            📎 {attachment}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors">
                    Reply
                  </button>
                  {!message.read && (
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Profile Component
  const ProfileContent = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  defaultValue={student.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  defaultValue={student.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  defaultValue={student.phone}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                <select defaultValue={student.grade} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="11th Grade">11th Grade</option>
                  <option value="12th Grade">12th Grade</option>
                  <option value="College Freshman">College Freshman</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                <input
                  type="text"
                  defaultValue={student.school}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select defaultValue={student.timezone} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="EST">Eastern Time</option>
                  <option value="CST">Central Time</option>
                  <option value="MST">Mountain Time</option>
                  <option value="PST">Pacific Time</option>
                </select>
              </div>
            </div>
            <button className="mt-6 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              Save Changes
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Preferences</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Subjects</label>
                <div className="flex flex-wrap gap-2">
                  {student.preferences.subjects.map((subject, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                      {subject}
                      <button className="ml-2 text-blue-600 hover:text-blue-800">×</button>
                    </span>
                  ))}
                  <button className="px-3 py-1 border border-gray-300 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-50">
                    + Add Subject
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Session Length</label>
                <select defaultValue={student.preferences.sessionLength} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="30">30 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                  <option value="120">120 minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Learning Style</label>
                <select defaultValue={student.preferences.learningStyle} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="Visual">Visual</option>
                  <option value="Auditory">Auditory</option>
                  <option value="Kinesthetic">Kinesthetic</option>
                  <option value="Reading/Writing">Reading/Writing</option>
                </select>
              </div>
            </div>
            <button className="mt-6 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              Update Preferences
            </button>
          </div>
        </div>

        {/* Profile Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-blue-600 text-2xl font-bold">
                {student.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <h3 className="font-semibold text-lg text-gray-900 mb-1">{student.name}</h3>
            <p className="text-gray-500 text-sm mb-4">Student ID: {student.id}</p>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Profile Complete</span>
                <span>{student.profileComplete}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{width: `${student.profileComplete}%`}}
                ></div>
              </div>
            </div>
            <button className="w-full bg-gray-100 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-200 transition-colors">
              Upload Photo
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Member Since</span>
                <span className="font-medium">{formatDate(student.joinDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Sessions</span>
                <span className="font-medium">{student.sessionsCompleted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Rating</span>
                <span className="font-medium">{student.averageRating} ⭐</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Learning Streak</span>
                <span className="font-medium">{student.streak} days 🔥</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Settings Component
  const SettingsContent = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
            <div className="space-y-4">
              {[
                { label: "Email notifications for upcoming sessions", checked: true },
                { label: "SMS reminders 30 minutes before sessions", checked: true },
                { label: "Weekly progress reports", checked: false },
                { label: "New tutor recommendations", checked: true },
                { label: "Payment confirmations", checked: true }
              ].map((setting, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700">{setting.label}</span>
                  <input
                    type="checkbox"
                    defaultChecked={setting.checked}
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h3>
            <div className="space-y-4">
              {[
                { label: "Show my profile to tutors", checked: true },
                { label: "Allow tutors to message me directly", checked: true },
                { label: "Share my progress with parents", checked: false },
                { label: "Include me in platform statistics", checked: true }
              ].map((setting, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700">{setting.label}</span>
                  <input
                    type="checkbox"
                    defaultChecked={setting.checked}
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Security</h3>
            <div className="space-y-4">
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Change Password</div>
                <div className="text-sm text-gray-500">Update your account password</div>
              </button>
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Two-Factor Authentication</div>
                <div className="text-sm text-gray-500">Add an extra layer of security</div>
              </button>
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Login Activity</div>
                <div className="text-sm text-gray-500">Review recent account access</div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Data & Privacy</h3>
            <div className="space-y-4">
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Download My Data</div>
                <div className="text-sm text-gray-500">Get a copy of your account data</div>
              </button>
              <button className="w-full text-left p-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                <div className="font-medium">Delete Account</div>
                <div className="text-sm">Permanently remove your account</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardContent />;
      case 'sessions': return <SessionsContent />;
      // case 'tutors': return <TutorsContent />;
      case 'messages': return <MessagesContent />;
      case 'profile': return <ProfileContent />;
      case 'settings': return <SettingsContent />;
      default: return <DashboardContent />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">TT</span>
            </div>
            <div>
              <h1 className="font-bold text-xl text-gray-900">TuringTutor</h1>
              <p className="text-gray-500 text-sm">Learn. Code. Grow.</p>
            </div>
          </div>

          {/* Student Profile */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 text-white mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">
                  {student.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <h3 className="font-semibold">{student.name}</h3>
                <p className="text-blue-100 text-sm">{student.email}</p>
              </div>
            </div>
            <div className="mt-3 flex justify-between items-center">
              <div>
                <div className="text-lg font-bold">{student.balance} min</div>
                <div className="text-blue-200 text-xs">Session Balance</div>
              </div>
              <div>
                <div className="text-lg font-bold">{student.streak}</div>
                <div className="text-blue-200 text-xs">Day Streak 🔥</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'sessions', label: 'My Sessions', icon: '📚' },
              { id: 'tutors', label: 'Find Tutors', icon: '👨‍🏫' },
              { id: 'messages', label: 'Messages', icon: '💬', badge: mockDatabase.messages.filter(m => !m.read).length },
              { id: 'profile', label: 'Profile', icon: '👤' },
              { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all duration-200 text-sm font-medium relative ${
                  activeSection === item.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-6 mt-auto">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white text-center">
            <div className="text-2xl mb-2">🎯</div>
            <h4 className="font-semibold text-sm mb-1">Weekly Goal</h4>
            <p className="text-green-100 text-xs mb-3">3 of 5 sessions completed</p>
            <div className="w-full bg-green-400 rounded-full h-2">
              <div className="bg-white h-2 rounded-full" style={{width: '60%'}}></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 capitalize">{activeSection}</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                >
                  🔔
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Mark all as read
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => markNotificationAsRead(notification.id)}
                          className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
                              <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                              <p className="text-gray-500 text-xs mt-2">{notification.time}</p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full mt-1"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-medium text-gray-900 text-sm">{student.name}</div>
                  <div className="text-gray-500 text-xs">{student.id}</div>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {student.name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
