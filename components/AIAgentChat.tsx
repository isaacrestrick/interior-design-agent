'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Fixture } from '@/types';

interface AIAgentChatProps {
  wallId: string;
  onFixturesUpdated: () => void;
}

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  fixtures?: Fixture[];
  action?: string;
  isError?: boolean;
}

const makeMessageId = () => Math.random().toString(36).slice(2);

export default function AIAgentChat({ wallId, onFixturesUpdated }: AIAgentChatProps) {
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: makeMessageId(),
      role: 'assistant',
      content:
        'Hi! I can help add or adjust fixtures on this wall. Try asking for a new sink, mirror, or talk through tweaks—you can send follow-up messages and I will remember the conversation.',
    },
  ]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const messagePayload = useMemo(
    () =>
      messages.map(({ role, content }) => ({
        role,
        content,
      })),
    [messages]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const instruction = draft.trim();
    if (!instruction) return;

    const userMessage: ChatMessage = {
      id: makeMessageId(),
      role: 'user',
      content: instruction,
    };
    setMessages((prev) => [...prev, userMessage]);
    setDraft('');
    setLoading(true);

    try {
      const conversation = [...messagePayload, { role: 'user', content: instruction }];

      const res = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallId,
          instruction,
          messages: conversation,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const fixturesAdded = Array.isArray(data.fixtures) ? data.fixtures.length : 0;
        if (
          (data.action === 'add_fixture' || data.action === 'update_fixture') &&
          fixturesAdded > 0
        ) {
          onFixturesUpdated();
        }
        const assistantMessage: ChatMessage = {
          id: makeMessageId(),
          role: 'assistant',
          content: data.message || 'Command processed successfully!',
          fixtures: data.fixtures,
          action: data.action,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        if (
          (data.action === 'add_fixture' || data.action === 'update_fixture') &&
          fixturesAdded === 0
        ) {
          const warningMessage: ChatMessage = {
            id: makeMessageId(),
            role: 'assistant',
            content:
              'I expected to add a fixture, but the structured data was incomplete. Try restating the dimensions and position.',
            isError: true,
          };
          setMessages((prev) => [...prev, warningMessage]);
        }
      } else {
        const errorMessage: ChatMessage = {
          id: makeMessageId(),
          role: 'assistant',
          content: `Error: ${data.error || 'Unknown error'}`,
          isError: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const fallbackError =
        error instanceof Error ? error.message : 'Failed to process request';
      const errorMessage: ChatMessage = {
        id: makeMessageId(),
        role: 'assistant',
        content: `Error: ${fallbackError}`,
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const alignment = message.role === 'user' ? 'items-end' : 'items-start';
    const bubbleColor =
      message.role === 'user'
        ? 'bg-blue-600 text-white'
        : message.isError
          ? 'bg-red-50 text-red-800 border border-red-200'
          : 'bg-gray-100 text-black';

    return (
      <div key={message.id} className={`flex ${alignment}`}>
        <div className={`max-w-[80%] px-3 py-2 rounded-lg ${bubbleColor}`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          {message.fixtures && message.fixtures.length > 0 && (
            <div className="mt-2 text-xs">
              <p className="font-semibold">
                Fixture{message.fixtures.length > 1 ? 's' : ''} added:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {message.fixtures.map((fixture) => (
                  <li key={fixture.id}>
                    {fixture.name} ({fixture.type}) — {fixture.widthInches} in × {fixture.heightInches} in at ({fixture.positionX} in, {fixture.positionY} in)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2 text-black">AI Design Assistant</h3>
        <p className="text-sm text-black">
          Tell the AI what fixtures to add to this wall elevation. Be specific about dimensions and positions.
        </p>
      </div>

      <div
        ref={scrollContainerRef}
        className="h-64 overflow-y-auto space-y-3 border border-gray-200 rounded-lg p-3 bg-white"
      >
        {messages.map(renderMessage)}
        {loading && (
          <div className="flex items-start">
            <div className="max-w-[80%] px-3 py-2 rounded-lg bg-gray-100 text-black text-sm">
              Thinking…
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="instruction" className="block text-sm font-medium text-black mb-1">
            Your Message
          </label>
          <textarea
            id="instruction"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Example: Add a 24 by 8 inch sink at 30 inches from left and 36 inches from bottom"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[90px] text-black placeholder:text-gray-400"
            disabled={loading}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Tip: Send follow-up tweaks or questions—previous messages stay in context.
          </p>
          <button
            type="submit"
            disabled={loading || !draft.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing…' : 'Send'}
          </button>
        </div>
      </form>

      <div className="text-xs text-black space-y-1">
        <p className="font-semibold text-black">Example commands:</p>
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
