'use client';

import React from 'react';
import { useCelebration } from '../../hooks/useCelebration';
import FireworksCelebration from '../../components/FireworksCelebration';

export default function TestFireworksPage() {
  const { celebrations, triggerCelebration, completeCelebration } = useCelebration();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🎆 Fireworks Test Page
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Fireworks Celebrations</h2>
          <p className="text-gray-600 mb-6">
            Click the buttons below to test different types of fireworks celebrations!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => triggerCelebration('marketCreated')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              🎉 Test Market Created
            </button>
            
            <button
              onClick={() => triggerCelebration('sharesBought')}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              💰 Test Shares Bought
            </button>
            
            <button
              onClick={() => triggerCelebration('marketResolved')}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              🎯 Test Market Resolved
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Current Celebration Status</h2>
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="font-medium">Market Created:</span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                celebrations.marketCreated 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {celebrations.marketCreated ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="font-medium">Shares Bought:</span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                celebrations.sharesBought 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {celebrations.sharesBought ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="font-medium">Market Resolved:</span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                celebrations.marketResolved 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {celebrations.marketResolved ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fireworks Components */}
      <FireworksCelebration 
        trigger={celebrations.marketCreated} 
        onComplete={() => completeCelebration('marketCreated')}
      />
      
      <FireworksCelebration 
        trigger={celebrations.sharesBought} 
        onComplete={() => completeCelebration('sharesBought')}
      />
      
      <FireworksCelebration 
        trigger={celebrations.marketResolved} 
        onComplete={() => completeCelebration('marketResolved')}
      />
    </div>
  );
}