'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Search, 
  MessageSquare, 
  BarChart3, 
  BookOpen,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home,
  Clock,
  Star,
  FileText,
  FolderOpen,
  ShoppingBag,
  Plane,
  MoreHorizontal
} from 'lucide-react'
import { useSidebar } from './DashboardLayout'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SidebarProps {
  userName?: string | null
  userEmail?: string | null
}

export default function Sidebar({ userName, userEmail }: SidebarProps) {
  const { collapsed, setCollapsed } = useSidebar()
  const pathname = usePathname()

  const platformItems = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: LayoutDashboard,
      active: pathname === '/dashboard'
    },
    { 
      name: 'History', 
      href: '/dashboard/history', 
      icon: Clock,
      active: pathname === '/dashboard/history'
    },
    { 
      name: 'Starred', 
      href: '/dashboard/starred', 
      icon: Star,
      active: pathname === '/dashboard/starred'
    },
    { 
      name: 'Settings', 
      href: '/dashboard/settings', 
      icon: Settings,
      active: pathname === '/dashboard/settings'
    }
  ]

  const mainItems = [
    { 
      name: 'My Students', 
      href: '/dashboard/students', 
      icon: Users,
      active: pathname.startsWith('/dashboard/students')
    },
    { 
      name: 'My Sessions', 
      href: '/dashboard/sessions', 
      icon: Calendar,
      active: pathname === '/dashboard/sessions'
    },
    { 
      name: 'Find Tutors', 
      href: '/dashboard/tutors', 
      icon: Search,
      active: pathname === '/dashboard/tutors'
    },
    { 
      name: 'Messages', 
      href: '/dashboard/messages', 
      icon: MessageSquare,
      badge: 3,
      active: pathname === '/dashboard/messages'
    },
    { 
      name: 'Progress', 
      href: '/dashboard/progress', 
      icon: BarChart3,
      active: pathname === '/dashboard/progress'
    },
    { 
      name: 'Resources', 
      href: '/dashboard/resources', 
      icon: BookOpen,
      active: pathname === '/dashboard/resources'
    }
  ]

  const projectItems = [
    { 
      name: 'Design Engineering', 
      href: '/dashboard/design', 
      icon: FolderOpen,
      active: false
    },
    { 
      name: 'Sales & Marketing', 
      href: '/dashboard/sales', 
      icon: ShoppingBag,
      active: false
    },
    { 
      name: 'Travel', 
      href: '/dashboard/travel', 
      icon: Plane,
      active: false
    }
  ]

  const bottomItems = [
    { 
      name: 'Help & Support', 
      href: '/dashboard/help', 
      icon: HelpCircle,
      active: pathname === '/dashboard/help'
    },
    { 
      name: 'Settings', 
      href: '/dashboard/account-settings', 
      icon: Settings,
      active: pathname === '/dashboard/account-settings'
    }
  ]

  const NavItem = ({ item, showLabel = true }: { item: any, showLabel?: boolean }) => {
    const Icon = item.icon
    const isActive = item.active

    const content = (
      <Link
        href={item.href}
        className={`
          flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
          ${isActive 
            ? 'bg-gray-900 text-white' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }
          ${collapsed ? 'justify-center' : ''}
        `}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="text-sm font-medium">{item.name}</span>
            {item.badge && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    )

    if (collapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {content}
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return content
  }

  return (
    <div className={`hidden md:flex md:fixed md:inset-y-0 ${collapsed ? 'md:w-16' : 'md:w-64'} transition-all duration-300 ease-in-out`}>
      <div className="flex flex-col flex-1 bg-white border-r border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className={`flex items-center ${collapsed ? 'justify-center w-full' : ''}`}>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              {!collapsed && (
                <div>
                  <p className="text-sm font-semibold text-gray-900">Acme Inc</p>
                  <p className="text-xs text-gray-500">Enterprise</p>
                </div>
              )}
            </div>
          </div>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(true)}
              className="ml-auto h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Platform Section */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {!collapsed && (
            <p className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Platform
            </p>
          )}
          <nav className="space-y-1 mb-6">
            {platformItems.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>

          {/* Main Navigation */}
          {!collapsed && (
            <p className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Models
            </p>
          )}
          <nav className="space-y-1 mb-6">
            {mainItems.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>

          {/* Projects Section */}
          {!collapsed && (
            <p className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Projects
            </p>
          )}
          <nav className="space-y-1 mb-6">
            {projectItems.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
            <button className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all duration-200 w-full">
              <MoreHorizontal className="h-5 w-5" />
              {!collapsed && <span className="text-sm font-medium">More</span>}
            </button>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 p-3">
          <nav className="space-y-1">
            {bottomItems.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
            <button
              onClick={() => signOut()}
              className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all duration-200 w-full"
            >
              <LogOut className="h-5 w-5" />
              {!collapsed && <span className="text-sm font-medium">Sign out</span>}
            </button>
          </nav>
        </div>

        {/* Collapse/Expand Button */}
        {collapsed && (
          <div className="border-t border-gray-200 p-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(false)}
              className="w-full h-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}