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
    const isUser = message.role === 'user';
    const alignment = isUser ? 'items-end' : 'items-start';

    return (
      <div key={message.id} className={`flex ${alignment} animate-fade-in`}>
        <div className={`max-w-[85%] ${isUser ? '' : 'flex items-start gap-2'}`}>
          {!isUser && (
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div
            className={`px-4 py-3 rounded-2xl shadow-md ${
              isUser
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                : message.isError
                  ? 'bg-red-50 text-red-900 border-2 border-red-200'
                  : 'bg-white text-gray-800 border-2 border-gray-200'
            }`}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            {message.fixtures && message.fixtures.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="font-bold text-xs uppercase tracking-wide">
                    {message.fixtures.length} Fixture{message.fixtures.length > 1 ? 's' : ''} Added
                  </p>
                </div>
                <div className="space-y-2">
                  {message.fixtures.map((fixture) => (
                    <div
                      key={fixture.id}
                      className="text-xs bg-white/10 rounded-lg p-2 backdrop-blur-sm"
                    >
                      <div className="font-semibold mb-1">{fixture.name}</div>
                      <div className="flex flex-wrap gap-2 text-xs opacity-90">
                        <span className="px-2 py-0.5 bg-white/20 rounded">
                          {fixture.type}
                        </span>
                        <span className="px-2 py-0.5 bg-white/20 rounded">
                          {fixture.widthInches}&quot; × {fixture.heightInches}&quot;
                        </span>
                        <span className="px-2 py-0.5 bg-white/20 rounded">
                          ({fixture.positionX.toFixed(1)}&quot;, {fixture.positionY.toFixed(1)}&quot;)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {isUser && (
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center shadow-md ml-2">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">AI Design Assistant</h3>
            <p className="text-xs text-gray-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Online and ready to help
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          Describe what fixtures you&apos;d like to add. Be specific about dimensions and positions for best results.
        </p>
      </div>

      <div
        ref={scrollContainerRef}
        className="h-80 overflow-y-auto space-y-4 rounded-2xl p-4 bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-gray-200 shadow-inner"
        style={{ scrollbarWidth: 'thin' }}
      >
        {messages.map(renderMessage)}
        {loading && (
          <div className="flex items-start animate-fade-in">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white border-2 border-gray-200 shadow-md">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-sm text-gray-600 font-medium">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="instruction" className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Your Message
          </label>
          <textarea
            id="instruction"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Example: Add a 24 by 8 inch sink at 30 inches from left and 36 inches from bottom"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] text-gray-900 placeholder:text-gray-400 shadow-sm transition-all duration-200"
            disabled={loading}
          />
        </div>

        <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
          <div className="flex items-start gap-2 text-xs text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
            <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Send follow-up messages to refine your design—the AI remembers context.</span>
          </div>
          <button
            type="submit"
            disabled={loading || !draft.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-sm whitespace-nowrap"
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send
              </>
            )}
          </button>
        </div>
      </form>

      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="font-bold text-sm text-gray-900">Example Commands</p>
        </div>
        <ul className="space-y-2 text-xs text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-purple-500 flex-shrink-0">•</span>
            <span>Add a 24 by 8 inch vanity sink at position 30, 36</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 flex-shrink-0">•</span>
            <span>Place a 30 by 36 inch mirror at 27 inches from left, 48 inches from bottom</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 flex-shrink-0">•</span>
            <span>Add a 24 by 6 inch light fixture centered at 78 inches high</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 flex-shrink-0">•</span>
            <span>Put a 4 by 6 inch GFCI outlet at 60, 42</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
