'use client'

import { useState } from 'react'

export function CategorySelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const categories = [
    { value: 'Software', label: 'Software' },
    { value: 'Hardware', label: 'Hardware' },
    { value: 'Network', label: 'Network' },
    { value: 'Camera', label: 'Camera' },
    { value: 'Printer', label: 'Printer' },
    { value: 'Rate', label: 'Rate' },
    { value: 'POS', label: 'POS' },
    { value: 'Request', label: 'Request' }
  ]

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Select Category</option>
      {categories.map(cat => (
        <option key={cat.value} value={cat.value}>{cat.label}</option>
      ))}
    </select>
  )
}