'use client'

import { useState, useEffect } from 'react'

export default function TestNFTPage() {
  const [nftData, setNftData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState(null)

  const testNFTId = 'cmdx93o4b0001kv7cuq5vjans'

  const testAPI = async () => {
    setLoading(true)
    setError('')
    setNftData(null)
    setDebugInfo(null)

    try {
      console.log('Testing NFT API...')
      
      // Test main API
      const response = await fetch(`/api/nft/${testNFTId}`)
      const data = await response.json()
      
      if (response.ok) {
        setNftData(data)
        console.log('✅ NFT API Success:', data)
      } else {
        throw new Error(`API Error ${response.status}: ${data.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('❌ NFT API Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      
      // If main API fails, try debug API
      try {
        const debugResponse = await fetch(`/api/debug/${testNFTId}`)
        const debugData = await debugResponse.json()
        setDebugInfo(debugData)
        console.log('🔍 Debug Info:', debugData)
      } catch (debugErr) {
        console.error('❌ Debug API also failed:', debugErr)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testAPI()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">NFT API Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Testing NFT ID: {testNFTId}</h2>
          
          <button 
            onClick={testAPI}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test API'}
          </button>
        </div>

        {loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">Loading NFT data...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold">Error:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {nftData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-green-800 font-semibold mb-2">✅ Success! NFT Data:</h3>
            <pre className="text-sm text-green-700 overflow-auto">
              {JSON.stringify(nftData, null, 2)}
            </pre>
          </div>
        )}

        {debugInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-blue-800 font-semibold mb-2">🔍 Debug Information:</h3>
            <pre className="text-sm text-blue-700 overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Test URLs:</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <strong>NFT API:</strong> 
              <a href={`/api/nft/${testNFTId}`} target="_blank" className="text-blue-600 hover:underline ml-2">
                /api/nft/{testNFTId}
              </a>
            </li>
            <li>
              <strong>Debug API:</strong> 
              <a href={`/api/debug/${testNFTId}`} target="_blank" className="text-blue-600 hover:underline ml-2">
                /api/debug/{testNFTId}
              </a>
            </li>
            <li>
              <strong>Test Endpoint:</strong> 
              <a href="/api/test" target="_blank" className="text-blue-600 hover:underline ml-2">
                /api/test
              </a>
            </li>
            <li>
              <strong>Mock NFT:</strong> 
              <a href="/api/nft/test-id" target="_blank" className="text-blue-600 hover:underline ml-2">
                /api/nft/test-id
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}