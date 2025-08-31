'use client'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <div className="md:hidden sticky top-0 z-30 flex h-16 bg-white shadow-sm">
      <button
        type="button"
        className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
        onClick={onMenuClick}
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="flex-1 flex items-center justify-center">
        <span className="text-xl font-semibold text-gray-900">UpstartPrep</span>
      </div>
    </div>
  )
}