'use client';

import AIAgentChat from '@/components/chat/AIAgentChat';
import { Fixture } from '@/types';

interface AssistantPanelProps {
  wallId: string;
  onFixturesUpdated: (newFixtures?: Fixture[]) => Promise<void> | void;
}

export default function AssistantPanel({
  wallId,
  onFixturesUpdated,
}: AssistantPanelProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-hidden flex flex-col">
      <AIAgentChat
        wallId={wallId}
        onFixturesUpdated={onFixturesUpdated}
      />
    </div>
  );
}
