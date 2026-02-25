"use client";

import { useState, useEffect, useRef, useCallback, FormEvent } from "react";
import type { ChatMessage } from "@/lib/types";

interface ChatWindowProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  disabled: boolean;
  isLoading: boolean;
}

const TYPEWRITER_DELAY_MS = 20;

function AssistantMessage({
  content,
  onUpdate,
}: {
  content: string;
  onUpdate: () => void;
}) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let index = 0;
    setDisplayed("");

    const interval = setInterval(() => {
      index += 1;
      setDisplayed(content.slice(0, index));
      onUpdate(); // re-scroll as each character is added
      if (index >= content.length) {
        clearInterval(interval);
      }
    }, TYPEWRITER_DELAY_MS);

    return () => clearInterval(interval);
  }, [content, onUpdate]);

  return <span>{displayed}</span>;
}

export default function ChatWindow({
  messages,
  onSend,
  disabled,
  isLoading,
}: ChatWindowProps) {
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const isDisabled = disabled || isLoading;

  const scrollToBottom = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, []);

  // Scroll when messages are added or loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    onSend(trimmed);
  }

  return (
    <div className="flex flex-col h-full border-2 border-gb-dark shadow-pixel bg-gb-light">
      {/* Message list */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`font-mono text-xs leading-relaxed ${
              msg.role === "user"
                ? "text-gb-dark text-right"
                : "text-gb-mid text-left"
            }`}
          >
            {msg.role === "user" ? (
              <span>{msg.content}</span>
            ) : (
              <AssistantMessage content={msg.content} onUpdate={scrollToBottom} />
            )}
          </div>
        ))}

        {isLoading && (
          <div data-testid="loading-indicator" aria-hidden="true" />
        )}
      </div>

      {/* Input row */}
      <form onSubmit={handleSubmit} className="flex border-t-2 border-gb-dark">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isDisabled}
          placeholder={isLoading ? "thinking..." : disabled ? "heal me first!" : "say something..."}
          className="flex-1 bg-gb-screen font-mono text-xs text-gb-dark p-2 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isDisabled}
          className="font-mono text-xs bg-gb-mid text-gb-screen border-l-2 border-gb-dark px-3
            hover:bg-gb-dark active:bg-gb-dark
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-none"
          aria-label="Send"
        >
          ▶
        </button>
      </form>
    </div>
  );
}
