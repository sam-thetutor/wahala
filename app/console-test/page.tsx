'use client';

import React, { useEffect } from 'react';

export default function ConsoleTestPage() {
  useEffect(() => {
    console.log('🧪 Console test page loaded');
    
    // Test fetch directly
    fetch('/api/ws', { method: 'GET' })
      .then(response => {
        console.log('✅ Fetch response status:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('✅ Fetch response data:', data);
      })
      .catch(error => {
        console.error('❌ Fetch error:', error);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Console Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Check Browser Console</h2>
          <p>Open the browser console to see the fetch test results.</p>
          <p>You should see logs starting with 🧪, ✅, or ❌</p>
        </div>
      </div>
    </div>
  );
}
