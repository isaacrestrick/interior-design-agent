'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/layout/Header';
import ContentPanel from '@/components/layout/ContentPanel';
import AssistantPanel from '@/components/layout/AssistantPanel';
import LoadingState from '@/components/shared/LoadingState';
import ErrorState from '@/components/shared/ErrorState';
import { Fixture, WallWithFixtures } from '@/types';

export default function Home() {
  const [wall, setWall] = useState<WallWithFixtures | null>(null);
  const [wallId, setWallId] = useState<string>('wall-sample');
  const [loading, setLoading] = useState(true);
  const wallRequestIdRef = useRef(0);

  const loadWall = async (id: string) => {
    const requestId = ++wallRequestIdRef.current;
    try {
      const response = await fetch(`/api/walls/${id}`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data: WallWithFixtures = await response.json();

        if (requestId !== wallRequestIdRef.current) {
          return;
        }

        setWall(data);
      }
    } catch (error) {
      console.error('Error loading wall:', error);
    } finally {
      if (requestId === wallRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  // load the wall when the wallId changes
  useEffect(() => { loadWall(wallId); }, [wallId]);

  const handleFixturesUpdated = async (updatedFixtures?: Fixture[]) => {
    if (wallId) {
      await loadWall(wallId);
    }
  };
  if (loading) return <LoadingState />;
  if (!wall) return <ErrorState />;
  else return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
          <ContentPanel wall={wall} onFixturesUpdated={handleFixturesUpdated} />
          <AssistantPanel wallId={wallId} onFixturesUpdated={handleFixturesUpdated} />
        </div>
      </main>
    </div>
  )
}
