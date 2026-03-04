'use client'

import { useState } from 'react'
import { CategorySelect } from './CategorySelect'
import { BranchSelect } from './BranchSelect'
import { ImageUpload } from './ImageUpload'

export function TicketForm() {
  const [formData, setFormData] = useState({
    category: '',
    sub_category: '',
    branch_name: '',
    subject: '',
    problem_detail: '',
    image_base64: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageChange = (base64: string) => {
    setFormData(prev => ({ ...prev, image_base64: base64 }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Submit logic will be implemented in next step
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <CategorySelect
          value={formData.category}
          onChange={(value) => handleInputChange('category', value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sub-category
        </label>
        <input
          type="text"
          value={formData.sub_category}
          onChange={(e) => handleInputChange('sub_category', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Branch
        </label>
        <BranchSelect
          value={formData.branch_name}
          onChange={(value) => handleInputChange('branch_name', value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subject
        </label>
        <input
          type="text"
          value={formData.subject}
          onChange={(e) => handleInputChange('subject', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Problem Detail
        </label>
        <textarea
          value={formData.problem_detail}
          onChange={(e) => handleInputChange('problem_detail', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <ImageUpload onImageChange={handleImageChange} />

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
      >
        Submit Ticket
      </button>
    </form>
  )
}