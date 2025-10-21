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
    const bubbleColor = isUser
      ? 'bg-blue-600 text-white shadow-[0_10px_30px_rgba(37,99,235,0.25)]'
      : message.isError
        ? 'bg-red-50 text-red-900 border border-red-200 shadow-[0_10px_30px_rgba(248,113,113,0.2)]'
        : 'bg-white text-gray-800 border border-gray-200 shadow-[0_15px_45px_rgba(15,23,42,0.08)]';
    const fixturesSectionBorder = isUser ? 'border-white/40' : 'border-gray-200';

    return (
      <div
        key={message.id}
        className={`flex gap-3 ${isUser ? 'flex-row-reverse text-right' : 'text-left'}`}
      >
        <div
          className={`mt-1 flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full text-sm font-semibold ${
            isUser ? 'bg-blue-600 text-white' : 'bg-gray-900 text-white'
          }`}
        >
          {isUser ? 'You' : 'AI'}
        </div>
        <div className="max-w-[85%] space-y-2">
          <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${bubbleColor}`}>
            <p className="whitespace-pre-wrap">{message.content}</p>
            {message.fixtures && message.fixtures.length > 0 && (
              <div className={`mt-3 border-t pt-3 text-xs opacity-90 ${fixturesSectionBorder}`}>
                <p className="mb-2 font-semibold uppercase tracking-wide text-[10px] opacity-80">
                  Fixtures Added
                </p>
                <div className="space-y-1">
                  {message.fixtures.map((fixture) => (
                    <div key={fixture.id} className="flex flex-wrap items-center gap-1">
                      <span className="font-medium">{fixture.name}</span>
                      <span className="opacity-70">• {fixture.widthInches}&quot; × {fixture.heightInches}&quot;</span>
                      <span className="opacity-70">• ({fixture.positionX.toFixed(0)}&quot;, {fixture.positionY.toFixed(0)}&quot;)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
            {isUser ? 'Client' : message.isError ? 'System Alert' : 'Design Assistant'}
          </p>
        </div>
      </div>
    );
  };

  const examplePrompts = [
    'Add a 24 by 8 inch sink at 30, 36',
    'Place a 30 by 36 inch mirror at 27, 48',
    'Add a 24 by 6 inch light at 24, 78',
  ];

  const handleExampleClick = (example: string) => {
    setDraft(example);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex h-full min-h-[560px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 shadow-xl">
        <div className="relative flex items-start justify-between gap-3 border-b border-slate-200/80 bg-white/70 px-6 py-5 backdrop-blur">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">AI Design Assistant</h3>
            <p className="mt-1 text-sm text-slate-600">
              Describe fixtures to add with precise dimensions and wall positions.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" aria-hidden />
            Ready
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6" ref={scrollContainerRef} style={{ scrollbarWidth: 'thin' }}>
          <div className="flex flex-col gap-6">
            {messages.map(renderMessage)}
            {loading && (
              <div className="flex items-start gap-3 text-left">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                  AI
                </div>
                <div className="max-w-[85%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-[0_15px_45px_rgba(15,23,42,0.08)]">
                  Thinking…
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200/80 bg-white/85 px-6 py-5 backdrop-blur">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-white shadow-sm focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100 transition">
              <textarea
                id="instruction"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tell the assistant what to place on the wall…"
                className="max-h-40 w-full resize-none border-0 bg-transparent px-4 py-3 text-sm leading-6 text-slate-900 placeholder:text-slate-400 focus:outline-none"
                disabled={loading}
                rows={2}
              />
              <div className="flex shrink-0 flex-col items-center gap-2 px-3 pb-3">
                <button
                  type="submit"
                  disabled={loading || !draft.trim()}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  aria-label="Send message"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M3 5l7.5 7.5L3 20l18-7.5L3 5z" />
                  </svg>
                </button>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  ⌘ / Ctrl + ↵
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {examplePrompts.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => handleExampleClick(example)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition hover:border-blue-400 hover:text-blue-600 hover:shadow-sm"
                >
                  {example}
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
