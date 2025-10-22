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
  const [wallId, setWallId] = useState<string>('');
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

  useEffect(() => {
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

  const handleFixturesUpdated = async (updatedFixtures?: Fixture[]) => {
    if (updatedFixtures && updatedFixtures.length > 0) {
      setWall(prev => {
        if (!prev) {
          return prev;
        }

        const fixturesById = new Map(prev.fixtures.map(fixture => [fixture.id, fixture]));

        updatedFixtures.forEach(fixture => {
          fixturesById.set(fixture.id, fixture);
        });

        return {
          ...prev,
          fixtures: Array.from(fixturesById.values()),
        };
      });
    }

    if (wallId) {
      await loadWall(wallId);
    }
  };

  const handleDeleteFixture = (id: string) => {
    fetch(`/api/fixtures/${id}`, { method: 'DELETE' })
      .then(() => handleFixturesUpdated());
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!wall) {
    return <ErrorState />;
  }


  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
          <ContentPanel
            wall={wall}
            onFixturesUpdated={handleFixturesUpdated}
            onDeleteFixture={handleDeleteFixture}
          />

          <AssistantPanel
            wallId={wallId}
            onFixturesUpdated={handleFixturesUpdated}
          />
        </div>
      </main>
    </div>
  );
}
