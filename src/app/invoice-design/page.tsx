"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useTemplates, optimisticDeleteTemplate } from "@/lib/data-hooks"
// Removed local AppLayout to use GlobalNavbar layout

interface InvoiceTemplate {
  id: string
  name: string
  description?: string
  companyLogo?: string
  isTaxable: boolean
  cgstRate?: number
  sgstRate?: number
  igstRate?: number
  invoiceNumberStart: number
  invoiceNumberPrefix: string
  pdfTemplate: string
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function InvoiceDesignPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<string>('')
  const [editingTemplate, setEditingTemplate] = useState<InvoiceTemplate | null>(null)
  const [deletingTemplate, setDeletingTemplate] = useState<InvoiceTemplate | null>(null)

  if (!session) {
    router.push("/") // redirect to signup/login if not logged in
    return null
  }

  // Use optimized data hooks with caching
  const { templates, isLoading: templatesLoading, mutate: mutateTemplates } = useTemplates()

  const showTemplatePreview = (templateId: string) => {
    setPreviewTemplate(templateId)
    setShowPreview(true)
  }

  const deleteTemplate = async (templateId: string) => {
    try {
      await optimisticDeleteTemplate(templateId)
      setDeletingTemplate(null) // Close confirmation dialog
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template')
    }
  }

  return (
    <>
          {/* Templates Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Your Templates</h2>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create New Template</span>
              </button>
            </div>

            {/* Templates Grid */}
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
                  <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No templates yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first invoice template to get started</p>
                  <button 
                    onClick={() => setShowCreateForm(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create New Template
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <div key={template.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{template.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{template.description || 'No description'}</p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="bg-gray-100 dark:bg-gray-700 h-24 rounded mb-3 relative overflow-hidden">
                          <iframe
                            src={`/templates/${template.pdfTemplate}.html`}
                            className="w-full h-full border-0 scale-50 origin-top-left"
                            style={{ width: '200%', height: '200%' }}
                            title={`${template.pdfTemplate} template preview`}
                          />
                          <button
                            onClick={() => showTemplatePreview(template.pdfTemplate)}
                            className="absolute top-1 right-1 p-1 bg-white dark:bg-gray-600 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                            title="Expand preview"
                          >
                            <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="capitalize">{template.pdfTemplate}</span>
                          <span>•</span>
                          <span>{template.isTaxable ? 'Taxable' : 'Non-taxable'}</span>
                        </div>
                      </div>

                       <div className="flex space-x-2">
                         <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                           Use Template
                         </button>
                         <button 
                           onClick={() => setEditingTemplate(template)}
                           className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                         >
                           Edit
                         </button>
                         <button 
                           onClick={() => setDeletingTemplate(template)}
                           className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                         >
                           Delete
                         </button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Template Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <CreateTemplateForm 
                  onClose={() => setShowCreateForm(false)}
                  onSuccess={() => {
                    setShowCreateForm(false)
                    mutateTemplates()
                  }}
                />
              </div>
            </div>
          )}

          {/* Template Preview Modal */}
          {showPreview && (
            <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col">
              {/* Header */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  {previewTemplate.charAt(0).toUpperCase() + previewTemplate.slice(1)} Template Preview
                </h3>
                <button 
                  onClick={() => setShowPreview(false)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Close</span>
                </button>
              </div>
              
              {/* Preview Content */}
              <div className="flex-1 overflow-hidden">
                <iframe
                  src={`/templates/${previewTemplate}.html`}
                  className="w-full h-full border-0"
                  title={`${previewTemplate} template preview`}
                />
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deletingTemplate && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Delete Template
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Are you sure you want to delete "{deletingTemplate.name}"? This action cannot be undone.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setDeletingTemplate(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteTemplate(deletingTemplate.id)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Template Modal */}
          {editingTemplate && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <EditTemplateForm 
                  template={editingTemplate}
                  onClose={() => setEditingTemplate(null)}
                  onSuccess={() => {
                    setEditingTemplate(null)
                    mutateTemplates()
                  }}
                />
              </div>
            </div>
          )}
    </>
  )
}

// Create Template Form Component
function CreateTemplateForm({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    companyLogo: '',
    isTaxable: false,
    cgstRate: 0,
    sgstRate: 0,
    igstRate: 0,
    invoiceNumberStart: 1,
    invoiceNumberPrefix: 'INV',
    pdfTemplate: 'classic',
    primaryColor: '#667eea',
    secondaryColor: '#f7fafc',
    fontFamily: 'Inter'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<string>('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }
      
      setSelectedFile(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setSelectedFile(null)
    setLogoPreview(null)
    setFormData({...formData, companyLogo: ''})
  }

  const showTemplatePreview = (templateId: string) => {
    setPreviewTemplate(templateId)
    setShowPreview(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create FormData to handle file upload
      const submitData = new FormData()
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'companyLogo') {
          submitData.append(key, value.toString())
        }
      })
      
      // Add logo file if selected
      if (selectedFile) {
        submitData.append('companyLogo', selectedFile)
      }

      const response = await fetch('/api/templates', {
        method: 'POST',
        body: submitData
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create template')
      }
    } catch (error) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Create New Template</h2>
        <button 
          onClick={onClose}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Form Layout - Left and Right Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Form Fields */}
          <div className="space-y-6">
            {/* Template Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Template Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Enter template name"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Describe your template"
                rows={3}
              />
            </div>

            {/* Company Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Logo</label>
              
              {logoPreview ? (
                <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected Logo</span>
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center space-x-4">
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="h-16 w-16 object-contain border border-gray-200 dark:border-gray-600 rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedFile?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {(selectedFile?.size ? (selectedFile.size / 1024).toFixed(1) : '0')} KB
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors bg-white dark:bg-gray-700">
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Click to upload logo (optional)</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </label>
                </div>
              )}
            </div>

            {/* Tax Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tax Settings</label>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isTaxable"
                    checked={formData.isTaxable}
                    onChange={(e) => setFormData({...formData, isTaxable: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  />
                  <label htmlFor="isTaxable" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    This template is taxable
                  </label>
                </div>

                {formData.isTaxable && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CGST Rate (%)</label>
                      <input
                        type="number"
                        value={formData.cgstRate}
                        onChange={(e) => setFormData({...formData, cgstRate: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="9"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SGST Rate (%)</label>
                      <input
                        type="number"
                        value={formData.sgstRate}
                        onChange={(e) => setFormData({...formData, sgstRate: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="9"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IGST Rate (%)</label>
                      <input
                        type="number"
                        value={formData.igstRate}
                        onChange={(e) => setFormData({...formData, igstRate: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="18"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Invoice Numbering */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Invoice Numbering</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Number</label>
                  <input
                    type="number"
                    value={formData.invoiceNumberStart}
                    onChange={(e) => setFormData({...formData, invoiceNumberStart: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prefix</label>
                  <input
                    type="text"
                    value={formData.invoiceNumberPrefix}
                    onChange={(e) => setFormData({...formData, invoiceNumberPrefix: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="INV"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - PDF Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">PDF Template</label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'classic', name: 'Classic', desc: 'Clean and professional' },
                { id: 'modern', name: 'Modern', desc: 'Sleek and contemporary' },
                { id: 'minimal', name: 'Minimal', desc: 'Simple and elegant' },
                { id: 'creative', name: 'Creative', desc: 'Bold and artistic' }
              ].map((template) => (
                <div
                  key={template.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors relative ${
                    formData.pdfTemplate === template.id 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                  }`}
                  onClick={() => setFormData({...formData, pdfTemplate: template.id})}
                >
                  <div className="h-32 rounded mb-3 relative overflow-hidden">
                    <iframe
                      src={`/templates/${template.id}.html`}
                      className="w-full h-full border-0 scale-50 origin-top-left"
                      style={{ width: '200%', height: '200%' }}
                      title={`${template.id} template preview`}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        showTemplatePreview(template.id)
                      }}
                      className="absolute top-1 right-1 p-1 bg-white dark:bg-gray-600 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                      title="Preview template"
                    >
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{template.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{template.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Actions - Below Both Sections */}
        <div className="flex space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Template'}
          </button>
        </div>
      </form>

      {/* Full Screen Template Preview */}
      {showPreview && (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              {previewTemplate.charAt(0).toUpperCase() + previewTemplate.slice(1)} Template Preview
            </h3>
            <button 
              onClick={() => setShowPreview(false)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Close</span>
            </button>
          </div>
          
          {/* Preview Content */}
          <div className="flex-1 overflow-hidden">
            <iframe
              src={`/templates/${previewTemplate}.html`}
              className="w-full h-full border-0"
              title={`${previewTemplate} template preview`}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Edit Template Form Component
function EditTemplateForm({ template, onClose, onSuccess }: { 
  template: InvoiceTemplate, 
  onClose: () => void, 
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    name: template.name,
    description: template.description || '',
    companyLogo: template.companyLogo || '',
    isTaxable: template.isTaxable,
    cgstRate: template.cgstRate || 0,
    sgstRate: template.sgstRate || 0,
    igstRate: template.igstRate || 0,
    invoiceNumberStart: template.invoiceNumberStart,
    invoiceNumberPrefix: template.invoiceNumberPrefix,
    pdfTemplate: template.pdfTemplate,
    primaryColor: template.primaryColor,
    secondaryColor: template.secondaryColor,
    fontFamily: template.fontFamily
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(template.companyLogo || null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<string>('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }
      
      setSelectedFile(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setSelectedFile(null)
    setLogoPreview(null)
    setFormData({...formData, companyLogo: ''})
  }

  const showTemplatePreview = (templateId: string) => {
    setPreviewTemplate(templateId)
    setShowPreview(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create FormData to handle file upload
      const submitData = new FormData()
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'companyLogo') {
          submitData.append(key, value.toString())
        }
      })
      
      // Add logo file if selected
      if (selectedFile) {
        submitData.append('companyLogo', selectedFile)
      }

      const response = await fetch('/api/templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: template.id,
          ...formData,
          companyLogo: selectedFile ? selectedFile.name : template.companyLogo
        })
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update template')
      }
    } catch (error) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Edit Template</h2>
        <button 
          onClick={onClose}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Form Layout - Left and Right Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Form Fields */}
          <div className="space-y-6">
            {/* Template Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Template Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Enter template name"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Describe your template"
                rows={3}
              />
            </div>

            {/* Company Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Logo</label>
              
              {logoPreview ? (
                <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected Logo</span>
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center space-x-4">
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="h-16 w-16 object-contain border border-gray-200 dark:border-gray-600 rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedFile?.name || 'Current logo'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {selectedFile ? ((selectedFile.size / 1024).toFixed(1) + ' KB') : 'Existing logo'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors bg-white dark:bg-gray-700">
                  <input
                    type="file"
                    id="logo-upload-edit"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="logo-upload-edit" className="cursor-pointer">
                    <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Click to upload logo (optional)</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </label>
                </div>
              )}
            </div>

            {/* Tax Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tax Settings</label>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isTaxable-edit"
                    checked={formData.isTaxable}
                    onChange={(e) => setFormData({...formData, isTaxable: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  />
                  <label htmlFor="isTaxable-edit" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    This template is taxable
                  </label>
                </div>

                {formData.isTaxable && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CGST Rate (%)</label>
                      <input
                        type="number"
                        value={formData.cgstRate}
                        onChange={(e) => setFormData({...formData, cgstRate: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="9"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SGST Rate (%)</label>
                      <input
                        type="number"
                        value={formData.sgstRate}
                        onChange={(e) => setFormData({...formData, sgstRate: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="9"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IGST Rate (%)</label>
                      <input
                        type="number"
                        value={formData.igstRate}
                        onChange={(e) => setFormData({...formData, igstRate: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="18"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Invoice Numbering */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Invoice Numbering</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Number</label>
                  <input
                    type="number"
                    value={formData.invoiceNumberStart}
                    onChange={(e) => setFormData({...formData, invoiceNumberStart: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prefix</label>
                  <input
                    type="text"
                    value={formData.invoiceNumberPrefix}
                    onChange={(e) => setFormData({...formData, invoiceNumberPrefix: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="INV"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - PDF Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">PDF Template</label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'classic', name: 'Classic', desc: 'Clean and professional' },
                { id: 'modern', name: 'Modern', desc: 'Sleek and contemporary' },
                { id: 'minimal', name: 'Minimal', desc: 'Simple and elegant' },
                { id: 'creative', name: 'Creative', desc: 'Bold and artistic' }
              ].map((templateOption) => (
                <div
                  key={templateOption.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors relative ${
                    formData.pdfTemplate === templateOption.id 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                  }`}
                  onClick={() => setFormData({...formData, pdfTemplate: templateOption.id})}
                >
                  <div className="h-32 rounded mb-3 relative overflow-hidden">
                    <iframe
                      src={`/templates/${templateOption.id}.html`}
                      className="w-full h-full border-0 scale-50 origin-top-left"
                      style={{ width: '200%', height: '200%' }}
                      title={`${templateOption.id} template preview`}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        showTemplatePreview(templateOption.id)
                      }}
                      className="absolute top-1 right-1 p-1 bg-white dark:bg-gray-600 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                      title="Preview template"
                    >
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{templateOption.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{templateOption.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Actions - Below Both Sections */}
        <div className="flex space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Template'}
          </button>
        </div>
      </form>

      {/* Full Screen Template Preview */}
      {showPreview && (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              {previewTemplate.charAt(0).toUpperCase() + previewTemplate.slice(1)} Template Preview
            </h3>
            <button 
              onClick={() => setShowPreview(false)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Close</span>
            </button>
          </div>
          
          {/* Preview Content */}
          <div className="flex-1 overflow-hidden">
            <iframe
              src={`/templates/${previewTemplate}.html`}
              className="w-full h-full border-0"
              title={`${previewTemplate} template preview`}
            />
          </div>
        </div>
      )}
    </div>
  )
}
