import { Ref } from 'react';
import { WallWithFixtures, Fixture } from '@/types';
import ElevationCanvas from '@/components/elevation/ElevationCanvas';
import WallInfo from '@/components/shared/WallInfo';

interface WallTabProps {
  wall: WallWithFixtures;
  canvasWidth: number;
  canvasContainerRef: Ref<HTMLDivElement>;
  onFixturesUpdated: (fixtures?: Fixture[]) => Promise<void> | void;
}

export default function WallTab({ wall, canvasWidth, canvasContainerRef, onFixturesUpdated }: WallTabProps) {
  return (
    <div className="flex-1 flex gap-3 min-h-0">
      <WallInfo wall={wall} />
      <div
        ref={canvasContainerRef}
        className="flex-1 flex items-center justify-center min-h-0 overflow-hidden"
      >
        <ElevationCanvas
          wall={wall}
          targetWidth={canvasWidth}
          onFixtureUpdate={onFixturesUpdated}
        />
      </div>
    </div>
  );
}
