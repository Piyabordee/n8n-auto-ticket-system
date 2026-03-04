'use client'

import { useState } from 'react'

export function BranchSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const branches = [
    { value: 'Bangkok', label: 'Bangkok' },
    { value: 'Chiang Mai', label: 'Chiang Mai' },
    { value: 'Phuket', label: 'Phuket' },
    { value: 'Pattaya', label: 'Pattaya' }
  ]

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Select Branch</option>
      {branches.map(branch => (
        <option key={branch.value} value={branch.value}>{branch.label}</option>
      ))}
    </select>
  )
}