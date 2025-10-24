'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import ContentPanel from '@/components/layout/ContentPanel';
import AIAgentChat from '@/components/chat/AIAgentChat';
import LoadingState from '@/components/shared/LoadingState';
import ErrorState from '@/components/shared/ErrorState';
import { WallWithFixtures } from '@/types';

export default function Home() {
  const [wall, setWall] = useState<WallWithFixtures | null>(null);
  const [wallId] = useState<string>('wall-sample');
  const [loading, setLoading] = useState(true);

  const loadWall = useCallback(async () => {
    try {
      const response = await fetch(`/api/walls/${wallId}`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data: WallWithFixtures = await response.json();
        setWall(data);
      }
    } catch (error) {
      console.error('Error loading wall:', error);
    } finally {
      setLoading(false);
    }
  }, [wallId]);

  // Load the wall on mount
  useEffect(() => { loadWall(); }, [loadWall]);

  const handleFixturesUpdated = async () => {
    await loadWall();
  };
  if (loading) return <LoadingState />;
  if (!wall) return <ErrorState />;
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
          <ContentPanel wall={wall} onFixturesUpdated={handleFixturesUpdated} />
          <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-hidden flex flex-col">
            <AIAgentChat wallId={wallId} onFixturesUpdated={handleFixturesUpdated} />
          </div>
        </div>
      </main>
    </div>
  );
}
