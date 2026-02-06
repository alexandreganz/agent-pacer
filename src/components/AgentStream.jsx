import { useEffect, useRef } from 'react';

/**
 * AgentStream - Terminal-style console log display.
 *
 * Shows agent log messages with color-coding based on message type.
 */

const typeColors = {
  system: 'text-gray-400',
  info: 'text-blue-400',
  success: 'text-status-healthy',
  warning: 'text-status-warning',
  critical: 'text-status-critical',
  escalated: 'text-status-escalated',
};

export function AgentStream({ messages, currentIndex, isTyping }) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentIndex]);

  return (
    <div className="h-full flex flex-col bg-console-bg rounded-lg border border-gray-700">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-gray-400 text-sm font-medium ml-2">Agent Stream</span>
        {isTyping && (
          <span className="ml-auto flex items-center gap-2 text-xs text-status-healthy">
            <span className="w-2 h-2 rounded-full bg-status-healthy animate-pulse" />
            Processing...
          </span>
        )}
      </div>

      {/* Console content */}
      <div
        ref={containerRef}
        className="agent-stream flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed"
      >
        {messages.length === 0 && (
          <div className="text-gray-500 italic">
            Select a scenario to start the agent...
          </div>
        )}

        {/* Display messages */}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`${typeColors[msg.type] || 'text-gray-300'} whitespace-pre-wrap`}
            style={{
              animation: idx === messages.length - 1 ? 'fadeIn 0.2s ease-out' : 'none',
            }}
          >
            {msg.text || '\u00A0'}
          </div>
        ))}

        {/* Typing cursor at end */}
        {isTyping && messages.length > 0 && (
          <span className="inline-block w-2 h-4 bg-gray-400 animate-cursor-blink" />
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
        <span>{messages.length} lines</span>
        <span>LangGraph State Machine</span>
      </div>
    </div>
  );
}

export default AgentStream;
