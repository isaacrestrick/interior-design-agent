'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Fixture } from '@/types';

interface AIAgentChatProps {
  wallId: string;
  onFixturesUpdated: (fixtures?: Fixture[]) => void;
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

  const processInstruction = useCallback(async (rawInstruction: string) => {
    const instruction = rawInstruction.trim();
    if (!instruction || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: makeMessageId(),
      role: 'user',
      content: instruction,
    };
    setMessages(prev => [...prev, userMessage]);
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
        const shouldRefresh = data.action === 'add_fixture' || data.action === 'update_fixture';

        if (shouldRefresh) {
          onFixturesUpdated(fixturesAdded > 0 ? data.fixtures : undefined);
        }
        const assistantMessage: ChatMessage = {
          id: makeMessageId(),
          role: 'assistant',
          content: data.message || 'Command processed successfully!',
          fixtures: data.fixtures,
          action: data.action,
        };

        setMessages(prev => [...prev, assistantMessage]);
        if (shouldRefresh && fixturesAdded === 0) {
          const warningMessage: ChatMessage = {
            id: makeMessageId(),
            role: 'assistant',
            content:
              'I expected to add a fixture, but the structured data was incomplete. Try restating the dimensions and position.',
            isError: true,
          };
          setMessages(prev => [...prev, warningMessage]);
        }
      } else {
        const errorMessage: ChatMessage = {
          id: makeMessageId(),
          role: 'assistant',
          content: `Error: ${data.error || 'Unknown error'}`,
          isError: true,
        };
        setMessages(prev => [...prev, errorMessage]);
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
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [loading, messagePayload, onFixturesUpdated, wallId]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void processInstruction(draft);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void processInstruction(draft);
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    const alignment = isUser ? 'justify-end' : 'justify-start';

    return (
      <div key={message.id} className={`flex ${alignment}`}>
        <div className="max-w-[85%]">
          <div
            className={`px-3 py-2 rounded-lg text-sm ${
              isUser
                ? 'bg-blue-600 text-white'
                : message.isError
                  ? 'bg-red-50 text-red-900 border border-red-200'
                  : 'bg-white text-gray-800 border border-gray-200'
            }`}
          >
            <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
            {message.fixtures && message.fixtures.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/20 space-y-1">
                {message.fixtures.map((fixture) => (
                  <div key={fixture.id} className="text-xs opacity-90">
                    <span className="font-medium">{fixture.name}</span>
                    {' - '}
                    <span>{fixture.widthInches}&quot; × {fixture.heightInches}&quot;</span>
                    {' at '}
                    <span>({fixture.positionX.toFixed(0)}&quot;, {fixture.positionY.toFixed(0)}&quot;)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-3">
        <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
        <p className="text-sm text-gray-600 mt-1">
          Describe fixtures to add with dimensions and positions
        </p>
      </div>

      <div
        ref={scrollContainerRef}
        className="h-80 overflow-y-auto space-y-3 rounded-lg p-3 bg-gray-50 border border-gray-200"
        style={{ scrollbarWidth: 'thin' }}
      >
        {messages.map(renderMessage)}
        {loading && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-600">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          id="instruction"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a 24 by 8 inch sink at 30, 36"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px] text-sm text-gray-900 placeholder:text-gray-400"
          disabled={loading}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs text-gray-500">
            Press ⌘ + Enter (Ctrl + Enter on Windows) to send
          </p>
          <button
            type="submit"
            disabled={loading || !draft.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {loading ? 'Processing...' : 'Send'}
          </button>
        </div>
      </form>

      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <p className="font-semibold text-xs text-gray-700 mb-2">Examples:</p>
        <ul className="space-y-1 text-xs text-gray-600">
          <li>• Add a 24 by 8 inch sink at 30, 36</li>
          <li>• Place a 30 by 36 inch mirror at 27, 48</li>
          <li>• Add a 24 by 6 inch light at 24, 78</li>
        </ul>
      </div>
    </div>
  );
}
