'use client';

import React from 'react';

export default function MinimalTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Minimal Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test WebSocket Context</h2>
          <p>This page should load without errors.</p>
          <p>Check the browser console for any WebSocket connection logs.</p>
        </div>
      </div>
    </div>
  );
}
