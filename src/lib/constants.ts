export const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊', current: true },
  { name: 'My Sessions', href: '/sessions', icon: '📚', current: false },
  { name: 'Find Tutors', href: '/tutors', icon: '🔍', current: false },
  { name: 'Messages', href: '/messages', icon: '💬', current: false, badge: 3 },
  { name: 'Profile', href: '/profile', icon: '👤', current: false },
  { name: 'Settings', href: '/settings', icon: '⚙️', current: false }
]

export type NavigationItem = typeof navigationItems[0]