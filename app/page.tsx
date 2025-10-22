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
  const pendingFixturesRef = useRef<Fixture[]>([]);
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

        setWall(prev => {
          const pending = pendingFixturesRef.current;

          if (!pending || pending.length === 0) {
            return data;
          }

          const pendingById = new Map(pending.map(fixture => [fixture.id, fixture]));

          data.fixtures.forEach((fixture: Fixture) => {
            pendingById.delete(fixture.id);
          });

          const stillPending = Array.from(pendingById.values());
          pendingFixturesRef.current = stillPending;

          if (stillPending.length === 0) {
            return data;
          }

          return {
            ...data,
            fixtures: [...data.fixtures, ...stillPending],
          };
        });
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

  const handleFixturesUpdated = (newFixtures?: Fixture[]) => {
    setWall(prev => {
      if (!prev || !newFixtures || newFixtures.length === 0) {
        return prev;
      }

      const existingIds = new Set(prev.fixtures.map(fixture => fixture.id));
      const additions = newFixtures.filter(fixture => !existingIds.has(fixture.id));

      if (additions.length === 0) {
        return prev;
      }

      const pendingById = new Map(pendingFixturesRef.current.map(fixture => [fixture.id, fixture]));
      additions.forEach(fixture => {
        pendingById.set(fixture.id, fixture);
      });
      pendingFixturesRef.current = Array.from(pendingById.values());

      return {
        ...prev,
        fixtures: [...prev.fixtures, ...additions],
      };
    });

    if (wallId) {
      loadWall(wallId);
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
