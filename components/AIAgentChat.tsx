'use client';

import { useState } from 'react';

interface AIAgentChatProps {
  wallId: string;
  onFixturesUpdated: () => void;
}

export default function AIAgentChat({ wallId, onFixturesUpdated }: AIAgentChatProps) {
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim()) return;

    setLoading(true);
    setResponse('');

    try {
      const res = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: instruction.trim(),
          wallId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResponse(data.message || 'Command processed successfully!');
        if (data.action === 'add_fixture' || data.action === 'update_fixture') {
          onFixturesUpdated();
        }
      } else {
        setResponse(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Failed to process'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">AI Design Assistant</h3>
        <p className="text-sm text-gray-900">
          Tell the AI what fixtures to add to this wall elevation. Be specific about dimensions and positions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="instruction" className="block text-sm font-medium text-gray-700 mb-1">
            Your Instructions
          </label>
          <textarea
            id="instruction"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Example: Add a 24 by 8 inch sink at 30 inches from left and 36 inches from bottom"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !instruction.trim()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processing...' : 'Send to AI'}
        </button>
      </form>

      {response && (
        <div className={`p-4 rounded-lg ${
          response.startsWith('Error')
            ? 'bg-red-50 border border-red-200 text-red-800'
            : 'bg-green-50 border border-green-200 text-green-800'
        }`}>
          <p className="text-sm whitespace-pre-wrap">{response}</p>
        </div>
      )}

      <div className="text-xs text-gray-900 space-y-1">
        <p className="font-semibold">Example commands:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Add a 24 by 8 inch vanity sink at position 30, 36</li>
          <li>Place a 30 by 36 inch mirror at 27 inches from left, 48 inches from bottom</li>
          <li>Add a 24 by 6 inch light fixture centered at 78 inches high</li>
          <li>Put a 4 by 6 inch GFCI outlet at 60, 42</li>
        </ul>
      </div>
    </div>
  );
}
