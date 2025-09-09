'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Plus, Edit2, Trash2, Eye, EyeOff, Download, Upload, Palette, Code } from 'lucide-react'

interface MarketingBanner {
  id: string
  title: string
  htmlContent: string
  cssContent: string
  linkUrl?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Pre-built banner templates with correct 728x90 dimensions
const bannerTemplates = [
  {
    name: 'Summer SAT Special',
    htmlContent: `<div class="banner-container">
  <div class="banner-icon">🌟</div>
  <div class="banner-content">
    <h2 class="banner-title">Summer SAT Prep Special!</h2>
    <p class="banner-text">Get 20% off all SAT packages this summer</p>
  </div>
  <button class="banner-cta">Enroll Now →</button>
</div>`,
    cssContent: `.banner-container {
  background: transparent;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  color: white;
  box-sizing: border-box;
}
.banner-icon {
  font-size: 32px;
  margin-right: 12px;
}
.banner-content {
  flex: 1;
}
.banner-title {
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 4px 0;
  line-height: 1.2;
}
.banner-text {
  font-size: 13px;
  opacity: 0.95;
  margin: 0;
}
.banner-cta {
  background: white;
  color: #667eea;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: transform 0.2s;
  white-space: nowrap;
}
.banner-cta:hover {
  transform: scale(1.05);
}`
  },
  {
    name: 'Limited Time Offer',
    htmlContent: `<div class="promo-banner">
  <div class="promo-badge">LIMITED TIME</div>
  <div class="promo-content">
    <h3 class="promo-title">Buy 10 Hours, Get 2 FREE!</h3>
    <p class="promo-subtitle">Best value - Save $300</p>
  </div>
  <button class="promo-btn">Claim Offer</button>
</div>`,
    cssContent: `.promo-banner {
  background: transparent;
  width: 100%;
  height: 100%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  color: white;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}
.promo-badge {
  background: #ef4444;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  white-space: nowrap;
}
.promo-content {
  flex: 1;
}
.promo-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 2px 0;
  line-height: 1.2;
}
.promo-subtitle {
  font-size: 13px;
  opacity: 0.9;
  margin: 0;
}
.promo-btn {
  background: #fbbf24;
  color: #1e3a8a;
  padding: 10px 18px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.promo-btn:hover {
  background: #f59e0b;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}`
  },
  {
    name: 'Achievement Celebration',
    htmlContent: `<div class="celebrate-banner">
  <div class="celebrate-icon">🎉</div>
  <div class="celebrate-text">
    <strong>Congratulations!</strong>
    <span>98% of our students passed their exams!</span>
  </div>
  <a href="#" class="celebrate-link">Success Stories →</a>
</div>`,
    cssContent: `.celebrate-banner {
  background: transparent;
  width: 100%;
  height: 100%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: white;
  box-sizing: border-box;
}
.celebrate-icon {
  font-size: 36px;
  flex-shrink: 0;
}
.celebrate-text {
  flex: 1;
  line-height: 1.3;
}
.celebrate-text strong {
  display: block;
  font-size: 16px;
  margin-bottom: 2px;
  color: white;
  font-weight: 700;
}
.celebrate-text span {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
}
.celebrate-link {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 10px 16px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s;
  white-space: nowrap;
}
.celebrate-link:hover {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}`
  }
]

export default function AdminMarketingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [banners, setBanners] = useState<MarketingBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedBanner, setSelectedBanner] = useState<MarketingBanner | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [cssContent, setCssContent] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/admin/banners')
      if (response.ok) {
        const data = await response.json()
        setBanners(data)
      } else if (response.status === 401) {
        router.push('/admin/login')
      }
    } catch (error) {
      console.error('Failed to fetch banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setHtmlContent('')
    setCssContent('')
    setLinkUrl('')
    setIsActive(false)
    setSelectedTemplate(null)
  }

  const handleTemplateSelect = (index: number) => {
    const template = bannerTemplates[index]
    setHtmlContent(template.htmlContent)
    setCssContent(template.cssContent)
    setSelectedTemplate(index)
  }

  const handleCreateBanner = async () => {
    if (!title || !htmlContent) {
      alert('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          htmlContent,
          cssContent,
          linkUrl: linkUrl || null,
          isActive
        }),
      })

      if (response.ok) {
        await fetchBanners()
        setShowCreateModal(false)
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create banner')
      }
    } catch (error) {
      console.error('Failed to create banner:', error)
      alert('Failed to create banner')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditBanner = async () => {
    if (!selectedBanner || !title || !htmlContent) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/banners/${selectedBanner.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          htmlContent,
          cssContent,
          linkUrl: linkUrl || null,
          isActive
        }),
      })

      if (response.ok) {
        await fetchBanners()
        setShowEditModal(false)
        setSelectedBanner(null)
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update banner')
      }
    } catch (error) {
      console.error('Failed to update banner:', error)
      alert('Failed to update banner')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return

    setDeleting(bannerId)
    try {
      const response = await fetch(`/api/admin/banners/${bannerId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchBanners()
      } else {
        alert('Failed to delete banner')
      }
    } catch (error) {
      console.error('Failed to delete banner:', error)
      alert('Failed to delete banner')
    } finally {
      setDeleting(null)
    }
  }

  const toggleBannerStatus = async (banner: MarketingBanner) => {
    try {
      const response = await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !banner.isActive
        }),
      })

      if (response.ok) {
        await fetchBanners()
      }
    } catch (error) {
      console.error('Failed to toggle banner status:', error)
    }
  }

  const openEditModal = (banner: MarketingBanner) => {
    setSelectedBanner(banner)
    setTitle(banner.title)
    setHtmlContent(banner.htmlContent)
    setCssContent(banner.cssContent)
    setLinkUrl(banner.linkUrl || '')
    setIsActive(banner.isActive)
    setShowEditModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-bold text-white">Marketing Banners</h1>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Banner
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : banners.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <Palette className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Banners Yet</h3>
            <p className="text-gray-400 mb-6">Create your first marketing banner to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Your First Banner
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {banners.map((banner) => (
              <div key={banner.id} className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{banner.title}</h3>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${
                          banner.isActive 
                            ? 'bg-green-900/30 text-green-400' 
                            : 'bg-gray-700 text-gray-400'
                        }`}>
                          {banner.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          {banner.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {banner.linkUrl && (
                          <span className="text-gray-400">
                            Links to: <span className="text-blue-400">{banner.linkUrl}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleBannerStatus(banner)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          banner.isActive
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {banner.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => openEditModal(banner)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(banner.id)}
                        disabled={deleting === banner.id}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Banner Preview */}
                  <div className="bg-gray-900 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-2">Preview (as displayed on dashboard):</p>
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6">
                      <style dangerouslySetInnerHTML={{ __html: `
                        /* Override fixed dimensions for responsive display */
                        .admin-preview-${banner.id} .banner-container {
                          width: 100% !important;
                          height: auto !important;
                          min-height: 80px;
                        }
                        ${banner.cssContent}
                      ` }} />
                      <div className={`admin-preview-${banner.id}`}>
                        <div dangerouslySetInnerHTML={{ __html: banner.htmlContent }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Create New Banner</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Form Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Banner Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                      placeholder="e.g., Summer SAT Special"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Link URL (optional)
                    </label>
                    <input
                      type="text"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                      placeholder="https://example.com/offer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Templates
                    </label>
                    <div className="grid gap-2">
                      {bannerTemplates.map((template, index) => (
                        <button
                          key={index}
                          onClick={() => handleTemplateSelect(index)}
                          className={`px-4 py-2 rounded-lg text-left transition-colors ${
                            selectedTemplate === index
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {template.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-gray-700 bg-gray-900 text-red-600 focus:ring-red-500"
                    />
                    <label htmlFor="isActive" className="text-sm text-gray-300">
                      Activate banner immediately
                    </label>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Code className="h-4 w-4 text-gray-400" />
                      <label className="text-sm font-medium text-gray-300">HTML Content *</label>
                    </div>
                    <textarea
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      className="w-full h-32 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-red-500"
                      placeholder="<div>Your banner HTML...</div>"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Palette className="h-4 w-4 text-gray-400" />
                      <label className="text-sm font-medium text-gray-300">CSS Styles</label>
                    </div>
                    <textarea
                      value={cssContent}
                      onChange={(e) => setCssContent(e.target.value)}
                      className="w-full h-32 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-red-500"
                      placeholder=".banner { /* Your styles */ }"
                    />
                  </div>
                </div>

                {/* Live Preview */}
                <div className="bg-gray-900 rounded-lg p-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">Live Preview (Responsive)</h3>
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6">
                    {(htmlContent || cssContent) ? (
                      <>
                        <style dangerouslySetInnerHTML={{ __html: `
                          /* Override fixed dimensions for responsive display */
                          .create-preview .banner-container {
                            width: 100% !important;
                            height: auto !important;
                            min-height: 80px;
                          }
                          ${cssContent}
                        ` }} />
                        <div className="create-preview">
                          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-20 border-2 border-dashed border-white/30 rounded">
                        <p className="text-white/60 text-sm">Your banner preview will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBanner}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {submitting ? 'Creating...' : 'Create Banner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedBanner && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Edit Banner</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Form Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Banner Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                      placeholder="e.g., Summer SAT Special"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Link URL (optional)
                    </label>
                    <input
                      type="text"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                      placeholder="https://example.com/offer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Templates
                    </label>
                    <div className="grid gap-2">
                      {bannerTemplates.map((template, index) => (
                        <button
                          key={index}
                          onClick={() => handleTemplateSelect(index)}
                          className={`px-4 py-2 rounded-lg text-left transition-colors ${
                            selectedTemplate === index
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {template.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActiveEdit"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-gray-700 bg-gray-900 text-red-600 focus:ring-red-500"
                    />
                    <label htmlFor="isActiveEdit" className="text-sm text-gray-300">
                      Banner is active
                    </label>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Code className="h-4 w-4 text-gray-400" />
                      <label className="text-sm font-medium text-gray-300">HTML Content *</label>
                    </div>
                    <textarea
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      className="w-full h-32 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-red-500"
                      placeholder="<div>Your banner HTML...</div>"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Palette className="h-4 w-4 text-gray-400" />
                      <label className="text-sm font-medium text-gray-300">CSS Styles</label>
                    </div>
                    <textarea
                      value={cssContent}
                      onChange={(e) => setCssContent(e.target.value)}
                      className="w-full h-32 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-red-500"
                      placeholder=".banner { /* Your styles */ }"
                    />
                  </div>
                </div>

                {/* Live Preview */}
                <div className="bg-gray-900 rounded-lg p-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">Live Preview (Responsive)</h3>
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6">
                    {(htmlContent || cssContent) ? (
                      <>
                        <style dangerouslySetInnerHTML={{ __html: `
                          /* Override fixed dimensions for responsive display */
                          .create-preview .banner-container {
                            width: 100% !important;
                            height: auto !important;
                            min-height: 80px;
                          }
                          ${cssContent}
                        ` }} />
                        <div className="create-preview">
                          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-20 border-2 border-dashed border-white/30 rounded">
                        <p className="text-white/60 text-sm">Your banner preview will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedBanner(null)
                  resetForm()
                }}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditBanner}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}