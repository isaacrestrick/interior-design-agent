import FixtureList from '@/components/elevation/FixtureList';
import { Fixture } from '@/types';

interface FixturesTabProps {
  fixtures: Fixture[];
}

export default function FixturesTab({ fixtures }: FixturesTabProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <FixtureList
        fixtures={fixtures}
      />
    </div>
  );
}

