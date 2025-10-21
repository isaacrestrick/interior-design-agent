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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-black">Loading...</div>
        </div>
      </div>
    );
  }

  if (!wall) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-red-600">Error loading wall</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-black">
            Interior Design Agent
          </h1>
          <p className="text-black mt-1">
            AI-powered wall elevation designer
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Elevation View */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-semibold text-black">{wall.name}</h2>
                <p className="text-black">
                  {wall.widthFeet}&apos; W × {wall.heightFeet}&apos; H
                  (Scale: 1/2&quot; = 1&apos;-0&quot;)
                </p>
              </div>

              <ElevationCanvas
                wall={wall}
                targetWidth={800}
                onFixtureUpdate={handleFixturesUpdated}
              />
            </div>

            {/* Fixture List */}
            <div className="bg-white rounded-lg shadow-md p-6">
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
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <AIAgentChat
                wallId={wallId}
                onFixturesUpdated={handleFixturesUpdated}
              />
            </div>

            {/* Quick Reference */}
            <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Quick Reference</h3>
              <div className="text-xs text-blue-800 space-y-1">
                <p><strong>Wall Size:</strong> {wall.widthFeet * 12}&quot; W × {wall.heightFeet * 12}&quot; H</p>
                <p><strong>Scale:</strong> 0.5&quot; = 1 foot</p>
                <p><strong>Position:</strong> X from left, Y from bottom (in inches)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-black">How to Use</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="text-3xl mb-2">1️⃣</div>
              <h3 className="font-semibold mb-2 text-black">Describe Your Design</h3>
              <p className="text-sm text-black">
                Use natural language to tell the AI what fixtures you want to add to the wall elevation.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">2️⃣</div>
              <h3 className="font-semibold mb-2 text-black">Specify Details</h3>
              <p className="text-sm text-black">
                Include dimensions (width × height in inches) and position (X, Y from bottom-left corner).
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">3️⃣</div>
              <h3 className="font-semibold mb-2 text-black">Drag & Adjust</h3>
              <p className="text-sm text-black">
                Click and drag fixtures to reposition them on the grid. Changes are saved automatically.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">4️⃣</div>
              <h3 className="font-semibold mb-2 text-black">View & Export</h3>
              <p className="text-sm text-black">
                See your elevation update in real-time and export as PNG when ready to share with clients.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2 text-black">Common Fixture Types:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>Sink</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-teal-400 rounded"></div>
                <span>Mirror</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span>Light</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-600 rounded"></div>
                <span>Outlet</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Window</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-700 rounded"></div>
                <span>Cabinet</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-600 rounded"></div>
                <span>Door</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-500 rounded"></div>
                <span>Other</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-black">
          <p>Interior Design Agent - Built with Next.js & AI</p>
          <p className="mt-1">
            To use the AI features, add your <code className="bg-gray-100 px-2 py-1 rounded">ANTHROPIC_API_KEY</code> to the .env file
          </p>
        </div>
      </footer>
    </div>
  );
}
