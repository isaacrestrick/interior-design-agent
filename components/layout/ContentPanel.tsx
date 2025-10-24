'use client';

import { useState, useEffect, useRef } from 'react';
import TabNavigation from '@/components/tabs/TabNavigation';
import WallTab from '@/components/tabs/WallTab';
import FixturesTab from '@/components/tabs/FixturesTab';
import GuideTab from '@/components/tabs/GuideTab';
import { Fixture, WallWithFixtures } from '@/types';

type Tab = 'wall' | 'fixtures' | 'guide';

const MIN_CANVAS_WIDTH = 360;
const MAX_CANVAS_WIDTH = 720;

interface ContentPanelProps {
  wall: WallWithFixtures;
  onFixturesUpdated: (newFixtures?: Fixture[]) => Promise<void> | void;
}

export default function ContentPanel({
  wall,
  onFixturesUpdated,
}: ContentPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('wall');
  const [canvasWidth, setCanvasWidth] = useState<number>(600);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="lg:col-span-2 flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 overflow-hidden flex flex-col p-4">
        {activeTab === 'wall' && (
          <WallTab
            wall={wall}
            canvasWidth={canvasWidth}
            canvasContainerRef={canvasContainerRef}
            onFixturesUpdated={onFixturesUpdated}
          />
        )}

        {activeTab === 'fixtures' && (
          <FixturesTab fixtures={wall.fixtures} />
        )}

        {activeTab === 'guide' && (
          <GuideTab wall={wall} />
        )}
      </div>
    </div>
  );
}
