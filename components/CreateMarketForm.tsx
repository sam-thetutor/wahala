'use client'

import { useState } from 'react'
import { useMarketCreation, CreateMarketParams } from '@/hooks/useMarketCreation'

const CATEGORIES = [
  { id: 'Politics', name: 'Politics', color: '#EF4444' },
  { id: 'Sports', name: 'Sports', color: '#10B981' },
  { id: 'Technology', name: 'Technology', color: '#3B82F6' },
  { id: 'Entertainment', name: 'Entertainment', color: '#8B5CF6' },
  { id: 'Finance', name: 'Finance', color: '#F59E0B' },
  { id: 'Science', name: 'Science', color: '#6366F1' },
  { id: 'Weather', name: 'Weather', color: '#06B6D4' },
  { id: 'Other', name: 'Other', color: '#6B7280' }
]

export default function CreateMarketForm() {
  const [formData, setFormData] = useState<CreateMarketParams>({
    question: '',
    endTime: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days from now
    description: '',
    category: '',
    image: '',
    source: ''
  })

  const { createMarket, isCreating, isConfirming, isSuccess, error, transactionHash, reset } = useMarketCreation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createMarket(formData)
  }

  const handleInputChange = (field: keyof CreateMarketParams, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleEndTimeChange = (value: string) => {
    const timestamp = Math.floor(new Date(value).getTime() / 1000)
    handleInputChange('endTime', timestamp)
  }

  const formatEndTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toISOString().slice(0, 16)
  }

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Market Created Successfully!</h2>
          <p className="text-gray-600 mb-4">
            Your prediction market has been created and will appear in the markets list shortly.
          </p>
          {transactionHash && (
            <div className="bg-gray-100 p-3 rounded-lg mb-4">
              <p className="text-sm text-gray-600">Transaction Hash:</p>
              <p className="font-mono text-sm break-all">{transactionHash}</p>
            </div>
          )}
          <button
            onClick={reset}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Another Market
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Prediction Market</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question */}
        <div>
          <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
            Question *
          </label>
          <input
            type="text"
            id="question"
            value={formData.question}
            onChange={(e) => handleInputChange('question', e.target.value)}
            placeholder="Will Bitcoin reach $100,000 by end of 2024?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.question.length}/200 characters
          </p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Provide more context about this prediction market..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.description.length}/1000 characters
          </p>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select a category</option>
            {CATEGORIES.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* End Time */}
        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
            End Time *
          </label>
          <input
            type="datetime-local"
            id="endTime"
            value={formatEndTime(formData.endTime)}
            onChange={(e) => handleEndTimeChange(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            When should this market close for new bets?
          </p>
        </div>

        {/* Image URL */}
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
            Image URL
          </label>
          <input
            type="url"
            id="image"
            value={formData.image}
            onChange={(e) => handleInputChange('image', e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Source URL */}
        <div>
          <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-2">
            Source URL
          </label>
          <input
            type="url"
            id="source"
            value={formData.source}
            onChange={(e) => handleInputChange('source', e.target.value)}
            placeholder="https://example.com/source"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isCreating || isConfirming}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isCreating ? 'Creating...' : isConfirming ? 'Confirming...' : 'Create Market'}
        </button>

        {/* Transaction Hash */}
        {transactionHash && (
          <div className="bg-gray-100 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Transaction Hash:</p>
            <p className="font-mono text-sm break-all">{transactionHash}</p>
          </div>
        )}
      </form>
    </div>
  )
}










