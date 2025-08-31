interface WelcomeBannerProps {
  userName?: string | null
}

export default function WelcomeBanner({ userName }: WelcomeBannerProps) {
  const firstName = userName?.split(' ')[0] || 'there'
  
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900">
        Welcome back, {firstName}! 👋
      </h1>
      <p className="mt-2 text-gray-600">
        Here's what's happening with your learning journey today.
      </p>
    </div>
  )
}