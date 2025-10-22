'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Fixture } from '@/types';

interface AIAgentChatProps {
  wallId: string;
  onFixturesUpdated: (fixtures?: Fixture[]) => Promise<void> | void;
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
  const quickPrompts = useMemo(
    () => [
      'Add a 30 by 36 inch mirror at 24, 60',
      'Swap the faucet for something slimmer',
      'Center the vanity light over the sink',
    ],
    []
  );

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const processInstruction = useCallback(async (rawInstruction: string) => {
    const instruction = rawInstruction.trim();
    if (!instruction) {
      return;
    }

    setLoading(prev => {
      if (prev) return prev; // Already loading
      return true;
    });

    const userMessage: ChatMessage = {
      id: makeMessageId(),
      role: 'user',
      content: instruction,
    };

    let conversation: Array<{ role: ChatRole; content: string }> = [];
    setMessages(prev => {
      conversation = [...prev.map(({ role, content }) => ({ role, content })), { role: 'user', content: instruction }];
      return [...prev, userMessage];
    });

    setDraft('');

    try {
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
  }, [onFixturesUpdated, wallId]);

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

  const handleQuickPrompt = (prompt: string) => {
    void processInstruction(prompt);
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    const bubbleColor = isUser
      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
      : message.isError
        ? 'bg-red-50 text-red-900 border border-red-200'
        : 'bg-white text-gray-800 border border-gray-200';

    return (
      <div
        key={message.id}
        className={`flex gap-3 ${isUser ? 'flex-row-reverse text-right' : 'text-left'}`}
      >
        <div
          className={`mt-1 h-8 w-8 shrink-0 rounded-full border border-white/40 ${
            isUser ? 'bg-blue-600/80 text-white' : 'bg-slate-200 text-slate-600'
          } flex items-center justify-center text-xs font-semibold uppercase`}
        >
          {isUser ? 'You' : 'AI'}
        </div>
        <div className="max-w-[78%] sm:max-w-[70%]">
          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed transition-colors ${bubbleColor}`}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
            {message.fixtures && message.fixtures.length > 0 && (
              <div
                className={`mt-3 space-y-2 rounded-xl border ${
                  isUser ? 'border-white/30 bg-white/10' : 'border-gray-200 bg-gray-50'
                } p-3 text-xs`}
              >
                <p
                  className={`font-semibold ${
                    isUser ? 'text-white/80' : 'text-gray-700'
                  }`}
                >
                  Fixtures suggested
                </p>
                {message.fixtures.map(fixture => (
                  <div
                    key={fixture.id}
                    className={`${isUser ? 'text-white/80' : 'text-gray-600'}`}
                  >
                    <span className="font-medium">{fixture.name}</span>
                    {' • '}
                    <span>{fixture.widthInches}&quot; × {fixture.heightInches}&quot;</span>
                    {' @ '}
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
    <div className="flex flex-col h-full">
      <div className="flex h-full min-h-[30rem] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="relative border-b border-slate-200 bg-gradient-to-r from-slate-900 via-blue-900 to-blue-600 px-6 py-5 text-white">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold tracking-tight">AI Design Companion</h3>
              <p className="text-sm text-blue-100">
                Describe fixtures with measurements and placement &mdash; I will update the wall for you.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-100/80">
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-300"></span>
              Ready to help
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {quickPrompts.map(prompt => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleQuickPrompt(prompt)}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white transition hover:border-white/40 hover:bg-white/20"
                disabled={loading}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col min-h-0">
          <div className="relative flex-1 overflow-hidden min-h-0">
            <div className="absolute inset-0 bg-slate-50" aria-hidden />
            <div className="relative h-full overflow-y-auto px-6 py-6 space-y-5" ref={scrollContainerRef} style={{ scrollbarWidth: 'thin' }}>
              {messages.map(renderMessage)}
              {loading && (
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-500">
                    AI
                  </span>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:120ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-200 [animation-delay:240ms]" />
                    <span className="text-xs font-medium text-slate-500">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white px-6 py-4">
            <label htmlFor="instruction" className="sr-only">
              Send a message to the AI assistant
            </label>
            <div className="relative">
              <textarea
                id="instruction"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the fixture you want to add with measurements and placement"
                className="min-h-[80px] w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-70"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !draft.trim()}
                className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                aria-label="Send message"
              >
                <span className="text-base">➤</span>
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Share dimensions, placement, or adjustments and I&apos;ll figure it out.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
