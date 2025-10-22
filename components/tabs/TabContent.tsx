'use client';

import { Ref } from 'react';
import WallTab from '@/components/tabs/WallTab';
import FixturesTab from '@/components/tabs/FixturesTab';
import GuideTab from '@/components/tabs/GuideTab';
import { Fixture, WallWithFixtures } from '@/types';

type Tab = 'wall' | 'fixtures' | 'guide';

interface TabContentProps {
  activeTab: Tab;
  wall: WallWithFixtures;
  canvasWidth: number;
  canvasContainerRef: Ref<HTMLDivElement>;
  onFixturesUpdated: (newFixtures?: Fixture[]) => Promise<void> | void;
  onDeleteFixture: (id: string) => void;
}

export default function TabContent({
  activeTab,
  wall,
  canvasWidth,
  canvasContainerRef,
  onFixturesUpdated,
  onDeleteFixture,
}: TabContentProps) {
  return (
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
        <FixturesTab
          fixtures={wall.fixtures}
          onDelete={onDeleteFixture}
        />
      )}

      {activeTab === 'guide' && (
        <GuideTab wall={wall} />
      )}
    </div>
  );
}
