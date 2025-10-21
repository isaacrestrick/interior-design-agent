'use client';

import { useState, useEffect } from 'react';
import ElevationCanvas from '@/components/elevation/ElevationCanvas';
import FixtureList from '@/components/elevation/FixtureList';
import AIAgentChat from '@/components/AIAgentChat';
import { WallWithFixtures } from '@/types';

export default function Home() {
  const [wall, setWall] = useState<WallWithFixtures | null>(null);
  const [wallId, setWallId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the sample wall ID from server, then load wall data
    const initializeWall = async () => {
      try {
        const response = await fetch('/api/sample-wall');
        if (response.ok) {
          const { wallId: id } = await response.json();
          setWallId(id);
          loadWall(id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching sample wall ID:', error);
        setLoading(false);
      }
    };

    initializeWall();
  }, []);

  const loadWall = async (id: string) => {
    try {
      const response = await fetch(`/api/walls/${id}`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setWall(data);
      }
    } catch (error) {
      console.error('Error loading wall:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFixturesUpdated = () => {
    if (wallId) {
      loadWall(wallId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-pulse mb-4">
            <svg className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div className="text-xl font-semibold text-gray-900">Loading your workspace...</div>
          <p className="text-gray-500 mt-2">Setting up your design environment</p>
        </div>
      </div>
    );
  }

  if (!wall) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-xl font-semibold text-red-900 mb-2">Unable to Load Wall</div>
            <p className="text-red-700 text-sm">There was an error loading your wall data. Please try refreshing the page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Interior Design Agent
              </h1>
              <p className="text-gray-600 mt-1 text-sm font-medium">
                AI-powered wall elevation designer
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium shadow-md">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Powered
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Elevation View */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="mb-6 pb-6 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{wall.name}</h2>
                    <div className="flex items-center gap-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">{wall.widthFeet}&apos; W × {wall.heightFeet}&apos; H</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">Scale: 1/2&quot; = 1&apos;-0&quot;</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <ElevationCanvas
                wall={wall}
                targetWidth={800}
                onFixtureUpdate={handleFixturesUpdated}
              />
            </div>

            {/* Fixture List */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-300">
              <FixtureList
                fixtures={wall.fixtures}
                onDelete={(id) => {
                  fetch(`/api/fixtures/${id}`, { method: 'DELETE' })
                    .then(() => handleFixturesUpdated());
                }}
              />
            </div>
          </div>

          {/* Right Column - AI Chat */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24 hover:shadow-xl transition-shadow duration-300">
              <AIAgentChat
                wallId={wallId}
                onFixturesUpdated={handleFixturesUpdated}
              />
            </div>

            {/* Quick Reference */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100 shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-bold text-gray-900">Quick Reference</h3>
              </div>
              <div className="text-sm text-gray-700 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-900 min-w-[80px]">Wall Size:</span>
                  <span>{wall.widthFeet * 12}&quot; W × {wall.heightFeet * 12}&quot; H</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-900 min-w-[80px]">Scale:</span>
                  <span>0.5&quot; = 1 foot</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-900 min-w-[80px]">Position:</span>
                  <span>X from left, Y from bottom (inches)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg border border-gray-100 p-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How to Use</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Follow these simple steps to create professional wall elevations with AI assistance</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group">
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl mb-4 text-2xl font-bold shadow-lg group-hover:shadow-xl transition-shadow">
                1
              </div>
              <h3 className="font-bold mb-3 text-gray-900 text-lg">Describe Your Design</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Use natural language to tell the AI what fixtures you want to add to the wall elevation.
              </p>
            </div>
            <div className="group">
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl mb-4 text-2xl font-bold shadow-lg group-hover:shadow-xl transition-shadow">
                2
              </div>
              <h3 className="font-bold mb-3 text-gray-900 text-lg">Specify Details</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Include dimensions (width × height in inches) and position (X, Y from bottom-left corner).
              </p>
            </div>
            <div className="group">
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl mb-4 text-2xl font-bold shadow-lg group-hover:shadow-xl transition-shadow">
                3
              </div>
              <h3 className="font-bold mb-3 text-gray-900 text-lg">Drag & Adjust</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Click and drag fixtures to reposition them on the grid. Changes are saved automatically.
              </p>
            </div>
            <div className="group">
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl mb-4 text-2xl font-bold shadow-lg group-hover:shadow-xl transition-shadow">
                4
              </div>
              <h3 className="font-bold mb-3 text-gray-900 text-lg">View & Export</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                See your elevation update in real-time and export as PNG when ready to share with clients.
              </p>
            </div>
          </div>

          <div className="mt-10 p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
            <h4 className="font-bold mb-5 text-gray-900 text-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Common Fixture Types
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-6 h-6 bg-blue-500 rounded-lg shadow-sm"></div>
                <span className="font-medium text-gray-700">Sink</span>
              </div>
              <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-6 h-6 bg-teal-400 rounded-lg shadow-sm"></div>
                <span className="font-medium text-gray-700">Mirror</span>
              </div>
              <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-6 h-6 bg-orange-500 rounded-lg shadow-sm"></div>
                <span className="font-medium text-gray-700">Light</span>
              </div>
              <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-6 h-6 bg-red-600 rounded-lg shadow-sm"></div>
                <span className="font-medium text-gray-700">Outlet</span>
              </div>
              <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-6 h-6 bg-green-500 rounded-lg shadow-sm"></div>
                <span className="font-medium text-gray-700">Window</span>
              </div>
              <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-6 h-6 bg-yellow-700 rounded-lg shadow-sm"></div>
                <span className="font-medium text-gray-700">Cabinet</span>
              </div>
              <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-6 h-6 bg-purple-600 rounded-lg shadow-sm"></div>
                <span className="font-medium text-gray-700">Door</span>
              </div>
              <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-6 h-6 bg-gray-500 rounded-lg shadow-sm"></div>
                <span className="font-medium text-gray-700">Other</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gradient-to-br from-gray-900 to-gray-800 border-t border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">Interior Design Agent</h3>
            <p className="text-gray-400 mb-6">Built with Next.js & AI-powered architecture</p>
            <div className="bg-gray-800 rounded-xl p-4 max-w-2xl mx-auto border border-gray-700">
              <p className="text-sm text-gray-300 mb-2">
                <span className="font-semibold text-blue-400">Getting Started:</span> To use the AI features, add your API key to the environment
              </p>
              <code className="text-xs bg-gray-900 text-green-400 px-3 py-2 rounded-lg inline-block font-mono">
                ANTHROPIC_API_KEY=your_key_here
              </code>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-gray-500 text-sm">© 2024 Interior Design Agent. Powered by AI.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
