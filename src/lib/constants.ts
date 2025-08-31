export const navigationItems = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: 'dashboard',
    current: false 
  },
  { 
    name: 'My Students', 
    href: '/dashboard/students', 
    icon: 'users',
    current: false 
  },
  { 
    name: 'My Sessions', 
    href: '/sessions', 
    icon: 'calendar',
    current: false 
  },
  { 
    name: 'Find Tutors', 
    href: '/tutors', 
    icon: 'search',
    current: false 
  },
  { 
    name: 'Messages', 
    href: '/messages', 
    icon: 'message',
    current: false, 
    badge: 3 
  },
  { 
    name: 'Progress', 
    href: '/progress', 
    icon: 'chart',
    current: false 
  },
  { 
    name: 'Resources', 
    href: '/resources', 
    icon: 'book',
    current: false 
  }
]

export const bottomNavigationItems = [
  { 
    name: 'Help & Support', 
    href: '/help', 
    icon: 'help',
    current: false 
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: 'settings',
    current: false 
  }
]

export type NavigationItem = typeof navigationItems[0]