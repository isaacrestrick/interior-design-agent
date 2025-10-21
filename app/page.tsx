'use client';

import { useState, useEffect, useRef } from 'react';
import ElevationCanvas from '@/components/elevation/ElevationCanvas';
import FixtureList from '@/components/elevation/FixtureList';
import AIAgentChat from '@/components/AIAgentChat';
import { WallWithFixtures } from '@/types';

const MIN_CANVAS_WIDTH = 360;
const MAX_CANVAS_WIDTH = 720;

type Tab = 'wall' | 'fixtures' | 'guide';

export default function Home() {
  const [wall, setWall] = useState<WallWithFixtures | null>(null);
  const [wallId, setWallId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('wall');
  const [canvasWidth, setCanvasWidth] = useState<number>(600);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (activeTab !== 'wall') {
      return;
    }

    const container = canvasContainerRef.current;
    if (!container) {
      return;
    }

    const clampWidth = (width: number) => {
      if (width < MIN_CANVAS_WIDTH) {
        return width;
      }
      return Math.min(width, MAX_CANVAS_WIDTH);
    };

    const applyWidth = (width: number) => {
      if (!width) {
        return;
      }
      const clamped = clampWidth(width);
      setCanvasWidth(prev => (Math.abs(prev - clamped) < 1 ? prev : clamped));
    };

    applyWidth(container.clientWidth);

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(entries => {
        entries.forEach(entry => {
          applyWidth(entry.contentRect.width);
        });
      });
      observer.observe(container);
      return () => observer.disconnect();
    }

    const handleResize = () => {
      applyWidth(container.clientWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab, wall]);

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
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <h1 className="text-xl font-semibold text-gray-900">Interior Design Agent</h1>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
          {/* Left Column - Tabbed Content */}
          <div className="lg:col-span-2 flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-200 flex">
              <button
                onClick={() => setActiveTab('wall')}
                className={`px-4 py-3 text-sm font-medium ${
                  activeTab === 'wall'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Wall
              </button>
              <button
                onClick={() => setActiveTab('fixtures')}
                className={`px-4 py-3 text-sm font-medium ${
                  activeTab === 'fixtures'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Fixtures
              </button>
              <button
                onClick={() => setActiveTab('guide')}
                className={`px-4 py-3 text-sm font-medium ${
                  activeTab === 'guide'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Guide
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden flex flex-col p-4">
              {activeTab === 'wall' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{wall.name}</h2>
                      <p className="text-sm text-gray-600">
                        {wall.widthFeet}&apos; W × {wall.heightFeet}&apos; H • Scale: 1/2&quot; = 1&apos;-0&quot;
                      </p>
                    </div>
                  </div>
                  <div
                    ref={canvasContainerRef}
                    className="flex-1 flex items-center justify-center min-h-0 overflow-hidden px-2"
                  >
                    <ElevationCanvas
                      wall={wall}
                      targetWidth={canvasWidth}
                      onFixtureUpdate={handleFixturesUpdated}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'fixtures' && (
                <div className="flex-1 overflow-y-auto">
                  <FixtureList
                    fixtures={wall.fixtures}
                    onDelete={(id) => {
                      fetch(`/api/fixtures/${id}`, { method: 'DELETE' })
                        .then(() => handleFixturesUpdated());
                    }}
                  />
                </div>
              )}

              {activeTab === 'guide' && (
                <div className="flex-1 overflow-y-auto space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Use</h2>
                    <p className="text-gray-600">Create professional wall elevations with AI assistance</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-lg mb-3 flex items-center justify-center font-bold">
                        1
                      </div>
                      <h3 className="font-semibold mb-2 text-gray-900">Describe Your Design</h3>
                      <p className="text-sm text-gray-600">
                        Use natural language to tell the AI what fixtures you want to add to the wall elevation.
                      </p>
                    </div>
                    <div>
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-lg mb-3 flex items-center justify-center font-bold">
                        2
                      </div>
                      <h3 className="font-semibold mb-2 text-gray-900">Specify Details</h3>
                      <p className="text-sm text-gray-600">
                        Include dimensions (width × height in inches) and position (X, Y from bottom-left corner).
                      </p>
                    </div>
                    <div>
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-lg mb-3 flex items-center justify-center font-bold">
                        3
                      </div>
                      <h3 className="font-semibold mb-2 text-gray-900">Drag & Adjust</h3>
                      <p className="text-sm text-gray-600">
                        Click and drag fixtures to reposition them on the grid. Changes are saved automatically.
                      </p>
                    </div>
                    <div>
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-lg mb-3 flex items-center justify-center font-bold">
                        4
                      </div>
                      <h3 className="font-semibold mb-2 text-gray-900">View & Export</h3>
                      <p className="text-sm text-gray-600">
                        See your elevation update in real-time and export as PNG when ready to share with clients.
                      </p>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="font-semibold mb-4 text-gray-900">Common Fixture Types</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span>Sink</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 bg-teal-400 rounded"></div>
                        <span>Mirror</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 bg-orange-500 rounded"></div>
                        <span>Light</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 bg-red-600 rounded"></div>
                        <span>Outlet</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span>Window</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 bg-yellow-700 rounded"></div>
                        <span>Cabinet</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 bg-purple-600 rounded"></div>
                        <span>Door</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 bg-gray-500 rounded"></div>
                        <span>Other</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2 text-gray-900">Quick Reference</h3>
                    <div className="text-sm text-gray-700 space-y-1">
                      <div><span className="font-medium">Wall Size:</span> {wall.widthFeet * 12}&quot; W × {wall.heightFeet * 12}&quot; H</div>
                      <div><span className="font-medium">Scale:</span> 0.5&quot; = 1 foot</div>
                      <div><span className="font-medium">Position:</span> X from left, Y from bottom (inches)</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - AI Chat */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-hidden flex flex-col">
            <AIAgentChat
              wallId={wallId}
              onFixturesUpdated={handleFixturesUpdated}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
