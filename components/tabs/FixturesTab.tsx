import FixtureList from '@/components/elevation/FixtureList';
import { Fixture } from '@/types';

interface FixturesTabProps {
  fixtures: Fixture[];
  onDelete: (id: string) => void;
}

export default function FixturesTab({ fixtures, onDelete }: FixturesTabProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <FixtureList
        fixtures={fixtures}
        onDelete={onDelete}
      />
    </div>
  );
}

