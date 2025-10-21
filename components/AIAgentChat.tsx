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

    return (
      <div
        key={message.id}
        className={`flex w-full gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        {!isUser && (
          <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-blue-200 to-blue-400 text-xs font-semibold text-blue-900 flex items-center justify-center shadow-inner">
            AI
          </div>
        )}
        <div className={`max-w-[80%] space-y-1 ${isUser ? 'items-end text-right' : ''}`}>
          <span
            className={`text-[11px] font-semibold uppercase tracking-wide ${
              isUser ? 'text-blue-400' : message.isError ? 'text-red-500' : 'text-gray-500'
            }`}
          >
            {isUser ? 'You' : message.isError ? 'Assistant (Issue)' : 'Assistant'}
          </span>
          <div
            className={`rounded-2xl px-4 py-3 text-sm shadow-sm transition-colors ${
              isUser
                ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white'
                : message.isError
                  ? 'bg-red-50 text-red-900 border border-red-200'
                  : 'bg-white text-gray-800 border border-gray-200'
            }`}
          >
            <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
            {message.fixtures && message.fixtures.length > 0 && (
              <div className="mt-3 rounded-xl border border-white/30 bg-white/10 p-3 text-left">
                <p className={`text-xs font-semibold ${isUser ? 'text-blue-50' : 'text-gray-700'}`}>
                  Fixtures I updated
                </p>
                <div className="mt-2 space-y-1 text-xs">
                  {message.fixtures.map((fixture) => (
                    <div key={fixture.id} className={`flex flex-wrap justify-between gap-1 ${isUser ? 'text-blue-50/90' : 'text-gray-700'}`}>
                      <span className="font-medium">{fixture.name}</span>
                      <span>
                        {fixture.widthInches}&quot; × {fixture.heightInches}&quot; · ({fixture.positionX.toFixed(0)}&quot;, {fixture.positionY.toFixed(0)}&quot;)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {isUser && (
          <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-semibold text-white flex items-center justify-center shadow-lg">
            You
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 rounded-3xl border border-gray-200 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-6 shadow-xl shadow-slate-200/60">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">AI Design Assistant</h3>
          <p className="mt-1 text-sm text-slate-600">
            Describe fixtures to add with dimensions and positions.
          </p>
        </div>
        <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white shadow-lg">
          ✨
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-inner">
        <div
          ref={scrollContainerRef}
          className="flex h-[420px] flex-col gap-4 overflow-y-auto pr-1"
          style={{ scrollbarWidth: 'thin' }}
        >
          {messages.map(renderMessage)}
          {loading && (
            <div className="flex w-full gap-3">
              <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-blue-200 to-blue-400 text-xs font-semibold text-blue-900 flex items-center justify-center shadow-inner">
                AI
              </div>
              <div className="max-w-[80%] space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Assistant
                </span>
                <div className="flex items-center gap-2 rounded-2xl border border-dashed border-blue-200 bg-blue-50/80 px-4 py-3 text-sm text-blue-600">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" aria-hidden />
                  Thinking...
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-lg shadow-slate-200/50 backdrop-blur"
      >
        <label htmlFor="instruction" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Compose a message
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="relative flex-1">
            <textarea
              id="instruction"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a 24 by 8 inch sink at 30, 36"
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-16 text-sm text-slate-900 shadow-inner transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-[90px] placeholder:text-slate-400 disabled:bg-slate-100"
              disabled={loading}
            />
            <div className="pointer-events-none absolute bottom-3 right-4 text-[11px] font-medium uppercase tracking-wide text-slate-300">
              ⌘⏎
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !draft.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-transform hover:translate-y-[-1px] hover:shadow-xl disabled:cursor-not-allowed disabled:from-slate-300 disabled:via-slate-300 disabled:to-slate-300"
          >
            {loading ? (
              <>
                <span className="h-2 w-2 animate-ping rounded-full bg-white" aria-hidden />
                Sending...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                  aria-hidden
                >
                  <path d="M3.22 2.22a.75.75 0 0 1 .76-.18l12 4a.75.75 0 0 1 .02 1.4l-5.3 1.98a.75.75 0 0 0-.45.45L8.26 15.94a.75.75 0 0 1-1.4-.02l-4-12a.75.75 0 0 1 .36-.9ZM5.03 4.97l2.27 6.8 1.08-2.88a2.25 2.25 0 0 1 1.35-1.35l2.88-1.08-7.58-2.49Z" />
                  <path d="M6.74 12.26a.75.75 0 1 1 1.06 1.06l-2.25 2.25a.75.75 0 1 1-1.06-1.06l2.25-2.25Z" />
                </svg>
                Send Message
              </>
            )}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Tip: Press ⌘ + Enter (Ctrl + Enter on Windows) to send instantly.
        </p>
      </form>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4 text-sm text-slate-600">
        <p className="font-semibold uppercase tracking-wide text-slate-500">Try asking for</p>
        <ul className="mt-2 space-y-1 text-slate-600">
          <li>• Add a 24 by 8 inch sink at 30, 36</li>
          <li>• Place a 30 by 36 inch mirror at 27, 48</li>
          <li>• Add a 24 by 6 inch light at 24, 78</li>
        </ul>
      </div>
    </div>
  );
}
